import { FITTING_CATEGORIES, OVERLAY_TYPES, LIMITS, ATTACHMENT_LIMITS, createBlankFitting } from './model.js?v=3.1';
import { ENVIRONMENTS } from './catalog.js?v=2';

const STATUS = [['draft','Pendente'],['review','Em conferência'],['approved','Aprovado']];
const SYSTEMS = [['none','Não se aplica'],['hinged','Porta de abrir'],['sliding','Porta de correr'],['lift','Porta basculante']];
const TABS = [['identity','Identificação'],['doors','Portas e folgas'],['technical','Cotas técnicas'],['installation','Instalação'],['attachments','Anexos']];
const GAP_FIELDS = [['gapTop','Folga superior'],['gapBottom','Folga inferior'],['gapLeft','Folga esquerda'],['gapRight','Folga direita'],['gapBetween','Folga entre portas']];
const NS = 'http://www.w3.org/2000/svg';
const format = value => Number.isFinite(value) ? new Intl.NumberFormat('pt-BR',{maximumFractionDigits:10}).format(value) : 'Pendente';
const measure = value => Number.isFinite(value) ? format(value)+' cm' : 'Pendente';
const normalized = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function el(tag,cls='',text=null) { const node=document.createElement(tag); node.className=cls; if(text!==null) node.textContent=text; return node; }
function add(parent,...children) { children.flat().filter(Boolean).forEach(node=>parent.append(node)); return parent; }
function button(text,action,cls='button secondary',disabled=false) { const node=el('button',cls,text); node.type='button'; node.disabled=disabled; node.onclick=action; return node; }
function optionList(select,choices,value) { for(const [id,label] of choices) { const option=el('option','',label); option.value=id; select.append(option); } select.value=value ?? ''; }
function svg(tag,attributes={},text=null) { const node=document.createElementNS(NS,tag); for(const [key,value] of Object.entries(attributes)) node.setAttribute(key,value); if(text!==null) node.textContent=text; return node; }
function drawing(title) { const node=svg('svg',{viewBox:'0 0 460 390',class:'fitting-drawing',role:'img','aria-label':title}); node.append(svg('title',{},title)); return node; }
function rect(target,x,y,width,height,fill) { target.append(svg('rect',{x,y,width,height,fill,stroke:'#658376','stroke-width':1.5,rx:2})); }
function line(target,x1,y1,x2,y2,extra={}) { target.append(svg('line',{x1,y1,x2,y2,stroke:'#24786c','stroke-width':1.5,...extra})); }
function label(target,x,y,text,extra={}) { target.append(svg('text',{x,y,fill:'#42665a','font-size':12,'font-family':'Arial, sans-serif',...extra},text)); }
function dimension(target,x1,y1,x2,y2,text) { line(target,x1,y1,x2,y2); if(y1===y2) { line(target,x1,y1-5,x1,y1+5);line(target,x2,y2-5,x2,y2+5);label(target,(x1+x2)/2,y1-10,text,{'text-anchor':'middle'}); } else { line(target,x1-5,y1,x1+5,y1);line(target,x2-5,y2,x2+5,y2);label(target,x1+10,(y1+y2)/2,text); } }

