// src/controllers/horarioController.js
const geradorHorarioService = require('../services/geradorHorarioService');
const { Horario, Turma, Disciplina, Professor } = require('../models');

const exceljs = require('exceljs');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

const SLOTS = [
    { inicio: '08:00:00', fim: '08:45:00' }, { inicio: '08:45:00', fim: '09:30:00' },
    { inicio: '09:45:00', fim: '10:30:00' }, { inicio: '10:30:00', fim: '11:15:00' }, { inicio: '11:15:00', fim: '12:00:00' },
    { inicio: '13:00:00', fim: '13:45:00' }, { inicio: '13:45:00', fim: '14:30:00' }, { inicio: '14:30:00', fim: '15:15:00' },
    { inicio: '15:30:00', fim: '16:15:00' }, { inicio: '16:15:00', fim: '17:00:00' },
];
const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

// -- Sua função `gerar` existente --
exports.gerar = async (req, res) => {
    try {
        const resultado = await geradorHorarioService.gerar();
        console.log(resultado);
        res.redirect('/');
    } catch (error) {
        console.error("Erro ao gerar horário:", error);
        res.status(500).send("Erro ao gerar horário: " + error.message);
    }
};

// ####################################################################
// ## FUNÇÃO 'visualizarPorTurma' TOTALMENTE RESTAURADA E CORRIGIDA  ##
// ####################################################################
exports.visualizarPorTurma = async (req, res) => {
    try {
        const turmaId = req.params.id;
        const turma = await Turma.findByPk(turmaId);
        if (!turma) {
            return res.status(404).send('Turma não encontrada');
        }

        const horarios = await Horario.findAll({
            where: { turmaId },
            include: [Disciplina, Professor],
            order: [['dia_semana', 'ASC'], ['hora_inicio', 'ASC']]
        });

        const quadroHorario = {};
        horarios.forEach(h => {
            const key = `${h.dia_semana}-${h.hora_inicio}`;
            quadroHorario[key] = {
                disciplina: h.Disciplina.nome,
                professor: h.Professor.nome,
            };
        });

        res.render('horario-turma', {
            title: `Horário da Turma: ${turma.nome}`,
            turmaId: turmaId, // Passa o ID para a view usar nos links
            quadroHorario,
            diasDaSemana: DIAS_SEMANA,
            slots: SLOTS,
        });
    } catch (error) {
        console.error("Erro ao visualizar horário:", error);
        res.status(500).send("Erro ao buscar horário da turma.");
    }
};

// src/controllers/horarioController.js

// ... (seus requires e outras funções permanecem os mesmos) ...

/**
 * Gera o HTML do horário como uma string para ser usada no PDF.
 * Esta função cria um HTML autônomo com TODO o CSS necessário embutido.
 */
