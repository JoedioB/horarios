const fs = require('fs');
const path = require('path');
const { Professor, Disciplina, Turma, sequelize } = require('./src/models');
const { SLOTS } = require('./src/config/constants');

const diasMapa = {
    'segunda': 1, 'terça': 2, 'quarta': 3, 'quinta': 4, 'sexta': 5,
    'terca': 2, 'terça-feira': 2, 'quarta-feira': 3, 'quinta-feira': 4, 'sexta-feira': 5, 'segunda-feira': 1
};

async function aplicarDisponibilidade(professor, diaManutencaoStr, transaction) {
    const diaManutencao = diasMapa[diaManutencaoStr] || null;
    
    if (diaManutencao) {
        for (let d = 1; d <= 5; d++) {
            if (d === diaManutencao) continue; 
            for (const slot of SLOTS) {
                await sequelize.model('DisponibilidadeProfessor').findOrCreate({
                    where: {
                        professorId: professor.id,
                        dia_semana: d,
                        hora_inicio: slot.inicio,
                        hora_fim: slot.fim
                    },
                    transaction
                });
            }
        }
    } else {
        // Se não tem manutenção clara, disponível todos os dias
        for (let d = 1; d <= 5; d++) {
            for (const slot of SLOTS) {
                await sequelize.model('DisponibilidadeProfessor').findOrCreate({
                    where: {
                        professorId: professor.id,
                        dia_semana: d,
                        hora_inicio: slot.inicio,
                        hora_fim: slot.fim
                    },
                    transaction
                });
            }
        }
    }
}

async function importar() {
    const csvPath = path.join(__dirname, 'restricoes.csv');
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n');

    const t = await sequelize.transaction();

    try {
        console.log(`Iniciando processamento de ${lines.length} linhas...`);
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            if (line.startsWith(';Disciplina')) continue; // Pula cabeçalho

            const cols = line.split(';').map(c => c.trim());
            const nomeDisciplina = cols[1];
            const aulasPorSemana = parseInt(cols[3]);
            const nomeProfessor = cols[4];
            const nomeTurma = cols[5];
            const curso = cols[6];
            const diaManutencaoStr = cols[7] ? cols[7].toLowerCase() : '';

            if (!nomeProfessor) continue;

            // 1. Upsert Professor
            let [professor] = await Professor.findOrCreate({
                where: { nome: nomeProfessor },
                transaction: t
            });

            if (!nomeDisciplina || !nomeTurma) {
                // Apenas restrição
                await aplicarDisponibilidade(professor, diaManutencaoStr, t);
                continue;
            }

            // 2. Upsert Disciplina
            let [disciplina] = await Disciplina.findOrCreate({
                where: { nome: nomeDisciplina },
                defaults: { carga_horaria_semanal: aulasPorSemana || 2 },
                transaction: t
            });
            
            if (aulasPorSemana && disciplina.carga_horaria_semanal !== aulasPorSemana) {
                await disciplina.update({ carga_horaria_semanal: aulasPorSemana }, { transaction: t });
            }

            // 3. Upsert Turma
            let [turma] = await Turma.findOrCreate({
                where: { nome: nomeTurma, ano: curso || 'Padrão' },
                transaction: t
            });

            // 4. Associações
            await professor.addDisciplina(disciplina, { transaction: t });
            await turma.addDisciplina(disciplina, { transaction: t });

            // 5. Disponibilidade
            await aplicarDisponibilidade(professor, diaManutencaoStr, t);
        }

        await t.commit();
        console.log("Importação concluída com sucesso!");
    } catch (error) {
        await t.rollback();
        console.error("Erro na importação:", error);
    }
}

importar();
