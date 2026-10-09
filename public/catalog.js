// A organização abaixo é um ponto de partida para cadastro. Medidas, materiais,
// quantidades e métodos precisam ser definidos e validados pela Steffens Móveis.
export const ENVIRONMENTS = [
  { id: 'cozinha', title: 'Cozinha', description: 'Balcões, superiores, torres e cantos.', icon: '🍳', accent: '#e8a04a' },
  { id: 'banheiro', title: 'Banheiro', description: 'Mobiliário de apoio, lavatório e armazenamento.', icon: '🚿', accent: '#62aaa9' },
  { id: 'dormitorio', title: 'Dormitório', description: 'Armários, cabeceiras e móveis de apoio.', icon: '🛏️', accent: '#b490c8' },
  { id: 'gourmet', title: 'Área gourmet', description: 'Mobiliário e bancadas para o espaço gourmet.', icon: '🍽️', accent: '#cc885f' },
  { id: 'sala', title: 'Sala de estar', description: 'Racks, painéis, estantes e aparadores.', icon: '🛋️', accent: '#81a786' },
  { id: 'mezanino', title: 'Mezanino', description: 'Mobiliário para o mezanino. Não inclui estrutura ou projeto do piso.', icon: '📐', accent: '#799dbc' },
  { id: 'despensa', title: 'Despensa', description: 'Módulos para armazenamento e organização.', icon: '🗄️', accent: '#a6aa6d' },
  { id: 'suite', title: 'Suíte', description: 'Dormitório, banheiro e closet organizados no mesmo ambiente.', icon: '🏡', accent: '#c49ba4' },
  { id: 'hall', title: 'Hall de entrada', description: 'Aparadores, sapateiras, bancos e painéis.', icon: '🚪', accent: '#c7a465' },
  { id: 'revestimento', title: 'Revestimentos', description: 'Painéis e peças de acabamento.', icon: '🪵', accent: '#ae8c70' },
  { id: 'tampo', title: 'Tampos engrossados', description: 'Superfícies e complementos com composição a definir.', icon: '▱', accent: '#8a9da7' },
  { id: 'peca', title: 'Peças individuais', description: 'Peças avulsas para registrar medidas, corte e bordas.', icon: '🧩', accent: '#7faeaa' },
];

// A numeração é fixa na vista da face A: superior, direita, inferior, esquerda.
export const EDGE_SIDES = [
  { id: 'L1', label: 'Superior', description: 'Borda superior na vista da face A.' },
  { id: 'L2', label: 'Direita', description: 'Borda direita na vista da face A.' },
  { id: 'L3', label: 'Inferior', description: 'Borda inferior na vista da face A.' },
  { id: 'L4', label: 'Esquerda', description: 'Borda esquerda na vista da face A.' },
];

const BOX = ['Lateral esquerda', 'Lateral direita', 'Base', 'Topo', 'Prateleira', 'Fundo', 'Frente'];
const OPEN_BOX = ['Lateral esquerda', 'Lateral direita', 'Base', 'Topo', 'Prateleira', 'Fundo'];
const DRAWERS = ['Lateral esquerda', 'Lateral direita', 'Base', 'Topo', 'Fundo', 'Frente de gaveta', 'Lateral de gaveta', 'Fundo de gaveta'];
const BASE_WORK = ['Lateral esquerda', 'Lateral direita', 'Base', 'Travessa', 'Fundo', 'Frente'];

function entry(id, environmentId, subgroup, title, kind, family, description, pieceNames) {
  return { id, environmentId, subgroup, title, kind, family, description, pieceNames: [...pieceNames] };
}

