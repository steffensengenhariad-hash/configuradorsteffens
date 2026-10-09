export const MEASURES = [
  { id: 'A', family: 'balcao', group: 'Balcões', label: 'Altura', initial: 70, positive: true },
  { id: 'B', family: 'balcao', group: 'Balcões', label: 'Profundidade', initial: 55, positive: true },
  { id: 'C', family: 'armario', group: 'Armários', label: 'Altura', initial: 160, positive: true },
  { id: 'D', family: 'armario', group: 'Armários', label: 'Profundidade', initial: 55, positive: true },
  { id: 'E', family: 'superior', group: 'Superiores', label: 'Altura', initial: 50, positive: true },
  { id: 'F', family: 'superior', group: 'Superiores', label: 'Profundidade', initial: 35, positive: true },
  { id: 'G', family: 'gaveteiro', group: 'Gaveteiros volantes', label: 'Altura', initial: 66, positive: true },
  { id: 'H', family: 'balcao', group: 'Tampo', label: 'Avanço', initial: 2 },
  { id: 'I', family: 'balcao', group: 'Rodapés', label: 'Recuo', initial: 2 },
  { id: 'J', family: 'balcao', group: 'Rodapés', label: 'Altura', initial: 5 },
  { id: 'K', family: 'moldura', group: 'Moldura de engrossamento', label: 'Profundidade', initial: 7 },
];

export const INITIAL_DIMENSIONS = Object.fromEntries(MEASURES.map(m => [m.id, m.initial]));

export function validateStandards(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Configuração inválida.');
  if (!input.dimensions || typeof input.dimensions !== 'object' || Array.isArray(input.dimensions)) throw new Error('Informe as 11 dimensões.');
  const keys = Object.keys(input.dimensions);
  if (keys.length !== MEASURES.length || keys.some(k => !MEASURES.some(m => m.id === k))) throw new Error('A configuração deve conter somente as medidas A a K.');
  const dimensions = {};
  for (const m of MEASURES) {
    const v = input.dimensions[m.id];
    if (typeof v !== 'number' || !Number.isFinite(v) || v > 1000000 || (m.positive ? v <= 0 : v < 0)) throw new Error(`${m.id} — ${m.group}: informe uma medida ${m.positive ? 'maior que zero' : 'igual ou maior que zero'}.`);
    dimensions[m.id] = v;
  }
  if (!Array.isArray(input.clearances) || input.clearances.length > 200) throw new Error('Lista de folgas inválida (máximo de 200 registros).');
  const ids = new Set();
  const clearances = input.clearances.map(row => {
    if (!row || typeof row !== 'object' || typeof row.id !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(row.id) || ids.has(row.id)) throw new Error('Identificação de folga inválida ou repetida.');
    ids.add(row.id);
    if (typeof row.name !== 'string' || !row.name.trim() || row.name.length > 100) throw new Error('Informe a aplicação da folga (até 100 caracteres).');
    if (typeof row.value !== 'number' || !Number.isFinite(row.value) || row.value < 0 || row.value > 1000000) throw new Error('Informe uma folga igual ou maior que zero.');
    if (typeof row.note !== 'string' || row.note.length > 300) throw new Error('A observação deve ter até 300 caracteres.');
    return { id: row.id, name: row.name.trim(), value: row.value, note: row.note.trim() };
  });
  return { dimensions, clearances };
}
