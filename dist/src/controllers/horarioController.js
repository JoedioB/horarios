"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportarParaPDF = exports.exportarParaExcel = exports.visualizarPorTurma = exports.gerar = void 0;
const geradorHorarioService_1 = __importDefault(require("../services/geradorHorarioService"));
const models_1 = require("../models");
const exceljs = __importStar(require("exceljs"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const fs_1 = require("fs");
const path = __importStar(require("path"));
const constants_1 = require("../config/constants");
// Semáforo simples para limitar concorrência do Puppeteer
let activePdfGenerations = 0;
const MAX_CONCURRENT_PDFS = 2;
const gerar = async (req, res) => {
    try {
        const resultado = await geradorHorarioService_1.default.gerar();
        console.log(resultado);
        res.redirect('/');
    }
    catch (error) {
        console.error("Erro ao gerar horário:", error);
        res.status(500).send("Erro ao gerar horário: " + error.message);
    }
};
exports.gerar = gerar;
const visualizarPorTurma = async (req, res) => {
    try {
        const turmaId = parseInt(req.params.id, 10);
        if (isNaN(turmaId)) {
            res.status(400).send('ID de turma inválido');
            return;
        }
        const turma = await models_1.Turma.findByPk(turmaId);
        if (!turma) {
            res.status(404).send('Turma não encontrada');
            return;
        }
        const horarios = await models_1.Horario.findAll({
            where: { turmaId },
            include: [models_1.Disciplina, models_1.Professor],
            order: [['dia_semana', 'ASC'], ['hora_inicio', 'ASC']]
        });
        const quadroHorario = {};
        horarios.forEach((h) => {
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
            diasDaSemana: constants_1.DIAS_SEMANA,
            slots: constants_1.SLOTS,
        });
    }
    catch (error) {
        console.error("Erro ao visualizar horário:", error);
        res.status(500).send("Erro ao buscar horário da turma.");
    }
};
exports.visualizarPorTurma = visualizarPorTurma;
const exportarParaExcel = async (req, res) => {
    try {
        const turmaId = parseInt(req.params.id, 10);
        if (isNaN(turmaId)) {
            res.status(400).send('ID de turma inválido.');
            return;
        }
        const turma = await models_1.Turma.findByPk(turmaId);
        if (!turma) {
            res.status(404).send('Turma não encontrada.');
            return;
        }
        const horarios = await models_1.Horario.findAll({
            where: { turmaId },
            include: [models_1.Disciplina, models_1.Professor],
            order: [['dia_semana', 'ASC'], ['hora_inicio', 'ASC']]
        });
        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet(`Horário - ${turma.nome}`);
        // Cabeçalho
        const header = ['Horário', ...constants_1.DIAS_SEMANA];
        worksheet.addRow(header);
        // Estilo do Cabeçalho
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.alignment = { horizontal: 'center' };
        // Montagem das Linhas
        const quadroHorario = {};
        horarios.forEach((h) => {
            quadroHorario[`${h.dia_semana}-${h.hora_inicio}`] = `${h.Disciplina.nome}\n(${h.Professor.nome})`;
        });
        constants_1.SLOTS.forEach(slot => {
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
    }
    catch (error) {
        console.error("Erro ao exportar para Excel:", error);
        res.status(500).send("Erro ao gerar arquivo Excel.");
    }
};
exports.exportarParaExcel = exportarParaExcel;
async function gerarHtmlParaPDF(turma, quadroHorario) {
    try {
        const bootstrapPath = path.join(__dirname, '..', '..', 'node_modules', 'bootstrap', 'dist', 'css', 'bootstrap.min.css');
        const stylePath = path.join(__dirname, '..', '..', 'public', 'css', 'style.css');
        let bootstrapCSS = '';
        let customCSS = '';
        try {
            bootstrapCSS = await fs_1.promises.readFile(bootstrapPath, 'utf-8');
            customCSS = await fs_1.promises.readFile(stylePath, 'utf-8');
        }
        catch (e) {
            console.warn("Aviso: Arquivos CSS não encontrados nos caminhos esperados.");
        }
        let tableRows = '';
        let slotIndex = 0;
        for (const slot of constants_1.SLOTS) {
            tableRows += '<tr>';
            tableRows += `<td><strong>${slot.inicio.substring(0, 5)} - ${slot.fim.substring(0, 5)}</strong></td>`;
            for (let dia = 1; dia <= 5; dia++) {
                const aula = quadroHorario[`${dia}-${slot.inicio}`];
                if (aula) {
                    tableRows += `<td><strong>${aula.disciplina}</strong><br><small class="text-muted">${aula.professor}</small></td>`;
                }
                else {
                    tableRows += '<td>-</td>';
                }
            }
            tableRows += '</tr>';
            if (slotIndex === 1)
                tableRows += '<tr class="table-light"><td colspan="6" class="text-center fw-bold small py-1">INTERVALO</td></tr>';
            if (slotIndex === 4)
                tableRows += '<tr class="table-light"><td colspan="6" class="text-center fw-bold small py-1">ALMOÇO</td></tr>';
            if (slotIndex === 7)
                tableRows += '<tr class="table-light"><td colspan="6" class="text-center fw-bold small py-1">INTERVALO</td></tr>';
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
                                ${constants_1.DIAS_SEMANA.map(dia => `<th>${dia}</th>`).join('')}
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
    }
    catch (err) {
        console.error("ERRO ao ler arquivos CSS para o PDF:", err);
        return `<h1>Erro ao gerar PDF</h1><p>Não foi possível encontrar os arquivos de estilo. Verifique a instalação do Bootstrap.</p><p>${err.message}</p>`;
    }
}
const exportarParaPDF = async (req, res) => {
    let browser = null;
    try {
        if (activePdfGenerations >= MAX_CONCURRENT_PDFS) {
            res.status(503).send('Servidor sobrecarregado gerando PDFs. Tente novamente em alguns instantes.');
            return;
        }
        activePdfGenerations++;
        const turmaId = parseInt(req.params.id, 10);
        if (isNaN(turmaId)) {
            res.status(400).send('ID de turma inválido.');
            return;
        }
        const turma = await models_1.Turma.findByPk(turmaId);
        if (!turma) {
            res.status(404).send('Turma não encontrada.');
            return;
        }
        const horarios = await models_1.Horario.findAll({ where: { turmaId }, include: [models_1.Disciplina, models_1.Professor] });
        const quadroHorario = {};
        horarios.forEach((h) => {
            quadroHorario[`${h.dia_semana}-${h.hora_inicio}`] = {
                disciplina: h.Disciplina.nome, professor: h.Professor.nome,
            };
        });
        console.log('[PDF] Gerando HTML autônomo...');
        const htmlContent = await gerarHtmlParaPDF(turma, quadroHorario);
        console.log('[PDF] Iniciando navegador...');
        browser = await puppeteer_1.default.launch({
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
    }
    catch (error) {
        console.error("Erro fatal ao exportar para PDF:", error);
        if (browser)
            await browser.close();
        if (!res.headersSent) {
            res.status(500).send("Erro interno ao gerar o arquivo PDF. Verifique os logs do servidor.");
        }
    }
    finally {
        activePdfGenerations = Math.max(0, activePdfGenerations - 1);
    }
};
exports.exportarParaPDF = exportarParaPDF;