function hingeDrawing(kind,record={}) {
  const titles={full:'Recobrimento total',half:'Recobrimento central / parcial',inset:'Porta embutida',custom:'Recobrimento específico',pending:'Recobrimento a definir'};
  const target=drawing(titles[kind] || titles.pending); label(target,22,28,titles[kind] || titles.pending,{'font-size':15,'font-weight':'bold'});
  rect(target,225,98,40,207,'#d1dfd4'); label(target,230,84,kind==='half'?'Divisória central':'Lateral');
  for(let y=118;y<297;y+=20) line(target,228,y,262,y+14,{stroke:'#adc2b1','stroke-width':1});
  const end=kind==='inset'?213:kind==='half'?244:265, doorY=kind==='inset'?269:319;
  rect(target,86,doorY,end-86,27,'#b18e67'); label(target,110,doorY+52,'Porta');
  if(kind==='half') { rect(target,253,doorY,123,27,'#b18e67');label(target,294,doorY+52,'Porta');dimension(target,244,371,253,371,'F'); }
  target.append(svg('path',{d:`M 231 168 L 198 172 L 175 ${doorY+9} L 147 ${doorY+9}`,fill:'none',stroke:'#718579','stroke-width':7,'stroke-linejoin':'round'}));
  rect(target,135,doorY+3,26,20,'#e3e9e2');label(target,26,154,'Dobradiça');line(target,95,160,188,178,{stroke:'#9daf9f','stroke-dasharray':'4 4'});
  if(kind==='inset') { dimension(target,213,250,225,250,'F');label(target,26,216,'Porta dentro do vão'); }
  else { dimension(target,225,doorY-20,end,doorY-20,'R');label(target,26,216,'Porta à frente do painel'); }
  dimension(target,225,58,265,58,'E · '+measure(record.sideThickness));
  label(target,20,383,'R = recobrimento · '+measure(record.overlay)+' | F = folga',{'font-size':11});
  return target;
}
function gapsDrawing(record) {
  const target=drawing('Vista frontal das portas e identificação das cinco folgas');
  label(target,20,28,'Folgas da porta · vista frontal',{'font-size':15,'font-weight':'bold'});
  rect(target,92,97,276,221,'#d1dfd4'); rect(target,103,109,119,197,'#b18e67');rect(target,234,109,123,197,'#b18e67');
  label(target,230,71,'Superior · '+measure(record.gapTop),{'text-anchor':'middle'});line(target,230,78,230,105);
  label(target,230,350,'Inferior · '+measure(record.gapBottom),{'text-anchor':'middle'});line(target,230,314,230,337);
  label(target,10,202,'Esq.');label(target,10,222,measure(record.gapLeft));line(target,50,209,100,209);
  label(target,382,202,'Dir.');label(target,382,222,measure(record.gapRight));line(target,360,209,377,209);
  label(target,230,161,'Entre portas',{'text-anchor':'middle','font-size':11});label(target,230,184,measure(record.gapBetween),{'text-anchor':'middle','font-size':11});
  return target;
}
function slidingDrawing(record) {
  const target=drawing('Portas de correr, sobreposição entre folhas e trilhos');label(target,20,28,'Portas de correr · esquema',{'font-size':15,'font-weight':'bold'});
  rect(target,63,107,330,173,'#d1dfd4');rect(target,73,117,178,151,'#d7bf9d');rect(target,220,127,163,151,'#b18e67');
  dimension(target,220,85,251,85,'S');label(target,75,307,'S = sobreposição · '+measure(record.doorOverlap));
  line(target,75,335,383,335,{stroke:'#718579','stroke-width':6});line(target,75,355,383,355,{stroke:'#718579','stroke-width':6});
  label(target,75,381,'Trilhos · '+format(record.trackCount)+' | Portas · '+format(record.doorCount));return target;
}