export const MODULE_CATALOG = [
  entry('cozinha-balcao-portas', 'cozinha', 'Balcões', 'Balcão com portas', 'base', 'balcao', 'Caixa inferior com frentes; composição a validar.', BOX),
  entry('cozinha-balcao-gavetas', 'cozinha', 'Balcões', 'Balcão com gavetas', 'drawers', 'gaveteiro', 'Armazenamento inferior com gavetas a detalhar.', DRAWERS),
  entry('cozinha-balcao-pia', 'cozinha', 'Balcões', 'Balcão para pia', 'base', 'balcao', 'Módulo inferior com espaço para instalações e pia.', BASE_WORK),
  entry('cozinha-balcao-cooktop', 'cozinha', 'Balcões', 'Balcão para cooktop', 'base', 'balcao', 'Módulo cuja composição depende do equipamento e do projeto.', BASE_WORK),
  entry('cozinha-superior-portas', 'cozinha', 'Superiores', 'Superior com portas', 'upper', 'superior', 'Armazenamento superior com frentes a definir.', BOX),
  entry('cozinha-superior-aberto', 'cozinha', 'Superiores', 'Nicho superior aberto', 'upper', 'superior', 'Módulo aberto para apoio e organização.', OPEN_BOX),
  entry('cozinha-torre-armazenamento', 'cozinha', 'Torres', 'Torre de armazenamento', 'tall', 'armario', 'Armário alto com divisão interna a definir.', BOX),
  entry('cozinha-torre-equipamentos', 'cozinha', 'Torres', 'Torre para equipamentos', 'tall', 'armario', 'Vãos, apoios e ventilação dependem dos equipamentos escolhidos.', ['Lateral esquerda', 'Lateral direita', 'Base', 'Topo', 'Prateleira de apoio', 'Divisória', 'Fundo', 'Frente']),
  entry('cozinha-balcao-canto', 'cozinha', 'Cantos', 'Balcão de canto', 'base', 'balcao', 'Encontro de módulos com acesso e composição a detalhar.', ['Lateral', 'Base', 'Travessa', 'Prateleira', 'Fundo', 'Frente', 'Arremate de canto']),

  entry('banheiro-lavatorio', 'banheiro', 'Balcões', 'Balcão para lavatório', 'base', 'balcao', 'Módulo de apoio com passagem de instalações a definir.', BASE_WORK),
  entry('banheiro-gaveteiro', 'banheiro', 'Balcões', 'Gaveteiro de apoio', 'drawers', 'gaveteiro', 'Gavetas para organização do banheiro.', DRAWERS),
  entry('banheiro-espelheira', 'banheiro', 'Superiores', 'Espelheira', 'upper', 'superior', 'Armário com frente destinada ao espelho; composição a validar.', ['Lateral esquerda', 'Lateral direita', 'Base', 'Topo', 'Prateleira', 'Fundo', 'Frente para espelho']),
  entry('banheiro-superior', 'banheiro', 'Superiores', 'Armário superior', 'upper', 'superior', 'Armazenamento superior para o banheiro.', BOX),
  entry('banheiro-coluna', 'banheiro', 'Armários', 'Armário coluna', 'tall', 'armario', 'Armazenamento vertical com divisões a definir.', BOX),
  entry('banheiro-nicho', 'banheiro', 'Nichos', 'Nicho aberto', 'upper', 'superior', 'Pequeno módulo aberto de apoio.', OPEN_BOX),

  entry('dormitorio-roupeiro-portas', 'dormitorio', 'Armários', 'Roupeiro com portas', 'tall', 'armario', 'Armário com frentes e organização interna a definir.', BOX),
  entry('dormitorio-roupeiro-aberto', 'dormitorio', 'Armários', 'Roupeiro aberto', 'tall', 'armario', 'Armazenamento aberto com divisões internas a detalhar.', OPEN_BOX),
  entry('dormitorio-criado', 'dormitorio', 'Móveis de apoio', 'Criado com gavetas', 'drawers', 'gaveteiro', 'Móvel de apoio ao lado da cama.', DRAWERS),
  entry('dormitorio-comoda', 'dormitorio', 'Móveis de apoio', 'Cômoda', 'drawers', 'gaveteiro', 'Móvel com gavetas e organização a definir.', DRAWERS),
  entry('dormitorio-cabeceira', 'dormitorio', 'Complementos', 'Painel de cabeceira', 'panel', 'none', 'Painel com acabamento e fixação a definir.', ['Painel principal', 'Arremate lateral', 'Travessa de apoio']),
  entry('dormitorio-bancada', 'dormitorio', 'Complementos', 'Bancada de estudo', 'top', 'none', 'Superfície de trabalho com apoios a validar.', ['Tampo', 'Lateral de apoio', 'Travessa']),
  entry('dormitorio-nicho', 'dormitorio', 'Complementos', 'Nicho suspenso', 'upper', 'superior', 'Módulo aberto de apoio e exposição.', OPEN_BOX),

  entry('gourmet-balcao-pia', 'gourmet', 'Balcões', 'Balcão para pia', 'base', 'balcao', 'Módulo de apoio com instalações a detalhar.', BASE_WORK),
  entry('gourmet-balcao-portas', 'gourmet', 'Balcões', 'Balcão com portas', 'base', 'balcao', 'Armazenamento inferior para o espaço gourmet.', BOX),
  entry('gourmet-gaveteiro', 'gourmet', 'Balcões', 'Gaveteiro', 'drawers', 'gaveteiro', 'Gavetas de organização com composição a definir.', DRAWERS),
  entry('gourmet-superior', 'gourmet', 'Superiores', 'Armário superior', 'upper', 'superior', 'Armazenamento superior com frentes a definir.', BOX),
  entry('gourmet-torre', 'gourmet', 'Torres', 'Torre de apoio', 'tall', 'armario', 'Armário alto para o espaço gourmet.', BOX),
  entry('gourmet-bancada', 'gourmet', 'Bancadas', 'Bancada de apoio', 'top', 'none', 'Superfície com material, acabamento e apoios a definir.', ['Tampo', 'Lateral de apoio', 'Arremate']),

  entry('sala-rack', 'sala', 'Móveis de apoio', 'Rack', 'base', 'balcao', 'Móvel inferior para equipamentos e armazenamento.', BOX),
  entry('sala-aparador', 'sala', 'Móveis de apoio', 'Aparador', 'base', 'balcao', 'Móvel de apoio com composição a definir.', BOX),
  entry('sala-bar', 'sala', 'Móveis de apoio', 'Móvel para bar', 'base', 'balcao', 'Armazenamento e apoio para o bar.', BOX),
  entry('sala-painel-tv', 'sala', 'Painéis', 'Painel para TV', 'panel', 'none', 'Painel com passagens e fixações a detalhar no projeto.', ['Painel principal', 'Arremate lateral', 'Travessa de apoio']),
  entry('sala-estante', 'sala', 'Estantes', 'Estante aberta', 'tall', 'armario', 'Módulo aberto com prateleiras a definir.', OPEN_BOX),
  entry('sala-vitrine', 'sala', 'Estantes', 'Armário de exposição', 'tall', 'armario', 'Armário para exposição com frentes e materiais a definir.', BOX),
  entry('sala-nicho', 'sala', 'Nichos', 'Nicho superior', 'upper', 'superior', 'Módulo aberto para exposição e organização.', OPEN_BOX),

  entry('mezanino-bancada', 'mezanino', 'Trabalho e apoio', 'Bancada de trabalho', 'top', 'none', 'Mobiliário para o mezanino; apoios a validar no projeto.', ['Tampo', 'Lateral de apoio', 'Travessa']),
  entry('mezanino-gaveteiro', 'mezanino', 'Trabalho e apoio', 'Gaveteiro', 'drawers', 'gaveteiro', 'Gavetas para organizar a área de trabalho.', DRAWERS),
  entry('mezanino-armario-baixo', 'mezanino', 'Armazenamento', 'Armário baixo', 'base', 'balcao', 'Mobiliário baixo para armazenamento no mezanino.', BOX),
  entry('mezanino-estante', 'mezanino', 'Armazenamento', 'Estante aberta', 'tall', 'armario', 'Estante de mobiliário; não inclui estrutura do piso.', OPEN_BOX),
  entry('mezanino-nicho', 'mezanino', 'Armazenamento', 'Nicho superior', 'upper', 'superior', 'Módulo de mobiliário com instalação a definir.', OPEN_BOX),

  entry('despensa-armario-alto', 'despensa', 'Armários', 'Armário alto', 'tall', 'armario', 'Armazenamento fechado com divisões internas a definir.', BOX),
  entry('despensa-estante', 'despensa', 'Armários', 'Estante aberta', 'tall', 'armario', 'Prateleiras abertas para organização da despensa.', OPEN_BOX),
  entry('despensa-balcao', 'despensa', 'Balcões', 'Balcão com portas', 'base', 'balcao', 'Armazenamento inferior com frentes a definir.', BOX),
  entry('despensa-gaveteiro', 'despensa', 'Balcões', 'Gaveteiro', 'drawers', 'gaveteiro', 'Gavetas para organização de itens.', DRAWERS),
  entry('despensa-superior', 'despensa', 'Superiores', 'Armário superior', 'upper', 'superior', 'Módulo superior para ampliar o armazenamento.', BOX),

  entry('suite-roupeiro', 'suite', 'Dormitório', 'Roupeiro', 'tall', 'armario', 'Armário do dormitório da suíte.', BOX),
  entry('suite-cabeceira', 'suite', 'Dormitório', 'Painel de cabeceira', 'panel', 'none', 'Painel de cabeceira com composição a definir.', ['Painel principal', 'Arremate lateral', 'Travessa de apoio']),
  entry('suite-criado', 'suite', 'Dormitório', 'Criado com gavetas', 'drawers', 'gaveteiro', 'Móvel de apoio ao lado da cama.', DRAWERS),
  entry('suite-lavatorio', 'suite', 'Banheiro', 'Balcão para lavatório', 'base', 'balcao', 'Módulo do banheiro com instalações a detalhar.', BASE_WORK),
  entry('suite-espelheira', 'suite', 'Banheiro', 'Espelheira', 'upper', 'superior', 'Armazenamento com frente para espelho a definir.', ['Lateral esquerda', 'Lateral direita', 'Base', 'Topo', 'Prateleira', 'Fundo', 'Frente para espelho']),
  entry('suite-coluna-banheiro', 'suite', 'Banheiro', 'Armário coluna', 'tall', 'armario', 'Armazenamento vertical do banheiro da suíte.', BOX),
  entry('suite-closet-aberto', 'suite', 'Closet', 'Armário aberto', 'tall', 'armario', 'Módulo de closet com organização interna a definir.', OPEN_BOX),
  entry('suite-closet-gaveteiro', 'suite', 'Closet', 'Gaveteiro de closet', 'drawers', 'gaveteiro', 'Gavetas de apoio ao closet.', DRAWERS),

  entry('hall-aparador', 'hall', 'Móveis de apoio', 'Aparador', 'base', 'balcao', 'Móvel de apoio para o hall de entrada.', BOX),
  entry('hall-sapateira', 'hall', 'Armazenamento', 'Sapateira', 'tall', 'armario', 'Armário para calçados com divisão interna a definir.', BOX),
  entry('hall-banco', 'hall', 'Móveis de apoio', 'Banco com armazenamento', 'base', 'balcao', 'Mobiliário com uso e apoios a validar antes de produzir.', ['Lateral esquerda', 'Lateral direita', 'Base', 'Tampo', 'Divisória', 'Fundo', 'Frente']),
  entry('hall-painel', 'hall', 'Painéis', 'Painel de entrada', 'panel', 'none', 'Painel de acabamento com instalação a detalhar.', ['Painel principal', 'Arremate lateral', 'Travessa de apoio']),

  entry('revestimento-parede', 'revestimento', 'Painéis', 'Painel de parede', 'panel', 'none', 'Revestimento com modulação, acabamento e fixação a definir.', ['Painel principal', 'Arremate', 'Travessa de apoio']),
  entry('revestimento-ripado', 'revestimento', 'Painéis', 'Painel ripado', 'panel', 'none', 'Composição de ripas e apoio a detalhar no projeto.', ['Ripa', 'Painel de apoio', 'Arremate']),
  entry('revestimento-lateral', 'revestimento', 'Acabamentos', 'Painel lateral de acabamento', 'panel', 'none', 'Peça de acabamento lateral com medida a conferir.', ['Painel lateral']),
  entry('revestimento-coluna', 'revestimento', 'Painéis', 'Revestimento de coluna', 'panel', 'none', 'Painéis de acabamento ao redor de uma coluna existente.', ['Painel frontal', 'Painel lateral', 'Arremate']),
  entry('revestimento-arremate', 'revestimento', 'Acabamentos', 'Arremate de acabamento', 'piece', 'moldura', 'Peça de fechamento de encontro com perfil a definir.', ['Arremate']),

  entry('tampo-reto', 'tampo', 'Tampos', 'Tampo reto', 'top', 'none', 'Superfície reta com dimensões e acabamento a definir.', ['Tampo']),
  entry('tampo-em-l', 'tampo', 'Tampos', 'Tampo em L', 'top', 'none', 'Composição de tampo com encontros a detalhar.', ['Trecho de tampo', 'Trecho complementar', 'Arremate']),
  entry('tampo-suspenso', 'tampo', 'Bancadas', 'Bancada suspensa', 'top', 'none', 'Superfície com sistema de apoio e fixação a validar.', ['Tampo', 'Travessa de apoio', 'Arremate']),
  entry('tampo-ilha', 'tampo', 'Bancadas', 'Tampo de ilha', 'top', 'none', 'Superfície para ilha com composição a definir.', ['Tampo', 'Saia de acabamento', 'Arremate']),
  entry('tampo-engrossamento', 'tampo', 'Complementos', 'Moldura de engrossamento', 'top', 'moldura', 'Complemento de tampo com composição e encontros a definir.', ['Faixa de engrossamento', 'Arremate']),

  entry('peca-lateral', 'peca', 'Peças da caixa', 'Lateral', 'piece', 'none', 'Peça lateral avulsa; uso e orientação a definir.', ['Lateral']),
  entry('peca-base', 'peca', 'Peças da caixa', 'Base', 'piece', 'none', 'Peça de base avulsa para cadastro e conferência.', ['Base']),
  entry('peca-prateleira', 'peca', 'Peças internas', 'Prateleira', 'piece', 'none', 'Prateleira avulsa com apoios e orientação a definir.', ['Prateleira']),
  entry('peca-frente', 'peca', 'Frentes e fechamentos', 'Frente', 'piece', 'none', 'Frente avulsa com aplicação e acabamento a definir.', ['Frente']),
  entry('peca-fundo', 'peca', 'Frentes e fechamentos', 'Fundo', 'piece', 'none', 'Peça de fundo avulsa; montagem a definir.', ['Fundo']),
  entry('peca-divisoria', 'peca', 'Peças internas', 'Divisória', 'piece', 'none', 'Divisória avulsa com posição e montagem a definir.', ['Divisória']),
  entry('peca-travessa', 'peca', 'Peças da caixa', 'Travessa', 'piece', 'none', 'Travessa avulsa com função e posição a validar.', ['Travessa']),
];

