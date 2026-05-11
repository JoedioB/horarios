const SLOTS = [
    { inicio: '08:00:00', fim: '08:45:00', periodo: 'manha' },
    { inicio: '08:45:00', fim: '09:30:00', periodo: 'manha' },
    { inicio: '09:45:00', fim: '10:30:00', periodo: 'manha' },
    { inicio: '10:30:00', fim: '11:15:00', periodo: 'manha' },
    { inicio: '11:15:00', fim: '12:00:00', periodo: 'manha' },
    { inicio: '13:00:00', fim: '13:45:00', periodo: 'tarde' },
    { inicio: '13:45:00', fim: '14:30:00', periodo: 'tarde' },
    { inicio: '14:30:00', fim: '15:15:00', periodo: 'tarde' },
    { inicio: '15:30:00', fim: '16:15:00', periodo: 'tarde' },
    { inicio: '16:15:00', fim: '17:00:00', periodo: 'tarde' },
];

const SLOTS_PARES = [
    { slot1: SLOTS[0], slot2: SLOTS[1] },
    { slot1: SLOTS[2], slot2: SLOTS[3] },
    { slot1: SLOTS[5], slot2: SLOTS[6] },
    { slot1: SLOTS[8], slot2: SLOTS[9] },
];

const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

/**
 * Verifica se um slot é válido para um determinado dia da semana.
 * Regra: Não há aula no período vespertino nas quartas (3) e quintas (4).
 */
const isSlotValidoParaDia = (dia, horaInicio) => {
    const slot = SLOTS.find(s => s.inicio === horaInicio);
    if (!slot) return false;
    
    // Se for Quarta (3) ou Quinta (4) e o período for 'tarde', o slot é INVÁLIDO.
    if ((dia === 3 || dia === 4) && slot.periodo === 'tarde') {
        return false;
    }
    return true;
};

module.exports = {
    SLOTS,
    SLOTS_PARES,
    DIAS_SEMANA,
    isSlotValidoParaDia
};