export function createFittingsController({getData,canEdit,isSaving,onChange,requestEdit,notice,confirmAction,onNavigate,uploadAttachment}) {
  const target=document.querySelector('#fittings-view'); let active=false, selectedId=null, tab='identity', search='',category='', previewOverlay=null;
  const rows=()=>getData().fittings || [], selected=()=>rows().find(row=>row.id===selectedId);
  const linked=id=>(getData().modules || []).filter(module=>(module.hardwareIds || []).includes(id));
  function update(mutator,rerender=false) { if(!canEdit()) return false; const changed=onChange(mutator); if(changed && rerender) render(); return changed; }
  function change(key,value,rerender=false) { const id=selectedId; return update(data=>{const row=data.fittings.find(item=>item.id===id);if(row)row[key]=value;},rerender); }
  function refreshDrawings() {
    const row=selected();if(!row)return;
    const main=target.querySelector('#fitting-primary-drawing'),gaps=target.querySelector('#fitting-gap-drawing');
    if(main){const next=row.doorSystem==='sliding'?slidingDrawing(row):hingeDrawing(previewOverlay || row.overlayType,row);next.id='fitting-primary-drawing';main.replaceWith(next);}
    if(gaps){const next=gapsDrawing(row);next.id='fitting-gap-drawing';gaps.replaceWith(next);}
  }
  function field(record,key,title,{type='text',choices=null,max=120,hint='',wide=false,onEdit=null,min=0}={}) {
    const holder=el('label','module-field'+(wide?' field-wide':'')); let input;
    if(choices) { input=el('select','module-select');optionList(input,choices,record[key]); }
    else if(type==='textarea') { input=el('textarea','module-textarea');input.rows=4;input.maxLength=max;input.value=record[key] || ''; }
    else { input=el('input','module-input');input.type='text';input.maxLength=type==='number'?30:max;input.value=record[key] ?? ''; if(type==='number'){input.inputMode='decimal';input.placeholder='Pendente';} }
    input.setAttribute('aria-label',title);input.disabled=!canEdit();
    input.addEventListener(type==='number'||choices?'change':'input',()=>{
      let value=input.value;
      if(type==='number') {
        const raw=value.trim().replace(',','.'); value=raw===''?null:Number(raw);
        if(raw!=='' && (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)||!Number.isFinite(value)||value<min||value>1000000)) {notice(title+': informe um número válido ou deixe pendente.');input.value=record[key]??'';return;}
      }
      if(onEdit) onEdit(value);else if(change(key,value,!!choices) && type==='number') refreshDrawings();
    });
    add(holder,el('span','module-field-label',title),input,hint?el('small','module-field-hint',hint):null); return holder;
  }
  function heading(title,description,actions=[]) { return add(el('header','fittings-header'),add(el('div'),el('h2','',title),el('p','',description)),add(el('div','library-actions'),actions)); }
  function readOnly() { return !canEdit()?add(el('div','library-readonly'),el('span','',isSaving()?'Aguarde a operação em andamento.':'Consulta dos padrões salvos. Entre para cadastrar ou editar ferragens.'),isSaving()?null:button('Editar padrões',requestEdit,'button quiet small')):document.createDocumentFragment(); }
  function newFitting(preset=null) {
    if(!canEdit()) { if(!isSaving())requestEdit();return; }
    if(rows().length>=LIMITS.fittings) {notice('O catálogo comporta até 100 ferragens.');return;}
    const dialog=el('dialog','library-dialog'), form=el('form','module-form'), name=el('input','module-input'), choose=el('select','module-select');
    name.maxLength=80;name.required=true;name.setAttribute('aria-label','Nome da ferragem');
    optionList(choose,FITTING_CATEGORIES.map(item=>[item.id,item.title]),preset || 'hinge');choose.setAttribute('aria-label','Categoria da ferragem');
    add(form,el('h2','','Cadastrar ferragem'),add(el('label','module-field'),el('span','module-field-label','Nome da ferragem'),name),add(el('label','module-field'),el('span','module-field-label','Categoria da ferragem'),choose));
    const submit=button('Cadastrar',()=>{},'button primary');submit.type='submit';add(form,add(el('div','library-actions'),button('Cancelar',()=>dialog.close(),'button quiet'),submit));
    form.onsubmit=event=>{event.preventDefault();if(!canEdit()||!name.value.trim())return;const id='fitting_'+crypto.randomUUID(), row=createBlankFitting(name.value.trim(),id);row.category=choose.value;row.doorSystem=({hinge:'hinged',sliding:'sliding',lift:'lift'}[choose.value] || 'none');if(update(data=>data.fittings.push(row))){dialog.close();openFitting(id);}};
    dialog.append(form);dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();
  }
  function renderHome() {
    target.append(heading('Ferragens usadas','Cadastros por marca e referência, com sistema de porta, folgas, instalação e documentos do fabricante.',[button('Cadastrar ferragem',()=>newFitting(), 'button primary',isSaving())]),readOnly());
    const toolbar=el('div','fittings-toolbar'), input=el('input','library-search'), choose=el('select','module-select');input.type='search';input.placeholder='Buscar nome, marca ou referência…';input.setAttribute('aria-label','Buscar ferragem');input.value=search;
    optionList(choose,[['','Todas as categorias'],...FITTING_CATEGORIES.map(item=>[item.id,item.title])],category);choose.setAttribute('aria-label','Filtrar categoria de ferragem');
    const listing=el('div','fittings-grid'); function listCards() {listing.replaceChildren();const found=rows().filter(row=>(!category||row.category===category)&&normalized([row.title,row.brand,row.reference,row.application].join(' ')).includes(normalized(search)));
      for(const row of found) { const card=el('article','fitting-card');add(card,add(el('div','fitting-card-top'),el('span','fitting-category',FITTING_CATEGORIES.find(item=>item.id===row.category)?.title || 'Ferragem'),el('span','module-status status-'+row.status,STATUS.find(item=>item[0]===row.status)?.[1])),el('h3','',row.title),el('span','fitting-reference',[row.brand,row.reference].filter(Boolean).join(' · ') || 'Marca e referência pendentes'),el('p','',row.application || 'Aplicação pendente de definição.'),el('span','fitting-attachment-count',row.attachments.length+' anexos · '+linked(row.id).length+' módulos vinculados'),button('Consultar ferragem',()=>openFitting(row.id)));listing.append(card);}
      if(!found.length)listing.append(add(el('div','library-empty field-wide'),el('h3','',rows().length?'Nenhuma ferragem encontrada':'Catálogo de ferragens a definir'),el('p','',rows().length?'Altere a busca ou a categoria.':'Cadastre os modelos usados pela empresa e anexe suas fichas técnicas. As medidas começam pendentes.')));
    }
    input.oninput=()=>{search=input.value;listCards();};choose.onchange=()=>{category=choose.value;listCards();};add(toolbar,input,choose);target.append(toolbar,listing);listCards();
    const guide=el('details','fitting-guide');guide.open=!rows().length;guide.append(el('summary','','Como consultar os detalhes de recobrimento'));
    guide.append(el('p','fitting-description','O desenho identifica a posição da porta em relação ao painel. R representa o recobrimento; F representa a folga. As cotas reais dependem da ferragem e do padrão aprovado.'));
    const examples=el('div','fittings-grid');for(const [kind,description] of [['full','Uma porta recobre a face da lateral.'],['half','Duas portas dividem uma divisória central.'],['inset','A porta fica dentro do vão, ao lado da lateral.']])examples.append(add(el('article','fitting-visual'),hingeDrawing(kind),el('p','fitting-drawing-caption',description+' Esquema sem escala e sem medidas de fabricação.')));guide.append(examples);target.append(guide);
  }
  function renderIdentity(row,panel) {
    const form=el('div','fitting-form');
    add(form,field(row,'title','Nome da ferragem',{max:80}),field(row,'category','Categoria da ferragem',{choices:FITTING_CATEGORIES.map(item=>[item.id,item.title]),onEdit:value=>{previewOverlay=null;update(data=>{const item=data.fittings.find(f=>f.id===row.id);item.category=value;item.doorSystem=({hinge:'hinged',sliding:'sliding',lift:'lift'}[value]||'none');},true);}}),field(row,'brand','Marca'),field(row,'reference','Modelo / código da ferragem'),field(row,'documentRevision','Revisão / data do manual'),field(row,'status','Situação da ferragem',{choices:STATUS}),field(row,'application','Aplicação da ferragem',{type:'textarea',max:2000,wide:true}),field(row,'description','Descrição da ferragem',{type:'textarea',max:2000,wide:true}),field(row,'notes','Observações da ferragem',{type:'textarea',max:2000,wide:true}));panel.append(form);
    const modules=linked(row.id);panel.append(el('h4','','Módulos que usam esta ferragem'));if(!modules.length)panel.append(el('p','fitting-description','Vincule esta ferragem na aba Ferragens de cada módulo.'));
    else {const list=el('ul','fitting-linked-summary');for(const module of modules)list.append(el('li','',[ENVIRONMENTS.find(env=>env.id===module.environmentId)?.title,module.subgroup,module.title].filter(Boolean).join(' / ')));panel.append(list);}
    panel.append(add(el('div','fitting-info'),el('strong','','Antes de aprovar'),el('p','','Preencha marca, modelo, instalação e conferências. Para portas de abrir ou correr, anexe a ficha técnica e defina as cinco folgas. Porta de abrir também exige tipo e medida de recobrimento e espessuras; porta de correr exige sobreposição, quantidades de portas e trilhos e regra de corte. Todas as cotas adicionais devem ter valor e unidade.')));
    if(canEdit())panel.append(button('Remover ferragem',()=>{
      if(linked(row.id).length){notice('Esta ferragem está vinculada a módulos. Remova os vínculos antes de excluir o cadastro.');return;}
      confirmAction('Remover esta ferragem?',`O cadastro “${row.title}” será removido ao salvar o padrão. Os arquivos existentes continuam no acervo e no histórico.`, 'Remover',()=>{if(update(data=>{data.fittings=data.fittings.filter(item=>item.id!==row.id);})){selectedId=null;render();}});
    },'button quiet remove-button',isSaving()));
  }
  function renderDoors(row,panel) {
    panel.append(el('p','fitting-description','Medidas em centímetros. Use os dados do modelo e do manual anexado. 1 mm = 0,1 cm. Os desenhos são esquemas sem escala; os campos não geram medidas de corte automaticamente.'));
    const layout=el('div','fitting-door-layout'), form=el('div','fitting-form'), visual=el('div','fitting-visual');
    form.append(field(row,'doorSystem','Sistema de porta',{choices:SYSTEMS}));
    if(row.doorSystem==='hinged') {
      add(form,field(row,'overlayType','Tipo de recobrimento',{choices:OVERLAY_TYPES.map(item=>[item.id,item.title]),onEdit:value=>{previewOverlay=null;change('overlayType',value,true);}}),field(row,'overlay','Recobrimento da porta (cm)',{type:'number',hint:'Distância que a porta recobre o painel; não é um percentual.'}),field(row,'doorThickness','Espessura da porta (cm)',{type:'number'}),field(row,'sideThickness','Espessura da lateral / divisória (cm)',{type:'number'}),field(row,'cupDiameter','Diâmetro do caneco (cm)',{type:'number'}),field(row,'cupDepth','Profundidade do caneco (cm)',{type:'number'}),field(row,'cupDistance','Distância da borda ao caneco (cm)',{type:'number',hint:'Identifique no manual de qual borda e ponto parte a cota.'}),field(row,'openingAngle','Ângulo de abertura (graus)',{type:'number'}));
      const kind=previewOverlay || row.overlayType, controls=el('div','fitting-overlay-options');for(const [id,title] of OVERLAY_TYPES.filter(item=>['full','half','inset'].includes(item.id)).map(item=>[item.id,item.title]))controls.append(button(title,()=>{previewOverlay=id;render();},'button quiet small'));
      add(visual,hingeDrawing(kind,row),controls,el('p','fitting-drawing-caption','Os botões mostram diferentes posições da porta. Para definir o padrão, altere o campo Tipo de recobrimento. No central/parcial, o recobrimento de cada porta depende do conjunto dobradiça e calço.'));
    } else if(row.doorSystem==='sliding') {
      add(form,field(row,'doorThickness','Espessura da porta (cm)',{type:'number'}),field(row,'doorOverlap','Sobreposição entre portas (cm)',{type:'number'}),field(row,'doorCount','Quantidade de portas',{type:'number',min:1}),field(row,'trackCount','Quantidade de trilhos',{type:'number',min:1}),field(row,'maxDoorWeight','Peso máximo por porta (kg)',{type:'number'}),field(row,'widthDeduction','Desconto de largura informado (cm)',{type:'number'}),field(row,'heightDeduction','Desconto de altura informado (cm)',{type:'number'}));
      add(visual,slidingDrawing(row),el('p','fitting-drawing-caption','Sobreposição e descontos variam conforme o sistema. Consulte o PDF do modelo para instalação, perfis e cálculo das folhas. O esquema mostra duas folhas apenas para identificar a sobreposição.'));
    } else if(row.doorSystem==='lift') {
      add(form,field(row,'doorThickness','Espessura da porta (cm)',{type:'number'}),field(row,'openingAngle','Ângulo de abertura (graus)',{type:'number'}),field(row,'maxDoorWeight','Peso máximo por porta (kg)',{type:'number'}));visual.append(el('p','fitting-description','Registre no manual os limites de tamanho, peso e regulagem do articulador usado.'));
    } else visual.append(el('p','fitting-description','Escolha o sistema de porta para consultar o esquema correspondente. Outros tipos de ferragem podem usar somente cotas técnicas e instruções.'));
    const mainDrawing=visual.querySelector('svg');if(mainDrawing)mainDrawing.id='fitting-primary-drawing';
    add(layout,form,visual);panel.append(layout);
    if(row.doorSystem!=='none') {panel.append(el('h4','','Folgas da porta'));const gaps=el('div','fitting-gaps');for(const [key,title] of GAP_FIELDS)gaps.append(field(row,key,title+' (cm)',{type:'number'}));const diagram=gapsDrawing(row);diagram.id='fitting-gap-drawing';panel.append(gaps,add(el('details','fitting-guide'),el('summary','','Ver identificação das cinco folgas'),diagram));}
    panel.append(el('h4','','Critério para dimensionar a porta'),field(row,'cuttingRule','Regra de corte / dimensionamento',{type:'textarea',max:8000,wide:true,hint:'Descreva a fórmula e os pontos de medição conforme o manual. Para correr, inclua o número de folhas e o tratamento da sobreposição.'}));
  }
  function renderTechnical(row,panel) {
    panel.append(el('p','fitting-description','Registre as cotas específicas da ficha técnica, com descrição, valor e unidade. Use as observações para limites, intervalos e ponto de medição. Estes valores conservam a unidade do documento.'));
    const list=el('div','piece-list');for(const cota of row.technicalData || []) {
      const card=el('article','piece-card'), form=el('div','fitting-form');const edit=key=>value=>update(data=>{const item=data.fittings.find(f=>f.id===row.id)?.technicalData.find(item=>item.id===cota.id);if(item)item[key]=value;});
      add(form,field(cota,'label','Descrição / identificação da cota',{max:80,onEdit:edit('label')}),field(cota,'value','Valor da cota',{type:'number',onEdit:edit('value')}),field(cota,'unit','Unidade da cota',{choices:[['pending','A confirmar'],['mm','Milímetros (mm)'],['cm','Centímetros (cm)'],['degree','Graus (°)'],['kg','Quilogramas (kg)']],onEdit:edit('unit')}),field(cota,'note','Observação da cota',{type:'textarea',max:500,onEdit:edit('note')}));add(card,form);if(canEdit())card.append(button('Remover cota',()=>update(data=>{const item=data.fittings.find(f=>f.id===row.id);item.technicalData=item.technicalData.filter(item=>item.id!==cota.id);},true),'button quiet remove-button'));list.append(card);
    }
    if(!list.childElementCount)list.append(el('p','fitting-pending','Nenhuma cota adicional cadastrada. As medidas principais ficam em Portas e folgas.'));panel.append(list);
    if(canEdit())panel.append(button('Adicionar cota técnica',()=>{
      if((row.technicalData || []).length>=30){notice('Use até 30 cotas por ferragem.');return;}
      update(data=>{const item=data.fittings.find(f=>f.id===row.id);(item.technicalData ||= []).push({id:'cota_'+crypto.randomUUID(),label:'Nova cota',value:null,unit:'pending',note:''});},true);
    },'button secondary'));
  }
  function renderInstallation(row,panel) {
    panel.append(el('p','fitting-description','Descreva o processo usado pela empresa e indique a página do manual quando houver furação ou regulagem específica.'));
    add(panel,add(el('div','fitting-form'),field(row,'installation','Instruções de instalação',{type:'textarea',max:8000,wide:true,hint:'Posicionamento, furação, fixação, sequência de montagem e regulagens.'}),field(row,'checks','Conferências da ferragem',{type:'textarea',max:8000,wide:true,hint:'Recobrimento, folgas, alinhamento, funcionamento e fixação.'})));
  }
  function renderAttachments(row,panel) {
    panel.append(el('p','fitting-description','Anexe a ficha técnica, o PDF do sistema de correr e imagens de instalação. Os arquivos ficam disponíveis para consulta e download. O vínculo com esta ferragem é publicado em Salvar padrão.'));
    if(canEdit()) {
      const upload=el('label','fitting-upload'), input=el('input');input.type='file';input.accept='.pdf,.png,.jpg,.jpeg,.webp';input.disabled=row.attachments.length>=ATTACHMENT_LIMITS.maxPerFitting || isSaving();input.setAttribute('aria-label','Anexar PDF ou imagem');
      input.onchange=async()=>{const file=input.files[0], id=row.id;if(!file)return;try{const metadata=await uploadAttachment(file);update(data=>{const item=data.fittings.find(f=>f.id===id);if(item&&item.attachments.length<ATTACHMENT_LIMITS.maxPerFitting)item.attachments.push(metadata);},true);}catch(error){notice(error.message);} };
      add(upload,el('strong','','Adicionar documento ou imagem'),input,el('small','','PDF, PNG, JPG ou WebP · até 5 MiB por arquivo · até 10 anexos por ferragem.'));panel.append(upload);
    }
    const list=el('div','fitting-attachments');for(const file of row.attachments) {
      const card=el('article','fitting-attachment'), url='/api/attachments/'+encodeURIComponent(file.id);
      if(file.mime.startsWith('image/')) {const img=el('img');img.src=url;img.alt='Ficha técnica: '+file.name;img.loading='lazy';card.append(img);} else card.append(el('div','fitting-pdf-icon','PDF'));
      add(card,el('h4','',file.name),el('p','',format(file.size/1024)+' KiB · enviado em '+new Intl.DateTimeFormat('pt-BR',{dateStyle:'short'}).format(new Date(file.createdAt))));
      const links=el('div','library-actions');for(const [title,href] of [['Abrir documento',url],['Baixar arquivo',url+'?download=1']]) {const link=el('a','attachment-link',title);link.href=href;link.target='_blank';link.rel='noopener';links.append(link);}card.append(links);
      if(canEdit())card.append(button('Remover vínculo do anexo',()=>confirmAction('Remover este vínculo?',`“${file.name}” deixará de aparecer nesta ferragem ao salvar. O arquivo permanece no acervo para preservar o histórico.`, 'Remover vínculo',()=>update(data=>{const item=data.fittings.find(f=>f.id===row.id);if(item)item.attachments=item.attachments.filter(item=>item.id!==file.id);},true)),'button quiet remove-button'));list.append(card);
    }
    panel.append(list);if(!row.attachments.length)panel.append(el('p','fitting-pending','Nenhum anexo cadastrado nesta ferragem.'));
  }
  function renderDetail(row) {
    target.append(heading(row.title,[row.brand,row.reference].filter(Boolean).join(' · ') || 'Marca e referência pendentes',[button('Voltar às ferragens',()=>{selectedId=null;render();},'button quiet')]),readOnly());
    if(row.status!=='approved')target.append(el('div','fitting-pending','Cadastro '+(row.status==='review'?'em conferência':'pendente')+'. Revise os dados e documentos antes de liberar este padrão para fabricação.'));
    const nav=el('div','fitting-tabs');nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Dados da ferragem');
    TABS.forEach(([id,title],index)=>{const node=button(title,()=>{tab=id;render();document.querySelector('#fitting-tab-'+id)?.focus();},'fitting-tab'+(tab===id?' active':''));node.id='fitting-tab-'+id;node.setAttribute('role','tab');node.setAttribute('aria-selected',String(tab===id));node.setAttribute('aria-controls','fitting-panel');node.tabIndex=tab===id?0:-1;node.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();tab=TABS[event.key==='Home'?0:event.key==='End'?TABS.length-1:(index+(event.key==='ArrowRight'?1:-1)+TABS.length)%TABS.length][0];render();document.querySelector('#fitting-tab-'+tab).focus();};nav.append(node);});target.append(nav);
    const panel=el('section','fitting-detail');panel.id='fitting-panel';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','fitting-tab-'+tab);
    ({identity:renderIdentity,doors:renderDoors,technical:renderTechnical,installation:renderInstallation,attachments:renderAttachments}[tab])(row,panel);target.append(panel);
  }
  function render() {if(!active)return;target.replaceChildren();const row=selected();if(row)renderDetail(row);else{selectedId=null;renderHome();}}
  function openFitting(id) {onNavigate('fittings');selectedId=id;tab='identity';previewOverlay=null;render();}
  return {render,openFitting,setView(view){active=view==='fittings';if(active){selectedId=null;render();}}};
}
