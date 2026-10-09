import { MEASURES, INITIAL_DIMENSIONS, validateStandards } from './model.js?v=2';
import { createInitialModules, createInitialMethods } from './catalog.js?v=2';
import { createLibraryController } from './library.js?v=2';

const $ = selector => document.querySelector(selector);
const all = selector => [...document.querySelectorAll(selector)];
const format = value => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 10 }).format(value);
let saved = null, draft = null, authenticated = false, selected = 'A', family = 'all', view = 'catalog', saving = false, toastTimer, clearanceEditingId = null, draftGeneration = 0, refreshRequest = 0;
const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const fields = ['dimensions','clearances','modules','methods'];
const isDirty = () => !!saved && !!draft && JSON.stringify(fields.map(key => draft[key])) !== JSON.stringify(fields.map(key => saved[key]));
const data = () => authenticated && draft ? draft : saved;
const initialLibrary = { dimensions: INITIAL_DIMENSIONS, clearances: [], modules: createInitialModules(), methods: createInitialMethods() };
const library = createLibraryController({
  getData: () => data() || initialLibrary,
  canEdit: () => authenticated && !saving && !!saved,
  isSaving: () => saving,
  onChange: mutator => { if (!authenticated || saving || !draft) return false; mutator(draft); draftGeneration++; renderDirty(); return true; },
  requestEdit: () => $('#edit-button').click(),
  notice, confirmAction,
  onNavigate: next => setView(next),
});

function mergeChanges(before, local, latest) {
  if (JSON.stringify(before) === JSON.stringify(local)) return clone(latest);
  if (Array.isArray(local) && Array.isArray(before) && Array.isArray(latest)) {
    const byId = rows => new Map(rows.map(row => [row.id, row]));
    const original = byId(before), edited = byId(local), current = byId(latest);
    const result = [];
    for (const id of new Set([...latest.map(row => row.id), ...local.map(row => row.id)])) {
      if (original.has(id) && !edited.has(id)) continue;
      if (!edited.has(id)) { if (current.has(id)) result.push(clone(current.get(id))); continue; }
      if (!original.has(id)) { result.push(clone(edited.get(id))); continue; }
      const merged = mergeChanges(original.get(id), edited.get(id), current.get(id));
      if (merged !== undefined) result.push(merged);
    }
    return result;
  }
  if (before && local && latest && [before,local,latest].every(value => typeof value === 'object' && !Array.isArray(value))) {
    return Object.fromEntries([...new Set([...Object.keys(latest),...Object.keys(local)])].map(key => [key,mergeChanges(before[key],local[key],latest[key])]));
  }
  return clone(local);
}

