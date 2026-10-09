import { ENVIRONMENTS, createInitialModules, createInitialMethods } from './catalog.js?v=2';

export const SCHEMA_VERSION = 3;
export const LIMITS = Object.freeze({ modules: 120, piecesPerModule: 40, methods: 60, fittings: 100, hardwareIdsPerModule: 30 });
export const ATTACHMENT_LIMITS = Object.freeze({ fileBytes: 5242880, maxPerFitting: 10, totalBytes: 104857600 });
export const FITTING_CATEGORIES = [
  { id: 'hinge', title: 'Dobradiças' }, { id: 'sliding', title: 'Sistemas de correr' },
  { id: 'runner', title: 'Corrediças' }, { id: 'handle', title: 'Puxadores' },
  { id: 'lift', title: 'Articuladores' }, { id: 'other', title: 'Outras ferragens' },
];
export const OVERLAY_TYPES = [
  { id: 'pending', title: 'A definir' }, { id: 'full', title: 'Recobrimento total' },
  { id: 'half', title: 'Recobrimento central / parcial' }, { id: 'inset', title: 'Porta embutida' },
  { id: 'custom', title: 'Recobrimento específico' },
];
export const ATTACHMENT_MIMES = Object.freeze({ 'application/pdf': ['pdf'], 'image/png': ['png'], 'image/jpeg': ['jpg', 'jpeg'], 'image/webp': ['webp'] });
export const ATTACHMENT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const FITTING_NUMBERS = ['overlay','doorThickness','sideThickness','cupDiameter','cupDepth','cupDistance','openingAngle','gapTop','gapBottom','gapLeft','gapRight','gapBetween','doorOverlap','doorCount','trackCount','maxDoorWeight','widthDeduction','heightDeduction'];
const NONNEGATIVE_FITTING_NUMBERS = new Set(['overlay','cupDistance','gapTop','gapBottom','gapLeft','gapRight','gapBetween','doorOverlap','widthDeduction','heightDeduction']);
const GAP_FIELDS = ['gapTop','gapBottom','gapLeft','gapRight','gapBetween'];

export function createBlankFitting(title = 'Nova ferragem', fittingId = 'fitting_nova') {
  return {
    id: fittingId, title, category: 'other', brand: '', reference: '', documentRevision: '', status: 'draft',
    description: '', application: '', doorSystem: 'none', overlayType: 'pending',
    ...Object.fromEntries(FITTING_NUMBERS.map(name => [name, null])),
    cuttingRule: '', installation: '', checks: '', notes: '', technicalData: [], attachments: [],
  };
}
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
const ENVIRONMENT_IDS = new Set(ENVIRONMENTS.map(item => item.id));
const KINDS = new Set(['base', 'upper', 'tall', 'drawers', 'panel', 'top', 'piece']);
const FAMILIES = new Set(['balcao', 'armario', 'superior', 'gaveteiro', 'moldura', 'none']);
const EDGE_IDS = ['L1', 'L2', 'L3', 'L4'];
const STATUSES = ['draft', 'review', 'approved'];

function record(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function id(value, label, ids) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(value) || ids.has(value)) throw new Error(`${label}: identificação inválida ou repetida (até 64 caracteres).`);
  ids.add(value); return value;
}
function text(value, label, maximum, required = false) {
  if (value === undefined) value = '';
  if (typeof value !== 'string' || value.length > maximum || (required && !value.trim())) throw new Error(`${label}: ${required ? 'preencha o campo com' : 'use'} até ${maximum} caracteres.`);
  return value.trim();
}
function positive(value, label, integer = false) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > 1000000 || (integer && !Number.isSafeInteger(value))) throw new Error(`${label}: informe ${integer ? 'um número inteiro' : 'uma medida'} maior que zero ou deixe pendente.`);
  return value;
}
function choice(value, allowed, label, fallback) {
  if (value === undefined && fallback !== undefined) value = fallback;
  if (!allowed.includes(value)) throw new Error(`${label}: opção inválida.`);
  return value;
}
function list(value, maximum, label) {
  if (!Array.isArray(value) || value.length > maximum) throw new Error(`${label}: máximo de ${maximum} registros.`);
  return value;
}

