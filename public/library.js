import { ENVIRONMENTS, MODULE_CATALOG, METHOD_CATALOG, EDGE_SIDES, PRODUCTION_STEPS, createBlankPiece } from './catalog.js?v=2';
import { LIMITS, pieceCutDimensions } from './model.js?v=3.1';

const STATUS = [['draft', 'Pendente'], ['review', 'Em conferência'], ['approved', 'Aprovado']];
const GRAIN = [['pending', 'A definir'], ['horizontal', 'Horizontal'], ['vertical', 'Vertical'], ['none', 'Sem sentido obrigatório']];
const CUT_MODES = [['pending', 'A definir'], ['finished', 'Corte igual à medida acabada'], ['subtract', 'Descontar espessura das bordas'], ['manual', 'Medida de corte informada']];
const EDGE_MODES = [['pending', 'A definir'], ['none', 'Sem fita de borda'], ['band', 'Com fita de borda']];
const KINDS = [['base', 'Balcão / módulo inferior'], ['tall', 'Armário alto'], ['upper', 'Módulo superior'], ['drawers', 'Gaveteiro'], ['panel', 'Painel / revestimento'], ['top', 'Tampo / bancada'], ['piece', 'Peça individual']];
const TABS = [['overview', 'Visão geral'], ['measures', 'Medidas'], ['pieces', 'Peças'], ['edges', 'Bordas'], ['hardware', 'Ferragens'], ['assembly', 'Montagem'], ['quality', 'Conferência']];
const SIDES = [{ id: 'L1', label: 'Superior' }, { id: 'L2', label: 'Direita' }, { id: 'L3', label: 'Inferior' }, { id: 'L4', label: 'Esquerda' }];
const NS = 'http://www.w3.org/2000/svg';
const format = value => Number.isFinite(value) ? new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 10 }).format(value) : 'Pendente';
const size = value => Number.isFinite(value) ? format(value) + ' cm' : 'Pendente';
const titleOf = record => record?.title || record?.name || 'Sem identificação';
const normalized = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function el(tag, className = '', text = null) {
  const result = document.createElement(tag);
  if (className) result.className = className;
  if (text !== null) result.textContent = String(text);
  return result;
}
function add(parent, ...children) { for (const child of children.flat()) if (child) parent.append(child); return parent; }
function button(text, action, className = 'button secondary', disabled = false) {
  const result = el('button', className, text); result.type = 'button'; result.disabled = disabled; result.onclick = action; return result;
}
function svgEl(tag, attributes = {}, text = null) {
  const result = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) result.setAttribute(key, String(value));
  if (text !== null) result.textContent = String(text);
  return result;
}
function options(select, values, current) {
  for (const [value, label] of values) { const option = el('option', '', label); option.value = value; select.append(option); }
  select.value = current ?? '';
}
function hint(text) { return el('p', 'library-hint', text); }
function statusBadge(status) { return el('span', 'module-status status-' + (status || 'draft'), STATUS.find(pair => pair[0] === status)?.[1] || 'Pendente'); }
function empty(title, description, action = null) { return add(el('div', 'library-empty'), el('h3', '', title), el('p', '', description), action); }

// As dimensões cadastradas são acabadas. O desconto só ocorre no modo escolhido pelo responsável.
export function calculatePieceCut(piece) {
  if (!piece) return { width: null, height: null, message: 'Selecione uma peça.' };
  if (!['finished', 'subtract', 'manual'].includes(piece.cutMode)) return { width: null, height: null, message: 'Defina como obter a medida de corte.' };
  if (!Number.isFinite(piece.width) || !Number.isFinite(piece.height) || piece.width <= 0 || piece.height <= 0) return { width: null, height: null, message: 'Informe largura e altura acabadas positivas.' };
  if (piece.cutMode === 'manual') {
    const cut = pieceCutDimensions(piece);
    return cut ? { ...cut, message: 'Medida de corte informada pelo responsável.' } : { width: null, height: null, message: 'Informe largura e altura de corte manual positivas.' };
  }
  if (piece.cutMode === 'finished') return { width: piece.width, height: piece.height, message: 'A medida de corte é igual à medida acabada.' };
  for (const side of SIDES) {
    const edge = piece.edges?.[side.id];
    if (!edge || edge.mode === 'pending' || !['none', 'band'].includes(edge.mode)) return { width: null, height: null, message: 'Defina as quatro bordas antes de calcular o desconto.' };
    if (edge.mode === 'band') {
      if (!Number.isFinite(edge.thickness) || edge.thickness <= 0) return { width: null, height: null, message: 'Informe a espessura de cada fita aplicada.' };
    }
  }
  const cut = pieceCutDimensions(piece);
  if (!cut) return { width: null, height: null, message: 'O desconto das bordas deixa uma medida de corte nula ou negativa. Confira o cadastro.' };
  return { ...cut, message: 'Largura desconta L2 e L4; altura desconta L1 e L3. Sem desconto automático de serra ou folga.' };
}