export const PRODUCTION_STEPS = [
  { id: 'medicao', title: 'Validar medição', description: 'Conferir o ambiente, os pontos de instalação e as medidas registradas.' },
  { id: 'projeto', title: 'Conferir projeto', description: 'Confirmar a composição do módulo, os encontros e os requisitos do uso previsto.' },
  { id: 'pecas', title: 'Revisar peças', description: 'Conferir identificação, quantidades, medidas, material, sentido e acabamento de cada peça.' },
  { id: 'corte', title: 'Preparar corte', description: 'Usar somente medidas de corte validadas e conferir a orientação indicada para cada peça.' },
  { id: 'bordas', title: 'Aplicar bordas', description: 'Conferir os lados L1 a L4 na face A e aplicar o acabamento aprovado para cada lado.' },
  { id: 'furacao', title: 'Conferir furação', description: 'Validar o detalhamento e a compatibilidade das peças antes de executar a furação.' },
  { id: 'montagem', title: 'Montar módulo', description: 'Seguir o método aprovado e conferir os encontros, o alinhamento e o funcionamento.' },
  { id: 'instalacao', title: 'Instalar no ambiente', description: 'Validar os apoios e as fixações previstos, conferir o posicionamento e realizar os ajustes aprovados.' },
  { id: 'conferencia', title: 'Fazer conferência final', description: 'Revisar acabamento, funcionamento, limpeza e conformidade com o projeto aprovado.' },
];