// Reading an earlier body adds the catalog without changing its saved dimensions or clearances.
export function normalizeStandards(input) {
  if (!record(input)) throw new Error('Configuração inválida.');
  return {
    dimensions: input.dimensions,
    clearances: input.clearances,
    modules: (Object.hasOwn(input, 'modules') ? input.modules : createInitialModules()).map(module => ({ ...module, hardwareIds: Object.hasOwn(module, 'hardwareIds') ? module.hardwareIds : [] })),
    methods: Object.hasOwn(input, 'methods') ? input.methods : createInitialMethods(),
    fittings: Object.hasOwn(input, 'fittings') ? input.fittings : [],
  };
}

export function validateAttachmentName(name, mime) {
  if (typeof name !== 'string' || !name.trim() || name.length > 180 || name !== name.trim() || /^[.]/.test(name) || /[\\/:<>"'|?*\u0000-\u001f\u007f]/.test(name) || /[. ]$/.test(name)) throw new Error('Nome do anexo inválido. Use um nome simples, sem caminhos ou caracteres especiais.');
  const extension = name.slice(name.lastIndexOf('.') + 1).toLowerCase();
  if (!Object.hasOwn(ATTACHMENT_MIMES, mime) || !ATTACHMENT_MIMES[mime].includes(extension)) throw new Error('Envie somente PDF, PNG, JPEG ou WebP, com tipo e extensão correspondentes.');
  if (/(?:^|\.)(?:html?|svg|js|mjs|cjs|exe|com|bat|cmd|ps1|sh|php)(?:\.|$)/i.test(name)) throw new Error('Nome do anexo contém uma extensão não permitida.');
  return name;
}
export function validateAttachmentMetadata(value) {
  if (!record(value) || typeof value.id !== 'string' || !ATTACHMENT_ID_PATTERN.test(value.id)) throw new Error('Identificação de anexo inválida. Envie o arquivo novamente.');
  const name = validateAttachmentName(value.name, value.mime);
  if (!Number.isSafeInteger(value.size) || value.size <= 0 || value.size > ATTACHMENT_LIMITS.fileBytes) throw new Error('Tamanho de anexo inválido (máximo de 5 MiB).');
  if (typeof value.createdAt !== 'string' || !Number.isFinite(Date.parse(value.createdAt)) || new Date(value.createdAt).toISOString() !== value.createdAt) throw new Error('Data de envio do anexo inválida.');
  return { id: value.id, name, mime: value.mime, size: value.size, createdAt: value.createdAt };
}
function validateFittings(rows) {
  const ids = new Set();
  return list(rows, LIMITS.fittings, 'Lista de ferragens').map(row => {
    if (!record(row)) throw new Error('Ferragem inválida.');
    const result = {
      id: id(row.id, 'Ferragem', ids), title: text(row.title, 'Nome da ferragem', 80, true),
      category: choice(row.category, FITTING_CATEGORIES.map(item => item.id), 'Categoria da ferragem', 'other'),
      brand: text(row.brand, 'Marca da ferragem', 120), reference: text(row.reference, 'Referência da ferragem', 120),
      documentRevision: text(row.documentRevision, 'Revisão do documento da ferragem', 120),
      status: choice(row.status, STATUSES, 'Situação da ferragem', 'draft'),
      description: text(row.description, 'Descrição da ferragem', 2000), application: text(row.application, 'Aplicação da ferragem', 2000),
      doorSystem: choice(row.doorSystem, ['hinged','sliding','lift','none'], 'Sistema de porta', 'none'),
      overlayType: choice(row.overlayType, OVERLAY_TYPES.map(item => item.id), 'Tipo de recobrimento', 'pending'),
      cuttingRule: text(row.cuttingRule, 'Regra de corte da ferragem', 8000), installation: text(row.installation, 'Instalação da ferragem', 8000),
      checks: text(row.checks, 'Conferências da ferragem', 8000), notes: text(row.notes, 'Observações da ferragem', 2000),
    };
    for (const field of FITTING_NUMBERS) {
      const value = row[field];
      if (value === undefined || value === null) result[field] = null;
      else if (NONNEGATIVE_FITTING_NUMBERS.has(field)) {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1000000) throw new Error(`${result.title}: ${field} deve ser uma medida igual ou maior que zero ou ficar pendente.`);
        result[field] = value;
      } else result[field] = positive(value, `${result.title}: ${field}`, ['doorCount','trackCount'].includes(field));
    }
    const attachmentIds = new Set();
    const technicalIds = new Set();
    result.technicalData = list(row.technicalData ?? [], 30, `Cotas de ${result.title}`).map(cota => {
      if (!record(cota)) throw new Error('Cota técnica inválida.');
      return { id: id(cota.id, 'Cota técnica', technicalIds), label: text(cota.label, 'Descrição da cota', 80, true),
        value: cota.value === null || cota.value === undefined ? null : (() => {
          if (typeof cota.value !== 'number' || !Number.isFinite(cota.value) || cota.value < 0 || cota.value > 1000000) throw new Error('Cota técnica: use um valor igual ou maior que zero.');
          return cota.value;
        })(),
        unit: choice(cota.unit, ['pending','mm','cm','degree','kg'], 'Unidade da cota', 'pending'),
        note: text(cota.note, 'Observação da cota', 500) };
    });
    result.attachments = list(row.attachments ?? [], ATTACHMENT_LIMITS.maxPerFitting, `Anexos de ${result.title}`).map(value => {
      const metadata = validateAttachmentMetadata(value);
      if (attachmentIds.has(metadata.id)) throw new Error(`${result.title}: o mesmo anexo está repetido.`);
      attachmentIds.add(metadata.id); return metadata;
    });
    if (result.status === 'approved') {
      if ((result.category === 'hinge' && result.doorSystem !== 'hinged') || (result.category === 'sliding' && result.doorSystem !== 'sliding')) throw new Error(`${result.title}: escolha o sistema de porta correspondente à categoria da ferragem antes de aprovar.`);
      if (result.technicalData.some(cota => cota.value === null || cota.unit === 'pending')) throw new Error(`${result.title}: defina valor e unidade de todas as cotas técnicas antes de aprovar.`);
      if (!result.brand || !result.reference || !result.installation || !result.checks) throw new Error(`${result.title}: para aprovar, preencha marca, referência, instalação e conferências.`);
      if ((['hinge','sliding'].includes(result.category) || ['hinged','sliding'].includes(result.doorSystem)) && !result.attachments.length) throw new Error(`${result.title}: anexe a ficha técnica antes de aprovar esta ferragem.`);
      if (result.doorSystem === 'hinged' && (result.overlayType === 'pending' || result.overlay === null || result.doorThickness === null || result.sideThickness === null || GAP_FIELDS.some(field => result[field] === null))) throw new Error(`${result.title}: para aprovar a porta de abrir, defina recobrimento, espessuras e as cinco folgas.`);
      if (result.doorSystem === 'sliding' && (result.doorOverlap === null || result.doorCount === null || result.trackCount === null || GAP_FIELDS.some(field => result[field] === null) || !result.cuttingRule)) throw new Error(`${result.title}: para aprovar a porta de correr, defina sobreposição, quantidade de portas e trilhos, as cinco folgas e a regra de corte do fabricante.`);
    }
    return result;
  });
}

function validateMethods(rows) {
  const ids = new Set();
  return list(rows, LIMITS.methods, 'Lista de métodos').map(row => {
    if (!record(row)) throw new Error('Método produtivo inválido.');
    const result = {
      id: id(row.id, 'Método', ids),
      title: text(row.title, 'Título do método', 80, true),
      category: text(row.category, 'Categoria do método', 80),
      status: choice(row.status, STATUSES, 'Situação do método', 'draft'),
      description: text(row.description, 'Descrição do método', 2000),
      steps: text(row.steps, 'Etapas do método', 8000),
      checks: text(row.checks, 'Conferências do método', 8000),
      notes: text(row.notes, 'Observações do método', 2000),
    };
    if (result.status === 'approved' && (!result.steps || !result.checks)) throw new Error(`${result.title}: para aprovar o método, preencha as etapas e as conferências de produção.`);
    return result;
  });
}
function validatePieces(rows, moduleTitle) {
  const ids = new Set();
  return list(rows ?? [], LIMITS.piecesPerModule, `Peças de ${moduleTitle}`).map(row => {
    if (!record(row)) throw new Error(`${moduleTitle}: peça inválida.`);
    if (row.edges !== undefined && !record(row.edges)) throw new Error(`${moduleTitle}: bordas da peça inválidas.`);
    const edges = Object.fromEntries(EDGE_IDS.map(side => {
      const edge = row.edges?.[side] ?? {};
      if (!record(edge)) throw new Error(`${moduleTitle}: borda ${side} inválida.`);
      return [side, {
        mode: choice(edge.mode, ['pending', 'none', 'band'], `Borda ${side}`, 'pending'),
        material: text(edge.material, `Material da borda ${side}`, 120),
        thickness: positive(edge.thickness, `Espessura da borda ${side}`),
        width: positive(edge.width, `Largura da borda ${side}`),
      }];
    }));
    return {
      id: id(row.id, 'Peça', ids), name: text(row.name, 'Nome da peça', 80, true),
      quantity: positive(row.quantity, 'Quantidade da peça', true),
      width: positive(row.width, 'Largura acabada da peça'), height: positive(row.height, 'Altura acabada da peça'),
      thickness: positive(row.thickness, 'Espessura da peça'), material: text(row.material, 'Material da peça', 120),
      grain: choice(row.grain, ['pending', 'horizontal', 'vertical', 'none'], 'Sentido do veio', 'pending'),
      cutMode: choice(row.cutMode, ['pending', 'finished', 'subtract', 'manual'], 'Critério de corte', 'pending'),
      cutWidth: positive(row.cutWidth, 'Largura de corte manual'), cutHeight: positive(row.cutHeight, 'Altura de corte manual'),
      notes: text(row.notes, 'Observações da peça', 2000), edges,
    };
  });
}
export function pieceCutDimensions(piece) {
  if (!record(piece)) return null;
  const isPositive = value => typeof value === 'number' && Number.isFinite(value) && value > 0;
  if (!isPositive(piece.width) || !isPositive(piece.height)) return null;
  if (piece.cutMode === 'manual') return isPositive(piece.cutWidth) && isPositive(piece.cutHeight) ? { width: piece.cutWidth, height: piece.cutHeight } : null;
  if (piece.cutMode === 'finished') return { width: piece.width, height: piece.height };
  if (piece.cutMode !== 'subtract') return null;
  const band = {};
  for (const side of EDGE_IDS) {
    const edge = piece.edges?.[side];
    if (!record(edge) || !['none', 'band'].includes(edge.mode) || (edge.mode === 'band' && !isPositive(edge.thickness))) return null;
    band[side] = edge.mode === 'band' ? edge.thickness : 0;
  }
  const width = Math.round((piece.width - band.L2 - band.L4) * 1e10) / 1e10;
  const height = Math.round((piece.height - band.L1 - band.L3) * 1e10) / 1e10;
  return isPositive(width) && isPositive(height) ? { width, height } : null;
}

function requireApprovedPiece(piece, moduleTitle) {
  const label = `${moduleTitle} — ${piece.name}`;
  if (piece.quantity === null || piece.width === null || piece.height === null || piece.thickness === null || !piece.material || piece.grain === 'pending' || piece.cutMode === 'pending') throw new Error(`${label}: para aprovar, defina quantidade, medidas acabadas, espessura, material, sentido do veio e critério de corte.`);
  if (piece.cutMode === 'manual' && (piece.cutWidth === null || piece.cutHeight === null)) throw new Error(`${label}: informe as duas medidas do corte manual antes de aprovar.`);
  for (const side of EDGE_IDS) {
    const edge = piece.edges[side];
    if (edge.mode === 'pending' || (edge.mode === 'band' && (!edge.material || edge.thickness === null || edge.width === null))) throw new Error(`${label}: defina a borda ${side} como sem fita ou informe material, espessura e largura da fita antes de aprovar.`);
    if (edge.mode === 'band' && edge.width < piece.thickness) throw new Error(label + ': a largura da fita na borda ' + side + ' deve ser igual ou maior que a espessura da peça antes de aprovar.');
  }
  if (!pieceCutDimensions(piece)) throw new Error(label + ': as medidas de corte devem continuar maiores que zero após o desconto das bordas.');
}
function validateModules(rows, methods, fittings, priorModules = []) {
  const ids = new Set();
  const methodById = new Map(methods.map(method => [method.id, method]));
  const fittingById = new Map(fittings.map(fitting => [fitting.id, fitting]));
  const priorById = new Map(priorModules.map(module => [module.id, module]));
  return list(rows, LIMITS.modules, 'Lista de módulos').map(row => {
    if (!record(row)) throw new Error('Módulo inválido.');
    if (!ENVIRONMENT_IDS.has(row.environmentId)) throw new Error('Selecione um ambiente válido para o módulo.');
    if (!KINDS.has(row.kind) || !FAMILIES.has(row.family)) throw new Error('Tipo ou família de módulo inválido.');
    const title = text(row.title, 'Título do módulo', 80, true);
    const result = {
      id: id(row.id, 'Módulo', ids), environmentId: row.environmentId,
      subgroup: text(row.subgroup, 'Subgrupo do módulo', 80), title, kind: row.kind, family: row.family,
      status: choice(row.status, STATUSES, 'Situação do módulo', 'draft'),
      width: positive(row.width, 'Largura do módulo'), height: positive(row.height, 'Altura do módulo'),
      depth: positive(row.depth, 'Profundidade do módulo'), thickness: positive(row.thickness, 'Espessura do módulo'),
      material: text(row.material, 'Material do módulo', 120), finish: text(row.finish, 'Acabamento do módulo', 120),
      hardware: text(row.hardware, 'Ferragens do módulo', 2000), methodId: text(row.methodId, 'Método do módulo', 64),
      assembly: text(row.assembly, 'Montagem do módulo', 8000), quality: text(row.quality, 'Conferências do módulo', 8000),
      notes: text(row.notes, 'Observações do módulo', 2000), pieces: validatePieces(row.pieces, title),
    };
    const hardwareIds = Object.hasOwn(row, 'hardwareIds') ? row.hardwareIds : priorById.get(row.id)?.hardwareIds ?? [];
    const hardwareSet = new Set();
    result.hardwareIds = list(hardwareIds, LIMITS.hardwareIdsPerModule, `Ferragens de ${title}`).map(value => {
      const fittingId = id(value, `Ferragem de ${title}`, hardwareSet);
      if (!fittingById.has(fittingId)) throw new Error(`${title}: a ferragem vinculada não existe. Revise os vínculos antes de salvar.`);
      return fittingId;
    });
    if (result.methodId && !/^[A-Za-z0-9_-]{1,64}$/.test(result.methodId)) throw new Error(`${title}: identificação do método inválida.`);
    if (result.status === 'approved') {
      if (result.width === null || result.height === null || (result.kind === 'piece' ? result.thickness === null : result.depth === null) || !result.material) throw new Error(`${title}: para aprovar, defina as medidas e o material do módulo.`);
      if (!result.pieces.length) throw new Error(`${title}: cadastre pelo menos uma peça antes de aprovar.`);
      if (!result.hardware || !result.assembly || !result.quality) throw new Error(`${title}: para aprovar, defina ferragens, montagem e conferências. Use “Não se aplica” quando adequado.`);
      if (methodById.get(result.methodId)?.status !== 'approved') throw new Error(`${title}: vincule um método produtivo aprovado antes de aprovar o módulo.`);
      if (result.hardwareIds.some(fittingId => fittingById.get(fittingId).status !== 'approved')) throw new Error(`${title}: todas as ferragens vinculadas devem estar aprovadas antes de aprovar o módulo.`);
      for (const piece of result.pieces) requireApprovedPiece(piece, title);
    }
    return result;
  });
}

export function validateStandards(input, { existing } = {}) {
  if (!record(input)) throw new Error('Configuração inválida.');
  if (!record(input.dimensions)) throw new Error('Informe as 11 dimensões.');
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
    if (!record(row) || typeof row.id !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(row.id) || ids.has(row.id)) throw new Error('Identificação de folga inválida ou repetida.');
    ids.add(row.id);
    if (typeof row.name !== 'string' || !row.name.trim() || row.name.length > 100) throw new Error('Informe a aplicação da folga (até 100 caracteres).');
    if (typeof row.value !== 'number' || !Number.isFinite(row.value) || row.value < 0 || row.value > 1000000) throw new Error('Informe uma folga igual ou maior que zero.');
    if (typeof row.note !== 'string' || row.note.length > 300) throw new Error('A observação deve ter até 300 caracteres.');
    return { id: row.id, name: row.name.trim(), value: row.value, note: row.note.trim() };
  });
  const prior = existing ? normalizeStandards(existing) : null;
  const methods = validateMethods(Object.hasOwn(input, 'methods') ? input.methods : prior?.methods ?? createInitialMethods());
  const fittings = validateFittings(Object.hasOwn(input, 'fittings') ? input.fittings : prior?.fittings ?? []);
  const modules = validateModules(Object.hasOwn(input, 'modules') ? input.modules : prior?.modules ?? createInitialModules(), methods, fittings, prior?.modules ?? []);
  return { dimensions, clearances, modules, methods, fittings };
}