function moduleDrawing(module) {
  const svg = svgEl('svg', { viewBox: '0 0 330 230', class: 'module-schematic', role: 'img', 'aria-label': 'Desenho esquemático do módulo, sem escala' });
  const kind = module?.kind || 'base';
  const stroke = '#94785f';
  const paint = path => svgEl('path', { d: path, fill: '#d3b99d', stroke, 'stroke-width': 2 });
  if (kind === 'top') {
    add(svg, paint('M55 126L104 87H274L225 126Z'), svgEl('path', { d: 'M55 126V139H225V126M225 126L274 87V100L225 139', fill: '#aa896d', stroke, 'stroke-width': 2 }), svgEl('path', { d: 'M74 129H204', fill: 'none', stroke: '#e6d7c7', 'stroke-width': 2 }));
  } else if (kind === 'piece' || kind === 'panel') {
    const x = kind === 'panel' ? 116 : 73, y = kind === 'panel' ? 33 : 57, w = kind === 'panel' ? 94 : 178, h = kind === 'panel' ? 155 : 121;
    add(svg, svgEl('path', { d: 'M' + (x + w) + ' ' + y + 'l9 -8v' + h + 'l-9 8Z', fill: '#aa896d', stroke, 'stroke-width': 2 }), svgEl('rect', { x, y, width: w, height: h, fill: '#dbc7b3', stroke, 'stroke-width': 2 }));
    if (kind === 'piece') add(svg, svgEl('text', { x: x + w / 2, y: y + h / 2 + 4, 'text-anchor': 'middle', fill: '#94785f', 'font-size': 13 }, 'PEÇA'));
    else for (const offset of [23, 47, 71]) add(svg, svgEl('path', { d: 'M' + (x + offset) + ' ' + (y + 6) + 'v' + (h - 12), stroke: '#c0a68d', 'stroke-width': 1 }));
  } else {
    const geometry = { base: [70, 77, 160, 108, 29], upper: [83, 72, 137, 83, 28], tall: [116, 32, 87, 155, 27], drawers: [111, 66, 94, 119, 27] }[kind] || [70, 77, 160, 108, 29];
    const [x, y, w, h, depth] = geometry, dy = depth * .64;
    add(svg, paint('M' + x + ' ' + y + 'l' + depth + ' -' + dy + 'h' + w + 'l-' + depth + ' ' + dy + 'Z'), svgEl('path', { d: 'M' + (x + w) + ' ' + y + 'l' + depth + ' -' + dy + 'v' + h + 'l-' + depth + ' ' + dy + 'Z', fill: '#aa896d', stroke, 'stroke-width': 2 }), svgEl('rect', { x, y, width: w, height: h, fill: '#dbc7b3', stroke, 'stroke-width': 2 }));
    if (kind === 'drawers') {
      for (let index = 1; index <= 4; index++) { const lineY = y + h * index / 4; if (index < 4) add(svg, svgEl('path', { d: 'M' + (x + 1) + ' ' + lineY + 'h' + (w - 2), stroke, 'stroke-width': 2 })); add(svg, svgEl('path', { d: 'M' + (x + w / 2 - 12) + ' ' + (lineY - h / 8) + 'h24', stroke: '#526174', 'stroke-width': 3 })); }
      add(svg, svgEl('circle', { cx: x + 13, cy: y + h + 6, r: 5, fill: '#526174' }), svgEl('circle', { cx: x + w - 13, cy: y + h + 6, r: 5, fill: '#526174' }));
    } else {
      const doorY = kind === 'tall' ? y + h * .32 : y, doorH = y + h - doorY;
      if (kind === 'tall') add(svg, svgEl('rect', { x: x + 2, y: y + 2, width: w - 4, height: h * .32 - 2, fill: '#ede5dc' }), svgEl('path', { d: 'M' + x + ' ' + doorY + 'h' + w + 'M' + x + ' ' + (y + h * .16) + 'h' + w, stroke, 'stroke-width': 2 }));
      add(svg, svgEl('path', { d: 'M' + (x + w / 2) + ' ' + doorY + 'v' + doorH + 'M' + (x + w / 2 - 8) + ' ' + (doorY + doorH * .25) + 'v17M' + (x + w / 2 + 8) + ' ' + (doorY + doorH * .25) + 'v17', stroke, 'stroke-width': 2 }));
      if (kind === 'base') add(svg, svgEl('path', { d: 'M' + (x - 4) + ' ' + (y - 3) + 'h' + (w + 8), stroke: '#526174', 'stroke-width': 5 }), svgEl('rect', { x: x + 6, y: y + h - 9, width: w - 12, height: 9, fill: '#aa896d' }));
    }
  }
  const heightLabel = kind === 'top' ? 'Espessura: ' + size(module?.thickness) : 'Altura: ' + size(module?.height);
  const depthLabel = ['piece', 'panel'].includes(kind) ? 'Esp.: ' + size(module?.thickness) : 'Prof.: ' + size(module?.depth);
  add(svg, svgEl('text', { x: 160, y: 215, 'text-anchor': 'middle', fill: '#46566c', 'font-size': 12 }, 'Largura: ' + size(module?.width)), svgEl('text', { x: 20, y: 128, fill: '#46566c', 'font-size': 12, transform: 'rotate(-90 20 128)', 'text-anchor': 'middle' }, heightLabel), svgEl('text', { x: 242, y: 21, 'text-anchor': 'middle', fill: '#46566c', 'font-size': 11 }, depthLabel));
  add(svg, svgEl('text', { x: 316, y: 228, 'text-anchor': 'end', fill: '#9aa6b6', 'font-size': 9 }, 'SEM ESCALA'));
  return svg;
}