async function gerarHtmlParaPDF(turma, quadroHorario) {
    try {
        // Caminhos para os arquivos CSS
        const bootstrapPath = path.join(__dirname, '..', '..', 'node_modules', 'bootstrap', 'dist', 'css', 'bootstrap.min.css');
        const stylePath = path.join(__dirname, '..', '..', 'public', 'css', 'style.css');

        // Lê o conteúdo dos arquivos CSS. Usa 'fs.readFile' que é assíncrono.
        const bootstrapCSS = await fs.readFile(bootstrapPath, 'utf-8');
        const customCSS = await fs.readFile(stylePath, 'utf-8');

        let tableRows = '';
        let slotIndex = 0;
        for (const slot of SLOTS) {
            tableRows += '<tr>';
            tableRows += `<td><strong>${slot.inicio.substring(0, 5)} - ${slot.fim.substring(0, 5)}</strong></td>`;
            for (let dia = 1; dia <= 5; dia++) {
                const aula = quadroHorario[`${dia}-${slot.inicio}`];
                if (aula) {
                    tableRows += `<td><strong>${aula.disciplina}</strong><br><small class="text-muted">${aula.professor}</small></td>`;
                } else {
                    tableRows += '<td>-</td>';
                }
            }
            tableRows += '</tr>';
            
            if (slotIndex === 1) tableRows += '<tr class="table-light"><td colspan="6" class="text-center fw-bold small py-1">INTERVALO</td></tr>';
            if (slotIndex === 4) tableRows += '<tr class="table-light"><td colspan="6" class="text-center fw-bold small py-1">ALMOÇO</td></tr>';
            if (slotIndex === 7) tableRows += '<tr class="table-light"><td colspan="6" class="text-center fw-bold small py-1">INTERVALO</td></tr>';
            slotIndex++;
        }

        // Monta o documento HTML completo com CSS embutido
        return `
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <title>Horário - ${turma.nome}</title>
                <style>
                    /* Injeta o conteúdo completo do Bootstrap */
                    ${bootstrapCSS}
                    /* Injeta o seu CSS customizado */
                    ${customCSS}
                    /* Estilos específicos para garantir a impressão correta no PDF */
                    body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                    .table { font-size: 9pt; }
                    .table td, .table th { text-align: center; vertical-align: middle; padding: 0.25rem; }
                    .table-dark { background-color: #212529 !important; color: #fff !important; }
                    .table-light { background-color: #f8f9fa !important; }
                </style>
            </head>
            <body>
                <div class="container-fluid mt-3">
                    <h1 class="mb-3 text-center h3">Horário da Turma: ${turma.nome}</h1>
                    <table class="table table-bordered">
                        <thead class="table-dark">
                            <tr>
                                <th style="width: 15%;">Horário</th>
                                ${DIAS_SEMANA.map(dia => `<th>${dia}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            </body>
            </html>
        `;
    } catch (err) {
        console.error("ERRO ao ler arquivos CSS para o PDF:", err);
        // Retorna um HTML de erro se não conseguir ler os arquivos CSS
        return `<h1>Erro ao gerar PDF</h1><p>Não foi possível encontrar os arquivos de estilo. Verifique a instalação do Bootstrap.</p><p>${err.message}</p>`;
    }
}


/**
 * Exporta o horário de uma turma para um arquivo PDF.
 * Versão final e robusta, com espera explícita pela renderização do conteúdo.
 */
exports.exportarParaPDF = async (req, res) => {
    let browser = null;
    try {
        const turmaId = req.params.id;
        const turma = await Turma.findByPk(turmaId);
        if (!turma) return res.status(404).send('Turma não encontrada.');

        const horarios = await Horario.findAll({ where: { turmaId }, include: [Disciplina, Professor] });
        const quadroHorario = {};
        horarios.forEach(h => {
            quadroHorario[`${h.dia_semana}-${h.hora_inicio}`] = {
                disciplina: h.Disciplina.nome, professor: h.Professor.nome,
            };
        });

        console.log('[PDF] Gerando HTML autônomo...');
        const htmlContent = await gerarHtmlParaPDF(turma, quadroHorario);

        console.log('[PDF] Iniciando navegador...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
        });

        const page = await browser.newPage();
        
        console.log('[PDF] Definindo conteúdo da página...');
        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

        // --- CORREÇÃO CRÍTICA DE SINCRONIA ---
        // Espera explicitamente que a tabela seja renderizada antes de gerar o PDF.
        console.log('[PDF] Esperando pela tabela ser renderizada...');
        await page.waitForSelector('table', { timeout: 10000 });
        
        console.log('[PDF] Gerando o buffer do PDF...');
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            landscape: true,
            margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
        });
        
        console.log('[PDF] Fechando o navegador...');
        await browser.close();
        browser = null;

        console.log('[PDF] Geração concluída. Enviando resposta...');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="horario_${turma.nome.replace(/\s/g, '_')}.pdf"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error("Erro fatal ao exportar para PDF:", error);
        if (browser) await browser.close();
        if (!res.headersSent) {
            res.status(500).send("Erro interno ao gerar o arquivo PDF. Verifique os logs do servidor.");
        }
    }
};