export const METHOD_CATALOG = [
  {
    id: 'metodo-caixa-inferior', title: 'Caixa inferior', category: 'Caixas',
    description: 'Sugestão de sequência para caixas inferiores, a validar pela empresa.',
    steps: 'Conferir as peças e o projeto aprovado.\nApresentar as peças para verificar posição e sentido.\nMontar os encontros conforme o detalhamento validado.\nConferir alinhamento e preparar a instalação prevista.',
    checks: 'Peças identificadas; encontros e alinhamento conferidos; apoios e instalação aprovados.', notes: '',
  },
  {
    id: 'metodo-caixa-superior', title: 'Caixa superior', category: 'Caixas',
    description: 'Sugestão para montagem de superiores; instalação deve ser validada no projeto.',
    steps: 'Conferir peças, frentes e projeto aprovado.\nMontar a caixa conforme o detalhamento validado.\nConferir alinhamento e posição das divisões.\nValidar os apoios e as fixações antes da instalação.',
    checks: 'Composição aprovada; caixa alinhada; apoios e fixações definidos para o local.', notes: '',
  },
  {
    id: 'metodo-armario-alto', title: 'Armário alto ou torre', category: 'Caixas',
    description: 'Sugestão para armários altos com composição e estabilidade a validar.',
    steps: 'Revisar o projeto e a organização interna.\nConferir laterais, divisórias, bases e frentes.\nMontar conforme o detalhamento aprovado.\nConferir alinhamento, estabilidade e instalação prevista.',
    checks: 'Divisões e vãos conferidos; estabilidade e instalação validadas; funcionamento revisado.', notes: '',
  },
  {
    id: 'metodo-gavetas', title: 'Gavetas e gaveteiros', category: 'Frentes e gavetas',
    description: 'Sugestão para gavetas; medidas, folgas e componentes dependem do padrão aprovado.',
    steps: 'Conferir as peças da caixa, das gavetas e das frentes.\nValidar as medidas e os componentes previstos no projeto.\nMontar e posicionar conforme o detalhamento aprovado.\nConferir alinhamento e funcionamento em todo o percurso.',
    checks: 'Composição e componentes aprovados; frentes alinhadas; abertura e fechamento conferidos.', notes: '',
  },
  {
    id: 'metodo-frentes', title: 'Frentes e portas', category: 'Frentes e gavetas',
    description: 'Sugestão para revisão e montagem de frentes, sem definir ferragens ou folgas.',
    steps: 'Conferir identificação, material, sentido e acabamento.\nValidar posição, detalhamento e componentes previstos.\nMontar e ajustar conforme o projeto aprovado.\nConferir os encontros e o funcionamento.',
    checks: 'Sentido e acabamento conferidos; posição aprovada; encontros e funcionamento revisados.', notes: '',
  },
  {
    id: 'metodo-paineis', title: 'Painéis e revestimentos', category: 'Painéis e tampos',
    description: 'Sugestão para painéis; composição, encontros e fixação precisam de validação.',
    steps: 'Conferir a medição do local e o projeto aprovado.\nRevisar modulação, sentido do material e acabamento.\nApresentar os painéis para conferir os encontros.\nInstalar com os apoios e as fixações aprovados e revisar o acabamento.',
    checks: 'Medição e modulação conferidas; encontros revisados; apoio e fixação validados.', notes: '',
  },
  {
    id: 'metodo-tampos', title: 'Tampos e bancadas', category: 'Painéis e tampos',
    description: 'Sugestão para superfícies e complementos, com medidas e apoios a validar.',
    steps: 'Conferir o projeto, os apoios e as medidas do local.\nValidar encontros, recortes e composição previstos.\nMontar ou posicionar conforme o detalhamento aprovado.\nConferir apoio, alinhamento e acabamento.',
    checks: 'Medidas e recortes aprovados; apoios validados; encontros e acabamento conferidos.', notes: '',
  },
  {
    id: 'metodo-pecas-avulsas', title: 'Peças individuais', category: 'Peças avulsas',
    description: 'Sugestão para registrar, produzir e conferir uma peça avulsa.',
    steps: 'Identificar a peça e sua aplicação no projeto.\nConferir medidas, material, sentido, corte e bordas.\nExecutar somente as operações já detalhadas e aprovadas.\nConferir a peça e registrar a aprovação ou a necessidade de ajuste.',
    checks: 'Aplicação identificada; dados de produção aprovados; peça e acabamento conferidos.', notes: '',
  },
];

function createBlankEdge() {
  return { mode: 'pending', material: '', thickness: null, width: null };
}

export function createBlankPiece(name = 'Nova peça', id = `peca-${globalThis.crypto.randomUUID()}`) {
  return {
    id, name, quantity: null, width: null, height: null, thickness: null,
    material: '', grain: 'pending', cutMode: 'pending', cutWidth: null, cutHeight: null, notes: '',
    edges: Object.fromEntries(EDGE_SIDES.map(side => [side.id, createBlankEdge()])),
  };
}

export function createInitialModules() {
  return MODULE_CATALOG.map(item => ({
    id: item.id, environmentId: item.environmentId, subgroup: item.subgroup,
    title: item.title, kind: item.kind, family: item.family, status: 'draft',
    width: null, height: null, depth: null, thickness: null,
    material: '', finish: '', hardware: '', methodId: '', assembly: '', quality: '', notes: '',
    pieces: item.pieceNames.map((name, index) => createBlankPiece(name, `${item.id}-p${String(index + 1).padStart(2, '0')}`)),
  }));
}

export function createInitialMethods() {
  return METHOD_CATALOG.map(item => ({ ...item, status: 'draft' }));
}
