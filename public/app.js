import { INITIAL_DIMENSIONS, validateStandards } from './model.js?v=2';
import { createInitialModules, createInitialMethods } from './catalog.js?v=2';
import { createLibraryController } from './library.js?v=2.1';

const $ = selector => document.querySelector(selector);
const all = selector => [...document.querySelectorAll(selector)];
const format = value => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 10 }).format(value);
let saved = null, draft = null, authenticated = false, view = 'catalog', saving = false, toastTimer, clearanceEditingId = null, draftGeneration = 0, refreshRequest = 0;
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
  view = ['catalog','edges','methods','clearances'].includes(next) ? next : 'catalog';
  $('#clearances-view').hidden = view !== 'clearances';
  $('#library-view').hidden = view === 'clearances';
  all('.primary-nav [data-view]').forEach(button => { const active = button.dataset.view === view; button.classList.toggle('active', active); if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current'); });
  document.querySelector('.environment-caption').hidden = view === 'clearances'; $('#environment-nav').hidden = view === 'clearances';
  if (!$('#library-view').hidden) library.setView(view);
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
  $('#revision-label').textContent = saved ? `Biblioteca produtiva · revisão ${saved.revision}` : 'Carregando padrão…';
  $('#updated-label').textContent = saved?.updatedAt ? `Atualizado em ${new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(saved.updatedAt))}` : 'Cadastros iniciais · padrões pendentes de definição';
  renderClearances(); renderDirty(); library.render();
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
  saving = true; renderDirty(); library.render(); notice('');
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
all('[data-close]').forEach(button => button.onclick = () => document.getElementById(button.dataset.close).close());
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
  const tools = [{name:'read_production_standards',title:'Consultar padrões produtivos',description:'Consultar módulos, peças, bordas, métodos e folgas salvos do padrão Steffens, em centímetros.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:async()=>clone(await api('/api/standards'))}];
  for (const tool of tools) { try { void Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{}); } catch {} }
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
