import { Request, Response } from 'express';
import geradorHorarioService from '../services/geradorHorarioService';
import { Horario, Turma, Disciplina, Professor } from '../models';
import * as exceljs from 'exceljs';
import puppeteer, { Browser } from 'puppeteer';
import { promises as fs } from 'fs';
import * as path from 'path';
import { SLOTS, DIAS_SEMANA } from '../config/constants';

// Semáforo simples para limitar concorrência do Puppeteer
let activePdfGenerations = 0;
const MAX_CONCURRENT_PDFS = 2;

export const gerar = async (req: Request, res: Response): Promise<void> => {
    try {
        const resultado = await geradorHorarioService.gerar();
        console.log(resultado);
        res.redirect('/');
    } catch (error: any) {
        console.error("Erro ao gerar horário:", error);
        res.status(500).send("Erro ao gerar horário: " + error.message);
    }
};

export const visualizarPorTurma = async (req: Request, res: Response): Promise<void> => {
    try {
        const turmaId = parseInt(req.params.id as string, 10);
        if (isNaN(turmaId)) {
            res.status(400).send('ID de turma inválido');
            return;
        }

        const turma = await Turma.findByPk(turmaId);

        if (!turma) {
            res.status(404).send('Turma não encontrada');
            return;
        }

        const horarios = await Horario.findAll({
            where: { turmaId },
            include: [Disciplina, Professor],
            order: [['dia_semana', 'ASC'], ['hora_inicio', 'ASC']]
        });

        const quadroHorario: Record<string, { disciplina: string, professor: string }> = {};
        horarios.forEach((h: any) => {
            const key = `${h.dia_semana}-${h.hora_inicio}`;
            quadroHorario[key] = {
                disciplina: h.Disciplina.nome,
                professor: h.Professor.nome,
            };
        });

        res.render('horario-turma', {
            title: `Horário da Turma: ${turma.nome}`,
            turmaId: turmaId,
            quadroHorario,
            diasDaSemana: DIAS_SEMANA,
            slots: SLOTS,
        });
    } catch (error) {
        console.error("Erro ao visualizar horário:", error);
        res.status(500).send("Erro ao buscar horário da turma.");
    }
};

export const exportarParaExcel = async (req: Request, res: Response): Promise<void> => {
    try {
        const turmaId = parseInt(req.params.id as string, 10);
        if (isNaN(turmaId)) {
            res.status(400).send('ID de turma inválido.');
            return;
        }

        const turma = await Turma.findByPk(turmaId);
        if (!turma) {
            res.status(404).send('Turma não encontrada.');
            return;
        }

        const horarios = await Horario.findAll({
            where: { turmaId },
            include: [Disciplina, Professor],
            order: [['dia_semana', 'ASC'], ['hora_inicio', 'ASC']]
        });

        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet(`Horário - ${turma.nome}`);

        // Cabeçalho
        const header = ['Horário', ...DIAS_SEMANA];
        worksheet.addRow(header);

        // Estilo do Cabeçalho
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.alignment = { horizontal: 'center' };

        // Montagem das Linhas
        const quadroHorario: Record<string, string> = {};
        horarios.forEach((h: any) => {
            quadroHorario[`${h.dia_semana}-${h.hora_inicio}`] = `${h.Disciplina.nome}\n(${h.Professor.nome})`;
        });

        SLOTS.forEach(slot => {
            const rowData = [`${slot.inicio.substring(0, 5)} - ${slot.fim.substring(0, 5)}`];
            for (let dia = 1; dia <= 5; dia++) {
                rowData.push(quadroHorario[`${dia}-${slot.inicio}`] || '-');
            }
            const row = worksheet.addRow(rowData);
            row.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
        });

        worksheet.columns.forEach(column => {
            column.width = 20;
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="horario_${turma.nome.replace(/\s/g, '_')}.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Erro ao exportar para Excel:", error);
        res.status(500).send("Erro ao gerar arquivo Excel.");
    }
};

async function gerarHtmlParaPDF(turma: any, quadroHorario: Record<string, { disciplina: string, professor: string }>): Promise<string> {
    try {
        const bootstrapPath = path.join(__dirname, '..', '..', 'node_modules', 'bootstrap', 'dist', 'css', 'bootstrap.min.css');
        const stylePath = path.join(__dirname, '..', '..', 'public', 'css', 'style.css');

        let bootstrapCSS = '';
        let customCSS = '';
        try {
            bootstrapCSS = await fs.readFile(bootstrapPath, 'utf-8');
            customCSS = await fs.readFile(stylePath, 'utf-8');
        } catch (e) {
            console.warn("Aviso: Arquivos CSS não encontrados nos caminhos esperados.");
        }

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

        return `
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <title>Horário - ${turma.nome}</title>
                <style>
                    ${bootstrapCSS}
                    ${customCSS}
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
    } catch (err: any) {
        console.error("ERRO ao ler arquivos CSS para o PDF:", err);
        return `<h1>Erro ao gerar PDF</h1><p>Não foi possível encontrar os arquivos de estilo. Verifique a instalação do Bootstrap.</p><p>${err.message}</p>`;
    }
}

export const exportarParaPDF = async (req: Request, res: Response): Promise<void> => {
    let browser: Browser | null = null;
    try {
        if (activePdfGenerations >= MAX_CONCURRENT_PDFS) {
            res.status(503).send('Servidor sobrecarregado gerando PDFs. Tente novamente em alguns instantes.');
            return;
        }
        activePdfGenerations++;

        const turmaId = parseInt(req.params.id as string, 10);
        if (isNaN(turmaId)) {
            res.status(400).send('ID de turma inválido.');
            return;
        }

        const turma = await Turma.findByPk(turmaId);
        if (!turma) {
            res.status(404).send('Turma não encontrada.');
            return;
        }

        const horarios = await Horario.findAll({ where: { turmaId }, include: [Disciplina, Professor] });
        const quadroHorario: Record<string, { disciplina: string, professor: string }> = {};
        horarios.forEach((h: any) => {
            quadroHorario[`${h.dia_semana}-${h.hora_inicio}`] = {
                disciplina: h.Disciplina.nome, professor: h.Professor.nome,
            };
        });

        console.log('[PDF] Gerando HTML autônomo...');
        const htmlContent = await gerarHtmlParaPDF(turma, quadroHorario);

        console.log('[PDF] Iniciando navegador...');
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
        });

        const page = await browser.newPage();
        
        console.log('[PDF] Definindo conteúdo da página...');
        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

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
        if (browser) await (browser as Browser).close();
        if (!res.headersSent) {
            res.status(500).send("Erro interno ao gerar o arquivo PDF. Verifique os logs do servidor.");
        }
    } finally {
        activePdfGenerations = Math.max(0, activePdfGenerations - 1);
    }
};