async function api(path, options = {}) {
  const res = await fetch(path, { credentials: 'same-origin', ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers } });
  const result = await res.json();
  if (!res.ok) throw Object.assign(new Error(result.error || 'Não foi possível concluir a solicitação.'), { status: res.status, current: result.current });
  return result;
}
function toast(message) { clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').hidden = false; toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4500); }
function notice(message) { $('#notice').textContent = message; $('#notice').hidden = !message; }
function confirmAction(title, description, label, action) {
  $('#confirm-title').textContent = title; $('#confirm-description').textContent = description; $('#confirm-action').textContent = label;
  $('#confirm-action').onclick = () => { $('#confirm-dialog').close(); action(); };
  $('#confirm-dialog').showModal();
}
function setView(next) {
  view = next;
  $('#dimensions-view').hidden = view !== 'dimensions'; $('#clearances-view').hidden = view !== 'clearances';
  $('#library-view').hidden = ['dimensions','clearances'].includes(view);
  all('.primary-nav [data-view]').forEach(button => { const active = button.dataset.view === view; button.classList.toggle('active', active); if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current'); });
  document.querySelector('.family-caption').hidden = view !== 'dimensions'; document.querySelector('.family-nav').hidden = view !== 'dimensions';
  document.querySelector('.environment-caption').hidden = ['dimensions','clearances'].includes(view); $('#environment-nav').hidden = ['dimensions','clearances'].includes(view);
  if (!$('#library-view').hidden) library.setView(next);
}
function setFamily(next) {
  family = next; setView('dimensions');
  if (family !== 'all' && MEASURES.find(m => m.id === selected).family !== family) selected = MEASURES.find(m => m.family === family).id;
  all('[data-family]').forEach(button => button.classList.toggle('active', button.dataset.family === family));
  renderMeasures(); renderDiagram(); renderDetail();
}
function selectMeasure(code, focus = false) {
  selected = code;
  if (family !== 'all' && MEASURES.find(m => m.id === code).family !== family) { family = 'all'; all('[data-family]').forEach(b => b.classList.toggle('active', b.dataset.family === 'all')); renderMeasures(); }
  all('.measure-row').forEach(row => row.classList.toggle('selected', row.dataset.code === code));
  renderDiagram(); renderDetail();
  if (focus && authenticated) $(`#measure-${code}`)?.focus({ preventScroll: true });
}
function renderMeasures() {
  const values = data()?.dimensions || INITIAL_DIMENSIONS;
  const measures = MEASURES.filter(m => family === 'all' || m.family === family);
  $('#measure-count').textContent = `${measures.length} ${measures.length === 1 ? 'dimensão' : 'dimensões'} · centímetros`;
  $('#measure-list').replaceChildren(...measures.map(m => {
    const row = document.createElement('div'); row.className = `measure-row${selected === m.id ? ' selected' : ''}`; row.dataset.code = m.id;
    const button = document.createElement('button'); button.className = 'measure-select'; button.type = 'button'; button.setAttribute('aria-label', `${m.id} — ${m.group}, ${m.label}`);
    button.innerHTML = `<span class="letter">${m.id}</span><span class="measure-name"><strong>${m.group}</strong><span>${m.label}</span></span>`;
    button.onclick = () => selectMeasure(m.id, true);
    const input = document.createElement('input'); input.className = 'measure-input'; input.type = 'number'; input.step = 'any'; input.min = m.positive ? '0.0000000001' : '0'; input.id = `measure-${m.id}`; input.value = values[m.id] ?? ''; input.disabled = !authenticated || saving; input.setAttribute('aria-label', `${m.id}: ${m.group} — ${m.label}, em centímetros`);
    input.onfocus = () => selectMeasure(m.id);
    input.oninput = () => {
      draftGeneration++;
      draft.dimensions[m.id] = input.value === '' ? null : input.valueAsNumber;
      input.classList.toggle('input-invalid', !input.checkValidity() || !Number.isFinite(draft.dimensions[m.id]));
      renderDiagram(); renderDetail(); renderDirty();
    };
    const unit = document.createElement('span'); unit.className = 'measure-unit'; unit.textContent = 'cm';
    row.append(button, input, unit); return row;
  }));
}
function renderDetail() {
  const measure = MEASURES.find(m => m.id === selected); const value = data()?.dimensions[selected] ?? INITIAL_DIMENSIONS[selected];
  $('#selected-detail').innerHTML = `<span class="letter-large">${selected}</span><div class="detail-text"><strong>${measure.group}</strong><span>${measure.label}</span></div><div class="detail-value">${Number.isFinite(value) ? format(value) : '—'}<small>cm</small></div>`;
}
function cabinet(x, y, w, h, depth, kind, activeFamily) {
  const dx = depth * .65, dy = depth * -.42;
  const cls = `module ${family !== 'all' && family !== activeFamily ? 'module-faded' : ''} ${MEASURES.find(m => m.id === selected).family === activeFamily ? 'module-active' : ''}`;
  const front = `<path class="cab-front" d="M${x},${y-h}h${w}v${h}h-${w}Z"/>`;
  const side = `<path class="cab-side" d="M${x+w},${y-h}l${dx},${dy}v${h}l-${dx},${-dy}Z"/>`;
  const top = `<path class="cab-top" d="M${x},${y-h}l${dx},${dy}h${w}l-${dx},${-dy}Z"/>`;
  let details = '';
  if (kind === 'drawers') {
    for (let i = 1; i < 4; i++) { const ty = y - h + h * i / 4; details += `<path d="M${x+3},${ty}h${w-6}" stroke="#b29a84" stroke-width="2"/><path d="M${x+w*.36},${ty-h/8}h${w*.28}" stroke="#eae8e0" stroke-width="2.5" stroke-linecap="round"/>`; }
    details += `<circle cx="${x+9}" cy="${y+5}" r="4" fill="#617082"/><circle cx="${x+w-9}" cy="${y+5}" r="4" fill="#617082"/>`;
  } else {
    details += `<path d="M${x+w/2},${y-h+2}v${h-4}" stroke="#a5876e" stroke-width="1.6"/>`;
    const hy = y - h + h * .26;
    details += `<path d="M${x+w/2-7},${hy}v15M${x+w/2+7},${hy}v15" stroke="#f0ede5" stroke-width="2.5" stroke-linecap="round"/>`;
    if (kind === 'tall') {
      const sh = h * .32;
      details = `<path d="M${x+2},${y-h+2}h${w-4}v${sh}h-${w-4}Z" fill="#e4e5e6"/><path d="M${x+2},${y-h+sh*.5}h${w-4}M${x+2},${y-h+sh}h${w-4}" stroke="#adb4ba" stroke-width="3"/>${details}`;
    }
    if (kind === 'base') details += `<path d="M${x+5},${y-8}h${w-10}v8h-${w-10}Z" fill="#9a8170"/><path d="M${x-4},${y-h-3}h${w+8}" stroke="#485970" stroke-width="5"/>`;
  }
  return `<g class="${cls}"><ellipse cx="${x+w*.6+dx*.5}" cy="${y+13}" rx="${w*.58+dx*.4}" ry="8" fill="#d8e0e9" opacity=".5"/>${side}${front}${top}${details}</g>`;
}
function dim(code, x1, y1, x2, y2, lx, ly) {
  const measure = MEASURES.find(m => m.id === code);
  const faded = family !== 'all' && family !== measure.family ? 'module-faded' : '';
  const dx = x2-x1, dy = y2-y1, length = Math.hypot(dx,dy) || 1, px = -dy/length*4, py = dx/length*4;
  return `<g class="dim-hit ${selected === code ? 'selected' : ''} ${faded}" data-code="${code}" role="button" tabindex="0" aria-label="${code} — ${measure.group}: ${measure.label}"><title>${code} — ${measure.group}: ${measure.label}</title><path class="dim-line" d="M${x1},${y1}L${x2},${y2}M${x1-px},${y1-py}L${x1+px},${y1+py}M${x2-px},${y2-py}L${x2+px},${y2+py}"/><rect class="dim-label-bg" x="${lx-14}" y="${ly-14}" width="28" height="28" rx="5"/><text class="dim-label" x="${lx}" y="${ly+5}" text-anchor="middle">${code}</text></g>`;
}
function renderDiagram() {
  const values = data()?.dimensions || INITIAL_DIMENSIONS;
  const ratio = code => { const n = values[code]; return Number.isFinite(n) && n > 0 ? Math.max(.45,Math.min(1.6,n/INITIAL_DIMENSIONS[code])) : 1; };
  const bh = 132 * ratio('A'), bd = 48 * ratio('B'), ah = 223 * ratio('C'), ad = 42 * ratio('D'), uh = 64 * ratio('E'), ud = 39 * ratio('F'), gh = 120 * ratio('G');
  const fy = 305;
  let html = `<defs><linearGradient id="wood" x1="0" x2="1"><stop stop-color="#bba08a"/><stop offset=".48" stop-color="#c9b09a"/><stop offset="1" stop-color="#b49780"/></linearGradient></defs><path d="M35 333H860" stroke="#e3e9f1" stroke-width="1"/><text x="48" y="40" font-size="11" letter-spacing="2" fill="#9aa8b9" font-family="Segoe UI,Arial">CONFIGURAÇÃO DOS MÓDULOS</text>`;
  html += cabinet(93, fy, 126, bh, bd, 'base', 'balcao');
  html += cabinet(97, 127, 115, uh, ud, 'upper', 'superior');
  html += cabinet(319, fy, 64, gh, 34, 'drawers', 'gaveteiro');
  html += cabinet(477, fy, 105, ah, ad, 'tall', 'armario');
  html += `<g class="${family !== 'all' && family !== 'moldura' ? 'module-faded' : ''}"><path d="M685 185l37-24h113l-37 24Z" fill="#b19a83" stroke="#967a63"/><path d="M685 185v20h113v-20M798 185l37-24v20l-37 24" fill="#8c725d" stroke="#78614f"/><path d="M700 184l25-16h91l-25 16Z" fill="#f9fbfd" stroke="#8e7862"/></g>`;
  html += dim('A', 68, fy-bh, 68, fy, 56, fy-bh/2);
  html += dim('B', 224, fy+16, 224+bd*.65, fy+16-bd*.42, 247+bd*.4, fy+26);
  html += dim('E', 78,127-uh,78,127,65,127-uh/2);
  html += dim('F', 217,138,217+ud*.65,138-ud*.42,242,148);
  html += dim('G', 414,fy-gh,414,fy,432,fy-gh/2);
  html += dim('C', 455,fy-ah,455,fy,439,fy-ah/2);
  html += dim('D', 587,fy+16,587+ad*.65,fy+16-ad*.42,610,fy+26);
  html += dim('K', 843,164,843,202,859,185);
  const recess = Math.max(5,Math.min(22,Number(values.I)*4 || 5)), toeHeight = Math.max(12,Math.min(30,Number(values.J)*4 || 12)), overhang = Math.max(5,Math.min(22,Number(values.H)*5 || 5));
  html += `<g class="${family !== 'all' && family !== 'balcao' ? 'module-faded' : ''}"><rect x="679" y="273" width="128" height="81" rx="6" fill="#f3f6fa" stroke="#e0e6ef"/><path d="M697 285h79v9h-79Z" fill="#526176"/><path d="M${701+overhang} 294v${45-toeHeight}h${55-overhang}v${toeHeight}h-36v-${toeHeight}h-${19-overhang}Z" fill="#c7b19d" stroke="#ad9783"/><text class="module-label" x="744" y="375" text-anchor="middle">Detalhe do balcão</text></g>`;
  html += dim('H',697,280,701+overhang,280,689,262);
  html += dim('I',718-recess,348,738,348,716,359);
  html += dim('J',785,339-toeHeight,785,339,806,327);
  html += `<text class="module-label" x="155" y="366" text-anchor="middle">Balcão</text><text class="module-label" x="163" y="149" text-anchor="middle">Superior</text><text class="module-label" x="358" y="366" text-anchor="middle">Gaveteiro</text><text class="module-label" x="538" y="366" text-anchor="middle">Armário</text><text class="module-label" x="756" y="236" text-anchor="middle">Moldura</text>`;
  $('#diagram').innerHTML = html;
  all('#diagram [data-code]').forEach(hit => {
    hit.onclick = () => selectMeasure(hit.dataset.code, true);
    hit.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectMeasure(hit.dataset.code, true); } };
  });
}
function renderClearances() {
  const entries = data()?.clearances || [];
  $('#add-clearance').hidden = !authenticated;
  if (!entries.length) {
    $('#clearance-list').innerHTML = '<div class="empty-state"><div class="empty-symbol" aria-hidden="true">↔</div><h3>Folgas ainda não cadastradas</h3><p>A referência enviada contém as dimensões dos módulos. As folgas de produção serão definidas pelo responsável.</p></div>';
    if (authenticated) { const button = document.createElement('button'); button.className = 'button secondary'; button.textContent = 'Cadastrar primeira folga'; button.onclick = () => openClearance(); $('#clearance-list .empty-state').append(button); }
    return;
  }
  const table = document.createElement('table'); table.className = 'clearance-table';
  table.innerHTML = `<thead><tr><th>APLICAÇÃO</th><th>FOLGA</th><th>OBSERVAÇÃO</th>${authenticated ? '<th>AÇÕES</th>' : ''}</tr></thead>`;
  const tbody = document.createElement('tbody');
  for (const row of entries) {
    const tr = document.createElement('tr');
    for (const [text, className] of [[row.name,'clearance-name'],[`${format(row.value)} cm`, ''],[row.note || '—','clearance-note']]) { const td = document.createElement('td'); td.textContent = text; td.className = className; tr.append(td); }
    if (authenticated) {
      const td = document.createElement('td'), actions = document.createElement('div'); actions.className = 'clearance-actions';
      const edit = document.createElement('button'); edit.className = 'button quiet small'; edit.textContent = 'Editar'; edit.setAttribute('aria-label', `Editar folga: ${row.name}`); edit.onclick = () => openClearance(row.id);
      const remove = document.createElement('button'); remove.className = 'button quiet small remove-button'; remove.textContent = 'Remover'; remove.setAttribute('aria-label', `Remover folga: ${row.name}`); remove.onclick = () => { if (saving) return; confirmAction('Remover esta folga?', `A folga “${row.name}” será removida ao salvar o padrão.`, 'Remover', () => { if (saving || !authenticated) return; draftGeneration++; draft.clearances = draft.clearances.filter(r => r.id !== row.id); renderClearances(); renderDirty(); }); };
      actions.append(edit,remove); td.append(actions); tr.append(td);
    }
    tbody.append(tr);
  }
  table.append(tbody); $('#clearance-list').replaceChildren(table);
}
function renderDirty() {
  $('#save-bar').hidden = !authenticated;
  $('#draft-status').textContent = isDirty() ? 'Alterações ainda não salvas' : 'Edição do padrão';
  $('#save-button').disabled = !isDirty() || saving;
  $('#discard-button').disabled = !isDirty() || saving;
  $('#save-button').textContent = saving ? 'Salvando…' : 'Salvar padrão';
  all('#add-clearance, #import-button, #logout-button, #refresh-button, #clearance-list button, #clearance-form button').forEach(button => button.disabled = saving);
}
function render() {
  document.body.classList.toggle('editing-mode', authenticated);
  $('#mode-badge').classList.toggle('editing',authenticated);
  $('#mode-badge').textContent = authenticated ? '✎ Edição liberada' : '◉ Modo consulta';
  $('#edit-button').hidden = authenticated; $('#edit-button').disabled = !saved;
  $('#logout-button').hidden = !authenticated; $('#import-button').hidden = !authenticated; $('#export-button').disabled = !saved;
  $('#revision-label').textContent = saved ? `Padrão geral · revisão ${saved.revision}` : 'Carregando padrão…';
  $('#updated-label').textContent = saved?.updatedAt ? `Atualizado em ${new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(saved.updatedAt))}` : 'Base inicial da referência · sem alterações salvas';
  renderMeasures(); renderDiagram(); renderDetail(); renderClearances(); renderDirty(); library.render();
}
function openClearance(id = null) {
  if (saving || !authenticated) return;
  clearanceEditingId = id; const row = id && draft.clearances.find(r => r.id === id);
  $('#clearance-form').reset(); $('#clearance-title').textContent = row ? 'Editar folga' : 'Adicionar folga';
  $('#clearance-name').value = row?.name || ''; $('#clearance-value').value = row?.value ?? ''; $('#clearance-note').value = row?.note || '';
  $('#clearance-dialog').showModal();
}
async function save() {
  if (saving || !authenticated) return;
  let valid;
  try { valid = validateStandards(draft, { existing:saved }); } catch (error) { notice(error.message); return; }
  saving = true; renderDirty(); renderMeasures(); library.render(); notice('');
  try {
    const result = await api('/api/standards', { method:'PUT',body:JSON.stringify({ revision:saved.revision, ...valid }) });
    saved = result; draft = clone(result); toast('Padrão salvo. Os valores já estão disponíveis para todos.');
  } catch (error) {
    notice(error.message);
    if (error.status === 409 && error.current) {
      const local = clone(draft), original = saved, latest = error.current;
      saved = latest; draft = clone(latest);
      for (const key of fields) draft[key] = mergeChanges(original[key], local[key], latest[key]);
      draftGeneration++;
      notice('O padrão mudou em outra sessão. Suas alterações foram preservadas sobre a versão mais recente. Confira os valores e salve novamente.');
    }
    if (error.status === 401) { authenticated = false; $('#login-error').textContent = 'Sua sessão terminou. Entre novamente; as alterações foram mantidas nesta tela.'; $('#login-error').hidden = false; $('#login-dialog').showModal(); }
  } finally { saving = false; render(); }
}
async function refresh(showToast = false) {
  if (saving) return;
  if (isDirty()) { if (showToast) toast('Salve ou descarte as alterações antes de atualizar a consulta.'); return; }
  const generation = draftGeneration, authAtStart = authenticated, revisionAtStart = saved?.revision, requestId = ++refreshRequest;
  try {
    const response = await api('/api/standards');
    if (saving || isDirty() || generation !== draftGeneration || authAtStart !== authenticated || revisionAtStart !== saved?.revision || requestId !== refreshRequest) return;
    saved = response; draft = clone(saved); notice(''); render(); if (showToast) toast('Consulta atualizada.');
  } catch (error) { if (showToast || !saved) notice('Não foi possível carregar os padrões. Verifique a conexão e use “Atualizar consulta”.'); }
}
function download() {
  if (!saved) return;
  const blob = new Blob([JSON.stringify(saved,null,2)],{type:'application/json'}), url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = `steffens-padrao-produtivo-r${saved.revision}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
  toast('Arquivo do padrão salvo exportado.');
}
all('.primary-nav [data-view]').forEach(button => button.onclick = () => setView(button.dataset.view));
$('#library-home').onclick = () => setView('catalog');
all('[data-family]').forEach(button => button.onclick = () => setFamily(button.dataset.family));
all('[data-close]').forEach(button => button.onclick = () => document.getElementById(button.dataset.close).close());
$('#overview-button').onclick = () => setFamily('all');
$('#edit-button').onclick = () => { $('#login-error').hidden = true; $('#password').value = ''; $('#login-dialog').showModal(); };
$('#login-form').onsubmit = async event => {
  event.preventDefault(); $('#login-submit').disabled = true; $('#login-submit').textContent = 'Entrando…'; $('#login-error').hidden = true;
  try {
    await api('/api/login',{method:'POST',body:JSON.stringify({username:$('#username').value,password:$('#password').value})});
    authenticated = true; if (!draft) draft = clone(saved); $('#password').value = ''; $('#login-dialog').close(); render(); toast('Edição liberada para o responsável.');
  } catch (error) { $('#login-error').textContent = error.message; $('#login-error').hidden = false; }
  finally { $('#login-submit').disabled = false; $('#login-submit').textContent = 'Entrar e editar'; }
};
$('#logout-button').onclick = () => {
  if (saving) return;
  const logout = async () => { try { await api('/api/logout',{method:'POST'}); authenticated=false; draft=clone(saved); notice(''); render(); toast('Acesso encerrado. Consulta disponível.'); } catch (error) { notice(error.message); } };
  if (isDirty()) confirmAction('Sair sem salvar?', 'As alterações ainda não salvas serão descartadas ao sair.', 'Sair sem salvar', logout); else logout();
};
$('#discard-button').onclick = () => { if (saving) return; confirmAction('Descartar alterações?', 'O padrão salvo será mantido e as alterações desta edição serão descartadas.', 'Descartar', () => { if (saving) return; draftGeneration++; draft=clone(saved); notice(''); render(); toast('Alterações descartadas.'); }); };
$('#save-button').onclick = save;
$('#add-clearance').onclick = () => openClearance();
$('#clearance-form').onsubmit = event => {
  event.preventDefault(); if (saving || !authenticated) return; const row = { id:clearanceEditingId || crypto.randomUUID(), name:$('#clearance-name').value, value:$('#clearance-value').valueAsNumber, note:$('#clearance-note').value };
  const candidate = clone(draft); if (clearanceEditingId) candidate.clearances = candidate.clearances.map(r => r.id === clearanceEditingId ? row : r); else candidate.clearances.push(row);
  try { validateStandards(candidate); draftGeneration++; draft = candidate; $('#clearance-dialog').close(); renderClearances(); renderDirty(); } catch(error) { toast(error.message); }
};
$('#refresh-button').onclick = () => refresh(true);
$('#export-button').onclick = download;
$('#import-button').onclick = () => $('#import-file').click();
$('#import-file').onchange = async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size>2097152) throw new Error('O arquivo excede o tamanho permitido (2 MB).');
    const incoming = JSON.parse(await file.text()); if (incoming.unit !== 'cm' || ![1,2].includes(incoming.schemaVersion)) throw new Error('Selecione um arquivo do configurador Steffens em centímetros.');
    const valid = validateStandards(incoming, {existing:saved});
    if (saving || !authenticated) return;
    confirmAction('Importar este padrão?', 'As medidas do arquivo substituirão a edição atual. A equipe verá os novos valores somente depois de salvar.', 'Importar', () => { if (saving || !authenticated) return; draftGeneration++; draft={...clone(saved),...valid}; render(); notice('Arquivo importado para edição. Confira as medidas e salve para publicar o padrão.'); });
  } catch(error) { notice(error instanceof SyntaxError ? 'O arquivo não contém uma configuração JSON válida.' : error.message); }
  finally { event.target.value=''; }
};
window.addEventListener('beforeunload',event => { if (isDirty()) { event.preventDefault(); event.returnValue=''; } });
document.addEventListener('visibilitychange',() => { if (!document.hidden && !authenticated) void refresh(); });
setInterval(() => { if (!document.hidden && !authenticated) void refresh(); },30000);
setView('catalog'); render();
try {
  const [standards, auth] = await Promise.all([api('/api/standards'),api('/api/session')]);
  saved=standards; draft=clone(saved); authenticated=auth.authenticated; render();
} catch(error) { notice('Não foi possível carregar os padrões. Verifique a conexão e use “Atualizar consulta”.'); }

if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  const tools = [{name:'read_production_standards',title:'Consultar padrões produtivos',description:'Consultar as dimensões e folgas salvas do padrão Steffens, em centímetros.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:async()=>clone(await api('/api/standards'))},
    {name:'select_dimension',title:'Selecionar dimensão',description:'Destacar uma cota A a K no configurador, sem alterar o padrão.',inputSchema:{type:'object',properties:{code:{type:'string',enum:MEASURES.map(m=>m.id)}},required:['code'],additionalProperties:false},annotations:{readOnlyHint:false},execute:async input=>{if(!input || !MEASURES.some(m=>m.id===input.code))throw new Error('Cota inválida.');setView('dimensions');selectMeasure(input.code);return{code:selected,value:data().dimensions[selected],unit:'cm'};}}];
  for (const tool of tools) { try { void Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{}); } catch {} }
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