export function createLibraryController({ getData, canEdit, isSaving, onChange, requestEdit, notice, confirmAction, onNavigate, onOpenFitting }) {
  const container = document.querySelector('#library-view');
  const navigation = document.querySelector('#environment-nav');
  if (!container) throw new Error('O contêiner da biblioteca não foi encontrado.');
  const state = { view: 'catalog', environmentId: null, subgroup: null, moduleId: null, tab: 'overview', pieceId: null, edgeId: 'L1', search: '', edgeEnvironmentId: 'all', edgeModuleId: null, methodId: null };
  const data = () => getData() || { modules: [], methods: [], dimensions: {} };
  const modules = () => Array.isArray(data().modules) ? data().modules : [];
  const methods = () => Array.isArray(data().methods) ? data().methods : [];
  const editable = () => !!canEdit() && !isSaving();
  const moduleById = id => modules().find(record => record.id === id);
  const methodById = id => methods().find(record => record.id === id);
  const environmentById = id => ENVIRONMENTS.find(record => record.id === id);
  function change(mutator, rerender = false) {
    if (!canEdit()) { requestEdit(); return false; }
    if (isSaving()) { notice('Aguarde o salvamento antes de continuar a edição.'); return false; }
    onChange(mutator);
    if (rerender) render();
    return true;
  }
  function updateModule(id, key, value, after = null) {
    if (change(draft => { const record = draft.modules.find(item => item.id === id); if (record) record[key] = value; }) && after) after();
  }
  function updatePiece(moduleId, pieceId, key, value, after = null) {
    if (change(draft => { const piece = draft.modules.find(item => item.id === moduleId)?.pieces.find(item => item.id === pieceId); if (piece) piece[key] = value; }) && after) after();
  }
  function navigate(view) { state.view = view; onNavigate(view); render(); }
  function openEnvironment(id) { onNavigate('catalog'); state.environmentId = id; state.subgroup = null; state.moduleId = null; state.search = ''; state.view = 'catalog'; render(); }
  function openModule(id, tab = 'overview', pieceId = null) {
    const record = moduleById(id); if (!record) return;
    onNavigate('catalog'); state.view = 'catalog'; state.environmentId = record.environmentId; state.subgroup = record.subgroup; state.moduleId = id; state.tab = tab; state.pieceId = pieceId; state.search = ''; render();
  }
  function editPrompt() {
    if (canEdit()) return hint('As alterações ficam na edição atual. Use “Salvar padrão” para disponibilizá-las à equipe.');
    return add(el('div', 'library-readonly'), el('span', '', 'Consulta pública. O responsável pode entrar para definir ou alterar este cadastro.'), button('Entrar para editar', requestEdit, 'button secondary small'));
  }
  function field(label, value, setter, settings = {}) {
    const wrapper = el('label', 'module-field' + (settings.wide ? ' field-wide' : ''));
    const caption = el('span', 'module-field-label', label); let input;
    if (settings.options) { input = el('select', 'module-select'); options(input, settings.options, value); }
    else if (settings.textarea) { input = el('textarea', 'module-textarea'); input.rows = settings.rows || 4; input.value = value || ''; }
    else { input = el('input', 'module-input'); input.type = settings.number ? 'number' : 'text'; input.value = value ?? ''; if (settings.number) { input.step = settings.integer ? '1' : 'any'; input.min = settings.min ?? '0'; } }
    input.disabled = !editable() || !!settings.disabled;
    input.setAttribute('aria-label', label);
    if (settings.maxLength) input.maxLength = settings.maxLength;
    if (settings.placeholder) input.placeholder = settings.placeholder;
    const commit = () => setter(settings.number ? (input.value === '' ? null : input.valueAsNumber) : input.value);
    if (settings.options) input.onchange = commit; else input.oninput = commit;
    add(wrapper, caption, input, settings.hint ? el('small', 'module-field-hint', settings.hint) : null);
    return wrapper;
  }
  function header(title, description, actions = []) {
    const result = el('div', 'library-header');
    add(result, add(el('div', 'library-heading'), el('h2', '', title), description ? el('p', '', description) : null), add(el('div', 'library-actions'), actions));
    return result;
  }
  function breadcrumb(parts) {
    const nav = el('nav', 'catalog-breadcrumb'); nav.setAttribute('aria-label', 'Caminho na biblioteca');
    parts.forEach((part, index) => { if (index) nav.append(el('span', 'breadcrumb-separator', '›')); nav.append(part.action ? button(part.label, part.action, 'button quiet small') : el('span', '', part.label)); });
    return nav;
  }
  function sidebar() {
    if (!navigation) return;
    navigation.replaceChildren(...ENVIRONMENTS.map(environment => {
      const count = modules().filter(record => record.environmentId === environment.id).length;
      const item = button(titleOf(environment) + ' · ' + count, () => openEnvironment(environment.id), 'environment-button' + (state.view === 'catalog' && state.environmentId === environment.id ? ' active' : ''));
      if (state.view === 'catalog' && state.environmentId === environment.id) item.setAttribute('aria-current', 'page');
      return item;
    }));
  }
  function searchBox() {
    const input = el('input', 'library-search'); input.type = 'search'; input.placeholder = 'Buscar ambiente, grupo, módulo ou peça'; input.value = state.search; input.setAttribute('aria-label', 'Buscar na biblioteca de módulos');
    input.oninput = () => { state.search = input.value; state.moduleId = null; renderCatalogContent(); };
    return input;
  }
  function matches(record, search) {
    const environment = environmentById(record.environmentId);
    return normalized([titleOf(environment), record.subgroup, record.title, record.kind, record.material, ...(record.pieces || []).map(piece => piece.name)].join(' ')).includes(normalized(search));
  }
  function moduleCard(record) {
    const card = el('article', 'catalog-card module-card');
    add(card, add(el('div', 'catalog-card-top'), el('span', 'catalog-eyebrow', titleOf(environmentById(record.environmentId)) + ' · ' + record.subgroup), statusBadge(record.status)), moduleDrawing(record), el('h3', '', record.title), el('p', 'catalog-card-description', MODULE_CATALOG.find(entry => entry.id === record.id)?.description || 'Módulo cadastrado pelo responsável.'), el('p', 'module-card-size', 'L ' + size(record.width) + ' · A ' + size(record.height) + ' · P ' + size(record.depth)), button('Consultar módulo', () => openModule(record.id), 'button secondary'));
    return card;
  }
  function renderCatalog() {
    if (state.moduleId && moduleById(state.moduleId)) return renderModule();
    state.moduleId = null;
    container.replaceChildren(header('Biblioteca de módulos', 'Escolha o ambiente, depois o grupo e o módulo. Medidas e materiais pendentes precisam ser definidos pelo responsável.', [button('Cadastrar módulo', () => newModule(), 'button secondary', isSaving())]), searchBox(), el('div', 'catalog-content'));
    renderCatalogContent();
  }
  function renderCatalogContent() {
    const target = container.querySelector('.catalog-content'); if (!target) return;
    const environment = environmentById(state.environmentId);
    const parts = [{ label: 'Ambientes', action: () => { state.environmentId = null; state.subgroup = null; state.search = ''; render(); } }];
    if (environment) parts.push({ label: titleOf(environment), action: state.subgroup ? () => { state.subgroup = null; render(); } : null });
    if (state.subgroup) parts.push({ label: state.subgroup });
    target.replaceChildren(breadcrumb(parts));
    if (state.search.trim()) {
      const found = modules().filter(record => matches(record, state.search));
      add(target, el('p', 'library-result-count', found.length + ' módulos encontrados'), found.length ? add(el('div', 'library-grid'), found.map(moduleCard)) : empty('Nenhum módulo encontrado', 'Busque pelo ambiente, grupo, nome do módulo ou nome da peça.'));
      return;
    }
    if (!environment) {
      const grid = el('div', 'library-grid environment-grid');
      for (const entry of ENVIRONMENTS) {
        const environmentModules = modules().filter(record => record.environmentId === entry.id);
        const groups = new Set(environmentModules.map(record => record.subgroup));
        const card = el('article', 'catalog-card environment-card');
        add(card, el('span', 'environment-icon', entry.icon || '▦'), el('h3', '', titleOf(entry)), el('p', '', entry.description || 'Padrões e módulos para este ambiente.'), el('span', 'catalog-count', groups.size + ' grupos · ' + environmentModules.length + ' módulos'), button('Abrir ambiente', () => openEnvironment(entry.id), 'button secondary'));
        grid.append(card);
      }
      target.append(grid); return;
    }
    const records = modules().filter(record => record.environmentId === environment.id);
    if (!state.subgroup) {
      const groups = [...new Set(records.map(record => record.subgroup))];
      const grid = el('div', 'library-grid subgroup-grid');
      for (const group of groups) {
        const items = records.filter(record => record.subgroup === group);
        add(grid, add(el('article', 'catalog-card subgroup-card'), el('span', 'catalog-eyebrow', titleOf(environment)), el('h3', '', group), el('p', '', items.length + ' módulos · ' + items.filter(record => record.status === 'approved').length + ' aprovados'), button('Abrir grupo', () => { state.subgroup = group; render(); }, 'button secondary')));
      }
      target.append(groups.length ? grid : empty('Nenhum grupo cadastrado', 'Cadastre um módulo e informe seu grupo para organizar este ambiente.', button('Cadastrar módulo', newModule, 'button secondary', isSaving()))); return;
    }
    const found = records.filter(record => record.subgroup === state.subgroup);
    target.append(found.length ? add(el('div', 'library-grid'), found.map(moduleCard)) : empty('Nenhum módulo neste grupo', 'Cadastre um módulo ou volte aos grupos deste ambiente.'));
  }
  function showForm(title, specs, submit) {
    if (!editable()) { if (!canEdit()) requestEdit(); return; }
    const dialog = el('dialog', 'library-dialog'); const form = el('form', 'module-form'); const values = {};
    add(form, el('h2', '', title));
    for (const spec of specs) {
      const label = el('label', 'module-field'); let input;
      if (spec.options) { input = el('select', 'module-select'); options(input, spec.options, spec.value); }
      else { input = el('input', 'module-input'); input.value = spec.value || ''; input.maxLength = spec.maxLength || 160; }
      input.required = spec.required !== false; input.setAttribute('aria-label', spec.label); values[spec.key] = input;
      add(form, add(label, el('span', 'module-field-label', spec.label), input));
    }
    const submitButton = el('button', 'button primary', 'Cadastrar'); submitButton.type = 'submit';
    add(form, add(el('div', 'library-actions'), button('Cancelar', () => dialog.close(), 'button quiet'), submitButton));
    form.onsubmit = event => { event.preventDefault(); if (!editable()) return; if (submit(Object.fromEntries(Object.entries(values).map(([key, input]) => [key, input.value.trim()]))) !== false) dialog.close(); };
    dialog.append(form); dialog.addEventListener('close', () => dialog.remove(), { once: true }); document.body.append(dialog); dialog.showModal();
  }
  function newModule() {
    if (modules().length >= LIMITS.modules) { notice('A biblioteca comporta até ' + LIMITS.modules + ' módulos. Remova um cadastro antes de adicionar outro.'); return; }
    showForm('Cadastrar módulo', [{ key: 'environmentId', label: 'Ambiente', options: ENVIRONMENTS.map(entry => [entry.id, titleOf(entry)]), value: state.environmentId || ENVIRONMENTS[0]?.id }, { key: 'subgroup', label: 'Grupo / subgrupo', value: state.subgroup || '', maxLength: 80 }, { key: 'title', label: 'Nome do módulo', maxLength: 80 }, { key: 'kind', label: 'Tipo do módulo', options: [['base', 'Balcão / módulo inferior'], ['tall', 'Armário alto'], ['upper', 'Módulo superior'], ['drawers', 'Gaveteiro'], ['panel', 'Painel / revestimento'], ['top', 'Tampo / bancada'], ['piece', 'Peça individual']] }], values => {
      if (!values.title || !values.subgroup) { notice('Informe o nome e o grupo do módulo.'); return false; }
      const record = { id: 'custom_' + crypto.randomUUID(), environmentId: values.environmentId, subgroup: values.subgroup, title: values.title, kind: values.kind, family: { base: 'balcao', tall: 'armario', upper: 'superior', drawers: 'gaveteiro' }[values.kind] || 'none', status: 'draft', width: null, height: null, depth: null, thickness: null, material: '', finish: '', hardware: '', hardwareIds: [], methodId: '', assembly: '', quality: '', notes: '', pieces: [] };
      if (change(draft => draft.modules.push(record))) { openModule(record.id); return true; } return false;
    });
  }
  function renderModule() {
    const record = moduleById(state.moduleId); if (!record) return renderCatalog();
    const environment = environmentById(record.environmentId);
    const back = () => { state.moduleId = null; render(); };
    container.replaceChildren(breadcrumb([{ label: 'Ambientes', action: () => { state.environmentId = null; state.subgroup = null; state.moduleId = null; render(); } }, { label: titleOf(environment), action: () => openEnvironment(record.environmentId) }, { label: record.subgroup, action: back }, { label: record.title }]), header(record.title, titleOf(environment) + ' · ' + record.subgroup, [statusBadge(record.status), button('Voltar ao grupo', back, 'button quiet')]), editPrompt());
    const tabs = el('div', 'module-tabs'); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Cadastro do módulo');
    for (const [id, title] of TABS) {
      const tab = button(title, () => { state.tab = id; renderModule(); }, 'module-tab' + (state.tab === id ? ' active' : '')); tab.id = 'library-tab-' + id; tab.tabIndex = state.tab === id ? 0 : -1;
      tab.setAttribute('role', 'tab'); tab.setAttribute('aria-selected', String(state.tab === id)); tab.setAttribute('aria-controls', 'module-tab-content');
      tab.onkeydown = event => {
        let index = TABS.findIndex(pair => pair[0] === id);
        if (event.key === 'ArrowRight') index = (index + 1) % TABS.length;
        else if (event.key === 'ArrowLeft') index = (index + TABS.length - 1) % TABS.length;
        else if (event.key === 'Home') index = 0;
        else if (event.key === 'End') index = TABS.length - 1;
        else return;
        event.preventDefault(); state.tab = TABS[index][0]; renderModule(); document.getElementById('library-tab-' + state.tab)?.focus();
      };
      tabs.append(tab);
    }
    const content = el('section', 'module-tab-content'); content.id = 'module-tab-content'; content.setAttribute('role', 'tabpanel'); content.setAttribute('aria-labelledby', 'library-tab-' + state.tab);
    add(container, tabs, content);
    if (state.tab === 'overview') renderOverview(content, record);
    else if (state.tab === 'measures') renderMeasures(content, record);
    else if (state.tab === 'pieces') renderPieces(content, record);
    else if (state.tab === 'edges') renderModuleEdges(content, record);
    else if (state.tab === 'hardware') renderHardware(content, record);
    else if (state.tab === 'assembly') renderAssembly(content, record);
    else if (state.tab === 'quality') renderQuality(content, record);
  }
  function renderOverview(target, record) {
    const source = MODULE_CATALOG.find(item => item.id === record.id);
    add(target, add(el('div', 'module-overview'), moduleDrawing(record), add(el('div', 'module-overview-text'), el('h3', '', 'Identificação do módulo'), hint(source?.description || 'Defina as características deste módulo para orientar projeto, produção e conferência.'), el('p', '', 'Peças cadastradas: ' + record.pieces.length), el('p', '', 'Medidas em centímetros. Ilustração esquemática, sem escala.'))));
    const form = el('div', 'module-form');
    add(form, field('Tipo do módulo', record.kind, value => updateModule(record.id, 'kind', value), { options: KINDS }));
    add(form, field('Nome do módulo', record.title, value => updateModule(record.id, 'title', value), { maxLength: 80 }), field('Grupo / subgrupo', record.subgroup, value => updateModule(record.id, 'subgroup', value), { maxLength: 80 }), field('Ambiente', record.environmentId, value => updateModule(record.id, 'environmentId', value), { options: ENVIRONMENTS.map(item => [item.id, titleOf(item)]) }), field('Situação do cadastro', record.status, value => updateModule(record.id, 'status', value), { options: STATUS, hint: 'Aprovação exige medidas, materiais, peças, método aprovado e instruções completas.' }), field('Material principal', record.material, value => updateModule(record.id, 'material', value), { maxLength: 120, placeholder: 'A definir pelo responsável' }), field('Acabamento / padrão de cor', record.finish, value => updateModule(record.id, 'finish', value), { maxLength: 120 }), field('Observações do módulo', record.notes, value => updateModule(record.id, 'notes', value), { textarea: true, wide: true, rows: 4, maxLength: 2000 }));
    add(target, form, button('Remover módulo', () => confirmAction('Remover este módulo?', 'O módulo e todas as suas peças serão removidos da edição atual. A alteração só será publicada ao salvar o padrão.', 'Remover módulo', () => { if (change(draft => { draft.modules = draft.modules.filter(item => item.id !== record.id); })) { state.moduleId = null; render(); } }), 'button quiet remove-button', !editable()));
  }
  function renderMeasures(target, record) {
    add(target, el('h3', '', 'Dimensões externas do módulo'), hint('Cadastre as dimensões deste módulo específico. Ambiente e tipo não atribuem medidas automaticamente. Todas as medidas e espessuras são em centímetros.'));
    const drawing = el('div', 'module-preview'); drawing.append(moduleDrawing(record)); const redraw = () => drawing.replaceChildren(moduleDrawing(moduleById(record.id)));
    const form = el('div', 'module-form');
    for (const [key, label] of [['width', 'Largura externa (cm)'], ['height', 'Altura externa (cm)'], ['depth', 'Profundidade externa (cm)'], ['thickness', 'Espessura principal do painel (cm)']]) add(form, field(label, record[key], value => updateModule(record.id, key, value, redraw), { number: true, hint: key === 'thickness' ? 'Ex.: registre 1,8 cm para um painel de 18 mm.' : 'Campo vazio = medida pendente.' }));
    add(target, add(el('div', 'module-measure-layout'), form, drawing));
  }
  function newPiece(moduleId) {
    if ((moduleById(moduleId)?.pieces.length || 0) >= LIMITS.piecesPerModule) { notice('Este módulo comporta até ' + LIMITS.piecesPerModule + ' peças. Remova uma peça antes de adicionar outra.'); return; }
    if (change(draft => { const module = draft.modules.find(item => item.id === moduleId); const piece = createBlankPiece('Nova peça', 'piece_' + crypto.randomUUID()); module.pieces.push(piece); state.pieceId = piece.id; })) render();
  }
  function cutSummary(piece) {
    const cut = calculatePieceCut(piece); const result = el('div', 'piece-cut-summary');
    add(result, el('strong', '', 'Medida acabada: ' + size(piece.width) + ' × ' + size(piece.height)), el('span', '', 'Medida de corte: ' + size(cut.width) + ' × ' + size(cut.height)), el('small', '', cut.message));
    return result;
  }
  function renderPieces(target, record) {
    add(target, header('Peças do módulo', 'Cada peça precisa de identificação, quantidade, dimensões acabadas, espessura, material e orientação. O cálculo de corte depende do modo e das bordas definidos.', [button('Adicionar peça', () => newPiece(record.id), 'button secondary', !editable())]), hint('Os nomes de peças do catálogo inicial são sugestões de composição. Confirme as peças e suas quantidades antes de liberar o módulo para produção.'));
    if (!record.pieces.length) { target.append(empty('Nenhuma peça cadastrada', 'Inclua as peças que realmente compõem este módulo. Nenhuma composição produtiva será presumida.', canEdit() ? button('Adicionar primeira peça', () => newPiece(record.id), 'button secondary', isSaving()) : null)); return; }
    const list = el('div', 'piece-list');
    for (const piece of record.pieces) {
      const card = el('article', 'piece-card'); const heading = el('h4', '', piece.name); const summary = el('div', 'piece-cut-result'); summary.append(cutSummary(piece));
      const refreshCut = () => summary.replaceChildren(cutSummary(moduleById(record.id)?.pieces.find(item => item.id === piece.id) || piece));
      add(card, add(el('div', 'piece-card-header'), heading, add(el('div', 'library-actions'), button('Definir bordas', () => { state.tab = 'edges'; state.pieceId = piece.id; renderModule(); }, 'button secondary small'), button('Remover peça', () => confirmAction('Remover esta peça?', 'A peça “' + piece.name + '” será removida da edição atual. Salve o padrão para publicar a alteração.', 'Remover peça', () => change(draft => { const module = draft.modules.find(item => item.id === record.id); module.pieces = module.pieces.filter(item => item.id !== piece.id); }, true)), 'button quiet small remove-button', !editable()))));
      const form = el('div', 'module-form');
      add(form, field('Nome da peça', piece.name, value => updatePiece(record.id, piece.id, 'name', value, () => { heading.textContent = value || 'Peça sem nome'; }), { maxLength: 80 }), field('Quantidade', piece.quantity, value => updatePiece(record.id, piece.id, 'quantity', value), { number: true, integer: true, min: 1 }), field('Largura acabada (cm)', piece.width, value => updatePiece(record.id, piece.id, 'width', value, refreshCut), { number: true }), field('Altura acabada (cm)', piece.height, value => updatePiece(record.id, piece.id, 'height', value, refreshCut), { number: true }), field('Espessura do painel (cm)', piece.thickness, value => updatePiece(record.id, piece.id, 'thickness', value), { number: true }), field('Material da peça', piece.material, value => updatePiece(record.id, piece.id, 'material', value), { maxLength: 120 }), field('Sentido do veio / textura', piece.grain, value => updatePiece(record.id, piece.id, 'grain', value), { options: GRAIN }), field('Como obter a medida de corte', piece.cutMode, value => updatePiece(record.id, piece.id, 'cutMode', value, () => renderModule()), { options: CUT_MODES }));
      if (piece.cutMode === 'manual') add(form, field('Largura de corte (cm)', piece.cutWidth, value => updatePiece(record.id, piece.id, 'cutWidth', value, refreshCut), { number: true }), field('Altura de corte (cm)', piece.cutHeight, value => updatePiece(record.id, piece.id, 'cutHeight', value, refreshCut), { number: true }));
      add(form, field('Observações da peça', piece.notes, value => updatePiece(record.id, piece.id, 'notes', value), { textarea: true, wide: true, rows: 3, maxLength: 2000 }));
      add(card, form, summary); list.append(card);
    }
    target.append(list);
  }
  function pieceSelector(record, callback) {
    const selected = record.pieces.find(piece => piece.id === state.pieceId) || record.pieces[0];
    if (selected) state.pieceId = selected.id;
    const label = el('label', 'module-field'); const select = el('select', 'module-select');
    options(select, record.pieces.map(piece => [piece.id, piece.name || 'Peça sem nome']), selected?.id); select.setAttribute('aria-label', 'Peça para configurar bordas'); select.onchange = () => { state.pieceId = select.value; callback(); };
    return add(label, el('span', 'module-field-label', 'Peça'), select);
  }
  function renderModuleEdges(target, record) {
    add(target, el('h3', '', 'Bordas das peças'), hint('Observe a face A da peça. L1 é superior, L2 direita, L3 inferior e L4 esquerda. A posição é fixa nesta visualização; o sentido do veio não renumera os lados.'));
    if (!record.pieces.length) { target.append(empty('Cadastre uma peça primeiro', 'Cada peça recebe suas próprias definições de borda.', button('Abrir cadastro de peças', () => { state.tab = 'pieces'; renderModule(); }, 'button secondary'))); return; }
    add(target, pieceSelector(record, () => renderModule()), edgeEditor(record, record.pieces.find(piece => piece.id === state.pieceId)));
  }
  function edgeDrawing(piece) {
    const svg = svgEl('svg', { viewBox: '0 0 390 285', class: 'edge-diagram', role: 'img', 'aria-label': 'Face A. L1 superior, L2 direita, L3 inferior, L4 esquerda.' });
    add(svg, svgEl('rect', { x: 81, y: 66, width: 228, height: 150, fill: '#f0e3d4', stroke: '#d1b99f', 'stroke-width': 1 }), svgEl('text', { x: 195, y: 132, 'text-anchor': 'middle', fill: '#657386', 'font-size': 16 }, 'FACE A'), svgEl('text', { x: 195, y: 155, 'text-anchor': 'middle', fill: '#657386', 'font-size': 12 }, size(piece.width) + ' × ' + size(piece.height)));
    if (piece.grain === 'horizontal') add(svg, svgEl('path', { d: 'M143 181H247M143 173L135 181L143 189M247 173L255 181L247 189', stroke: '#aa9178', fill: 'none', 'stroke-width': 2 }));
    if (piece.grain === 'vertical') add(svg, svgEl('path', { d: 'M272 104V177M264 104L272 96L280 104M264 177L272 185L280 177', stroke: '#aa9178', fill: 'none', 'stroke-width': 2 }));
    const coordinates = { L1: [81, 66, 309, 66, 195, 38], L2: [309, 66, 309, 216, 354, 146], L3: [81, 216, 309, 216, 195, 253], L4: [81, 66, 81, 216, 37, 146] };
    for (const side of SIDES) {
      const edge = piece.edges?.[side.id] || { mode: 'pending' }; const [x1, y1, x2, y2, tx, ty] = coordinates[side.id];
      const group = svgEl('g', { class: 'edge-side edge-' + edge.mode + (state.edgeId === side.id ? ' selected' : ''), role: 'button', tabindex: 0, 'aria-label': side.id + ' ' + side.label + ': ' + (EDGE_MODES.find(pair => pair[0] === edge.mode)?.[1] || 'A definir'), 'aria-pressed': String(state.edgeId === side.id) });
      add(group, svgEl('line', { x1, y1, x2, y2, stroke: state.edgeId === side.id ? '#2162ed' : edge.mode === 'band' ? '#2b8b70' : edge.mode === 'none' ? '#9aa6b6' : '#dda03b', 'stroke-width': state.edgeId === side.id ? 10 : 7, 'stroke-dasharray': edge.mode === 'pending' ? '10 5' : 'none' }), svgEl('line', { x1, y1, x2, y2, stroke: 'transparent', 'stroke-width': 24 }), svgEl('text', { x: tx, y: ty, 'text-anchor': 'middle', fill: state.edgeId === side.id ? '#2162ed' : '#46566c', 'font-size': 12 }, side.id + ' ' + side.label));
      group.onclick = () => { state.edgeId = side.id; render(); }; group.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); group.onclick(); } }; svg.append(group);
    }
    return svg;
  }
  function edgeEditor(record, piece) {
    if (!piece) return empty('Selecione uma peça', 'Escolha a peça que deseja consultar.');
    const editor = el('div', 'edge-editor'); const visual = el('div', 'edge-visual'); const drawing = el('div', 'edge-drawing-wrap'); drawing.append(edgeDrawing(piece));
    const switches = el('div', 'edge-switches');
    for (const side of SIDES) { const item = button(side.id + ' · ' + side.label, () => { state.edgeId = side.id; render(); }, 'edge-button' + (state.edgeId === side.id ? ' active' : '')); item.setAttribute('aria-pressed', String(state.edgeId === side.id)); switches.append(item); }
    add(visual, drawing, switches, hint('Verde: com fita. Cinza: sem fita. Amarelo tracejado: a definir. Azul: lado selecionado.'));
    const side = SIDES.find(entry => entry.id === state.edgeId) || SIDES[0]; const edge = piece.edges?.[side.id] || { mode: 'pending', material: '', thickness: null, width: null };
    const fields = el('div', 'edge-fields'); const summary = el('div', 'piece-cut-result'); summary.append(cutSummary(piece));
    const refresh = () => { const currentPiece = moduleById(record.id)?.pieces.find(item => item.id === piece.id); if (currentPiece) { summary.replaceChildren(cutSummary(currentPiece)); drawing.replaceChildren(edgeDrawing(currentPiece)); } };
    function setEdge(key, value, rerender = false) {
      if (change(draft => { const currentPiece = draft.modules.find(item => item.id === record.id)?.pieces.find(item => item.id === piece.id); if (!currentPiece) return; currentPiece.edges[side.id][key] = value; if (key === 'mode' && value === 'none') Object.assign(currentPiece.edges[side.id], { material: '', thickness: null, width: null }); })) { if (rerender) render(); else refresh(); }
    }
    add(fields, el('h4', '', side.id + ' — ' + side.label), field('Aplicação nesta borda', edge.mode, value => setEdge('mode', value, true), { options: EDGE_MODES }), field('Material / referência da fita', edge.material, value => setEdge('material', value), { disabled: edge.mode !== 'band', maxLength: 120 }), field('Espessura da fita (cm)', edge.thickness, value => setEdge('thickness', value), { number: true, disabled: edge.mode !== 'band', hint: '0,1 cm corresponde a 1 mm; 0,04 cm corresponde a 0,4 mm.' }), field('Largura da fita (cm)', edge.width, value => setEdge('width', value), { number: true, disabled: edge.mode !== 'band', hint: 'Para aprovar, a fita deve cobrir a espessura do painel. Sua largura não é descontada da medida da peça.' }), field('Como obter a medida de corte', piece.cutMode, value => updatePiece(record.id, piece.id, 'cutMode', value, () => render()), { options: CUT_MODES }));
    if (piece.cutMode === 'manual') add(fields, field('Largura de corte (cm)', piece.cutWidth, value => updatePiece(record.id, piece.id, 'cutWidth', value, refresh), { number: true }), field('Altura de corte (cm)', piece.cutHeight, value => updatePiece(record.id, piece.id, 'cutHeight', value, refresh), { number: true }));
    add(fields, summary, hint('O sistema não acrescenta nem desconta espessura de serra, sobremedida ou folga automaticamente. Registre esses critérios nas observações da peça e escolha corte manual quando necessário.'));
    add(editor, visual, fields); return editor;
  }
  function renderAssembly(target, record) {
    add(target, el('h3', '', 'Método e montagem'), hint('Vincule um método cadastrado e descreva a sequência específica deste módulo. Um método em rascunho ainda precisa de aprovação do responsável.'));
    const list = [['', 'Método a definir'], ...methods().map(method => [method.id, method.title + ' · ' + (STATUS.find(pair => pair[0] === method.status)?.[1] || 'Pendente')])];
    add(target, field('Método produtivo', record.methodId, value => updateModule(record.id, 'methodId', value), { options: list }), button('Consultar métodos produtivos', () => { state.methodId = record.methodId || null; navigate('methods'); }, 'button secondary small'), field('Instruções de montagem do módulo', record.assembly, value => updateModule(record.id, 'assembly', value), { textarea: true, wide: true, rows: 8, maxLength: 8000, placeholder: 'Descreva ordem de montagem, posicionamentos, fixações, cuidados e pontos que precisam de conferência.' }));
  }
  function renderHardware(target, record) {
    const fittingRecords = Array.isArray(data().fittings) ? data().fittings : [];
    add(target, el('h3', '', 'Ferragens e acessórios'), hint('Vincule as ferragens cadastradas e descreva quantidade, aplicação e fixações específicas deste módulo. Os vínculos não substituem as instruções de montagem.'), field('Ferragens do módulo — quantidades e observações', record.hardware, value => updateModule(record.id, 'hardware', value), { textarea: true, wide: true, rows: 6, maxLength: 2000, placeholder: 'Descreva as quantidades, posições e restrições. Use “Não se aplica” quando adequado.' }), button('Abrir catálogo de ferragens usadas', () => onNavigate('fittings'), 'button secondary'));
    if (!fittingRecords.length) { target.append(empty('Nenhuma ferragem cadastrada', 'Cadastre as ferragens usadas pela empresa, com modelo e documentação, antes de vinculá-las aos módulos.')); return; }
    const linked = new Set(record.hardwareIds || []);
    const search = el('input', 'library-search'); search.type = 'search'; search.placeholder = 'Buscar ferragem por nome, marca ou referência'; search.setAttribute('aria-label', 'Buscar ferragem para vincular ao módulo');
    const list = el('div', 'module-fitting-links');
    function populate() {
      const found = fittingRecords.filter(fitting => normalized([fitting.title, fitting.brand, fitting.reference].join(' ')).includes(normalized(search.value)));
      list.replaceChildren();
      for (const fitting of found) {
        const row = el('article', 'module-fitting-link'); const label = el('label', 'module-fitting-choice'); const checkbox = el('input'); checkbox.type = 'checkbox'; checkbox.checked = linked.has(fitting.id); checkbox.disabled = !editable();
        checkbox.onchange = () => {
          if (checkbox.checked && linked.size >= 30) { checkbox.checked = false; notice('Cada módulo pode vincular até 30 ferragens.'); return; }
          const next = new Set(linked); if (checkbox.checked) next.add(fitting.id); else next.delete(fitting.id);
          if (change(draft => { const module = draft.modules.find(item => item.id === record.id); if (module) module.hardwareIds = [...next]; })) { linked.clear(); for (const id of next) linked.add(id); }
          else checkbox.checked = linked.has(fitting.id);
        };
        add(label, checkbox, add(el('span', 'module-fitting-name'), el('strong', '', fitting.title), el('small', '', [fitting.brand || 'Marca pendente', fitting.reference || 'Referência pendente'].join(' · '))));
        add(row, label, statusBadge(fitting.status), button('Consultar ferragem', () => { if (onOpenFitting) onOpenFitting(fitting.id); else onNavigate('fittings', fitting.id); }, 'button quiet small')); list.append(row);
      }
      if (!found.length) list.append(empty('Nenhuma ferragem encontrada', 'Tente outro nome, marca ou referência.'));
    }
    search.oninput = populate; populate(); add(target, el('h4', '', 'Ferragens vinculadas ao módulo'), hint('Marque os cadastros usados neste módulo. Um módulo aprovado só pode vincular ferragens aprovadas.'), search, list);
  }
  function renderQuality(target, record) {
    add(target, el('h3', '', 'Conferência e liberação'), hint('A situação indica a liberação do cadastro pelo responsável. O sistema não aprova engenharia nem fabrica a partir de campos incompletos.'), field('Critérios de conferência deste módulo', record.quality, value => updateModule(record.id, 'quality', value), { textarea: true, wide: true, rows: 8, maxLength: 8000, placeholder: 'Defina o que conferir: medidas, esquadro, material, bordas, veio, ferragens, acabamento e montagem.' }), field('Situação do cadastro', record.status, value => updateModule(record.id, 'status', value), { options: STATUS }));
    const checklist = el('ul', 'module-checklist');
    const completeEdges = piece => SIDES.every(side => piece.edges?.[side.id]?.mode === 'none' || piece.edges?.[side.id]?.mode === 'band' && piece.edges[side.id].material.trim() && piece.edges[side.id].thickness > 0 && piece.edges[side.id].width > 0 && piece.edges[side.id].width >= piece.thickness);
    const checks = [['Medidas obrigatórias do módulo informadas', ['width', 'height', record.kind === 'piece' ? 'thickness' : 'depth'].every(key => record[key] > 0)], ['Material principal informado', !!record.material.trim()], ['Peças cadastradas', record.pieces.length > 0], ['Peças com quantidade, medidas, espessura e material', record.pieces.length > 0 && record.pieces.every(piece => piece.quantity > 0 && Number.isInteger(piece.quantity) && piece.width > 0 && piece.height > 0 && piece.thickness > 0 && piece.material.trim())], ['Veio, bordas e corte definidos nas peças', record.pieces.length > 0 && record.pieces.every(piece => piece.grain !== 'pending' && completeEdges(piece) && calculatePieceCut(piece).width > 0 && calculatePieceCut(piece).height > 0)], ['Método produtivo aprovado vinculado', methodById(record.methodId)?.status === 'approved'], ['Ferragens descritas', !!record.hardware.trim()], ['Montagem descrita', !!record.assembly.trim()], ['Critérios de conferência descritos', !!record.quality.trim()]];
    if ((record.hardwareIds || []).length) checks.push(['Ferragens vinculadas aprovadas', record.hardwareIds.every(id => data().fittings?.find(item => item.id === id)?.status === 'approved')]);
    for (const [label, complete] of checks) add(checklist, el('li', complete ? 'check-complete' : 'check-pending', (complete ? '✓ ' : '○ ') + label));
    add(target, el('h4', '', 'Resumo do preenchimento'), checklist, hint('Este resumo orienta o preenchimento. A validação definitiva ocorre ao salvar; a aprovação é uma decisão do responsável.'));
  }
  function renderEdges() {
    container.replaceChildren(header('Peças e bordas', 'Consulte e defina as quatro bordas de cada peça. As medidas são em centímetros, com orientação fixa pela face A.'), editPrompt());
    const toolbar = el('div', 'library-toolbar'); const environmentLabel = el('label', 'module-field'); const environmentSelect = el('select', 'module-select');
    options(environmentSelect, [['all', 'Todos os ambientes'], ...ENVIRONMENTS.map(item => [item.id, titleOf(item)])], state.edgeEnvironmentId);
    environmentSelect.setAttribute('aria-label', 'Ambiente');
    environmentSelect.onchange = () => { state.edgeEnvironmentId = environmentSelect.value; state.edgeModuleId = null; state.pieceId = null; render(); };
    add(environmentLabel, el('span', 'module-field-label', 'Ambiente'), environmentSelect); toolbar.append(environmentLabel);
    const choices = modules().filter(record => state.edgeEnvironmentId === 'all' || record.environmentId === state.edgeEnvironmentId); const record = choices.find(item => item.id === state.edgeModuleId) || choices[0];
    if (!record) { add(container, toolbar, empty('Nenhum módulo disponível', 'Cadastre um módulo na biblioteca para definir peças e bordas.', button('Abrir biblioteca', () => navigate('catalog'), 'button secondary'))); return; }
    state.edgeModuleId = record.id;
    const moduleLabel = el('label', 'module-field'); const moduleSelect = el('select', 'module-select'); options(moduleSelect, choices.map(item => [item.id, titleOf(environmentById(item.environmentId)) + ' · ' + item.subgroup + ' · ' + item.title]), record.id);
    moduleSelect.setAttribute('aria-label', 'Módulo');
    moduleSelect.onchange = () => { state.edgeModuleId = moduleSelect.value; state.pieceId = null; render(); };
    add(toolbar, add(moduleLabel, el('span', 'module-field-label', 'Módulo'), moduleSelect), record.pieces.length ? pieceSelector(record, render) : null); add(container, toolbar);
    if (!record.pieces.length) { container.append(empty('Este módulo ainda não tem peças', 'Cadastre a composição do módulo antes de definir suas bordas.', button('Abrir peças do módulo', () => openModule(record.id, 'pieces'), 'button secondary'))); return; }
    add(container, add(el('div', 'library-actions'), button('Abrir cadastro do módulo', () => openModule(record.id, 'overview'), 'button quiet small')), edgeEditor(record, record.pieces.find(piece => piece.id === state.pieceId)));
  }
  function renderMethods() {
    container.replaceChildren(header('Métodos produtivos', 'Organize a sequência de trabalho e os critérios de conferência. Os métodos iniciais são sugestões de preenchimento e precisam de revisão da empresa.', [button('Cadastrar método', newMethod, 'button secondary', isSaving())]), editPrompt());
    const guide = el('details', 'method-guide'); const summary = el('summary', '', 'Guia das etapas produtivas'); guide.append(summary);
    const steps = el('ol', 'method-steps');
    for (const step of PRODUCTION_STEPS) add(steps, add(el('li', 'method-step'), el('strong', '', titleOf(step)), el('p', '', step.description || 'Defina esta etapa de acordo com o padrão produtivo da empresa.')));
    add(guide, hint('Guia de organização. Estas orientações não equivalem a um método produtivo aprovado da Steffens Móveis.'), steps); container.append(guide);
    const records = methods(); const selected = records.find(record => record.id === state.methodId) || records[0];
    if (!selected) { container.append(empty('Nenhum método cadastrado', 'Descreva uma sequência de trabalho e seus critérios de conferência para orientar os módulos.')); return; }
    state.methodId = selected.id; const layout = el('div', 'method-layout'); const list = el('nav', 'method-list'); list.setAttribute('aria-label', 'Métodos cadastrados');
    for (const method of records) { const item = button(method.title, () => { state.methodId = method.id; render(); }, 'method-list-item' + (method.id === selected.id ? ' active' : '')); add(item, statusBadge(method.status)); list.append(item); }
    const detail = el('section', 'method-detail'); add(detail, header(selected.title, selected.category, [statusBadge(selected.status)]));
    function update(key, value) { change(draft => { const method = draft.methods.find(item => item.id === selected.id); if (method) method[key] = value; }); }
    const asText = value => Array.isArray(value) ? value.join('\n') : value || '';
    add(detail, add(el('div', 'module-form'), field('Nome do método', selected.title, value => update('title', value), { maxLength: 80 }), field('Categoria', selected.category, value => update('category', value), { maxLength: 80 }), field('Situação do método', selected.status, value => update('status', value), { options: STATUS }), field('Objetivo e aplicação', selected.description, value => update('description', value), { textarea: true, wide: true, maxLength: 2000 }), field('Etapas do método — uma por linha', asText(selected.steps), value => update('steps', value), { textarea: true, wide: true, rows: 8, maxLength: 8000, hint: 'Escreva a sequência prática, os materiais, as operações e os cuidados de cada etapa.' }), field('Conferências — uma por linha', asText(selected.checks), value => update('checks', value), { textarea: true, wide: true, rows: 6, maxLength: 8000 }), field('Observações e restrições', selected.notes, value => update('notes', value), { textarea: true, wide: true, maxLength: 2000 })), hint('Métodos aprovados exigem etapas e conferências preenchidas. Descreva também o objetivo e verifique o conteúdo antes de liberar seu uso.'), button('Remover método', () => {
      const linked = modules().filter(module => module.methodId === selected.id);
      if (linked.length) { notice('Este método está vinculado a ' + linked.length + ' módulo(s). Retire os vínculos na aba Montagem antes de remover.'); return; }
      confirmAction('Remover este método?', 'O método será removido da edição atual ao salvar o padrão.', 'Remover método', () => change(draft => { draft.methods = draft.methods.filter(item => item.id !== selected.id); state.methodId = null; }, true));
    }, 'button quiet remove-button', !editable()));
    add(layout, list, detail); container.append(layout);
  }
  function newMethod() {
    if (methods().length >= LIMITS.methods) { notice('A biblioteca comporta até ' + LIMITS.methods + ' métodos. Remova um cadastro antes de adicionar outro.'); return; }
    showForm('Cadastrar método produtivo', [{ key: 'title', label: 'Nome do método', maxLength: 80 }, { key: 'category', label: 'Categoria', maxLength: 80 }], values => {
      const record = { id: 'custom_' + crypto.randomUUID(), title: values.title, category: values.category, status: 'draft', description: '', steps: '', checks: '', notes: '' };
      if (change(draft => draft.methods.push(record))) { state.methodId = record.id; navigate('methods'); return true; } return false;
    });
  }
  function render() {
    sidebar();
    if (!['catalog', 'edges', 'methods'].includes(state.view)) return;
    if (state.view === 'catalog') renderCatalog();
    else if (state.view === 'edges') renderEdges();
    else renderMethods();
  }
  function setView(next) { state.view = next; if (next === 'catalog') { state.environmentId = null; state.subgroup = null; state.moduleId = null; state.search = ''; } if (['catalog', 'edges', 'methods'].includes(next)) render(); }
  return { setView, render, openEnvironment, openModule, openMethods: id => { state.methodId = id || null; navigate('methods'); }, openEdges: (moduleId, pieceId = null) => { state.edgeModuleId = moduleId || null; state.edgeEnvironmentId = 'all'; state.pieceId = pieceId; navigate('edges'); }, getState: () => ({ ...state }) };
}



