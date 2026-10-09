# Configurador de Dimensões Steffens Móveis

**Padrão Produtivo — biblioteca de ambientes, módulos e fabricação**

Sistema visual de consulta pública dos padrões adotados pela empresa, com edição protegida por um usuário e uma senha fixos definidos pelo responsável. A biblioteca organiza ambientes, grupos, módulos, peças, bordas, ferragens e métodos produtivos. As medidas principais, inclusive espessuras e folgas, usam **centímetros**. Cotas adicionais das fichas técnicas conservam a unidade escolhida no cadastro (mm, cm, graus ou kg); os campos de ângulo e peso identificam sua unidade.

A publicação foi preparada para **Render Free + Turso Free**. O GitHub guarda os arquivos do projeto, o Render coloca o site no ar e o Turso mantém a biblioteca salva quando o Render repousa, reinicia ou recebe uma atualização.

Repositório desta publicação: [configuradorsteffens](https://github.com/steffensengenhariad-hash/configuradorsteffens). O serviço já criado como Docker pode receber esta atualização usando **Manual Deploy > Deploy latest commit**. O projeto inclui o Dockerfile na raiz. Mantenha o token do Turso e o usuário e senha de edição no painel do Render. O Blueprint continua disponível para uma instalação nova.

**A conexão com o Turso real e o resultado no endereço público do Render ainda precisam ser conferidos.** Os testes desta versão usam bases isoladas; nenhuma medida de produção foi alterada durante a verificação.

## O que está pronto

- 12 ambientes: cozinha, banheiro, dormitório, área gourmet, sala de estar, mezanino, despensa, suíte, hall de entrada, revestimentos, tampos engrossados e peças individuais.
- 74 módulos organizados por grupos e subgrupos. Suítes reúnem dormitório, banheiro e closet.
- Busca por ambiente, grupo, módulo e nome de peça; cadastro e remoção de módulos personalizados.
- Abas individuais: visão geral, medidas, peças, bordas, ferragens, montagem e conferência.
- Cadastro de peças com quantidade, medidas acabadas, espessura, material, veio e critério de corte.
- Desenho interativo da face A com as quatro bordas, material, espessura e largura da fita de cada lado.
- 8 métodos sugeridos em rascunho, cadastro de novos métodos e guia de 9 etapas produtivas.
- Situações pendente, em conferência e aprovado; aprovação bloqueada quando faltam os dados obrigatórios.
- Ilustrações esquemáticas por tipo: balcão, armário, superior, gaveteiro, painel, tampo e peça individual.
- Dimensões externas e espessura cadastradas diretamente em cada módulo.
- Consulta de folgas por aplicação; cadastro, edição e remoção para o responsável.
- Login, sessão de até 8 horas, botão de saída e proteção das alterações no servidor.
- Salvamento compartilhado, com revisão para detectar conflitos entre sessões.
- Histórico de revisões salvo junto com a alteração do padrão.
- Exportação do padrão e importação para conferir antes de salvar.
- Interface adaptada para computador e celular.
- Arquivo `render.yaml` configurado com o plano `free` e banco externo Turso.

A lista de folgas começa vazia. Os módulos, composições de peças e métodos são modelos para preenchimento; começam **pendentes**, com quantidades e medidas vazias. Esses modelos não equivalem aos padrões aprovados da Steffens Móveis. As dimensões são definidas no cadastro individual de cada módulo. As ilustrações são esquemáticas, sem escala. O ambiente Mezanino organiza mobiliário; não define a estrutura do piso.

## Consultar e definir o padrão

1. Abra **Ambientes e módulos**, escolha um ambiente e depois o grupo e o módulo. Use a busca para localizar diretamente um módulo ou uma peça.
2. Consulte as sete abas do módulo. Campos vazios representam dados pendentes. Para cadastrar padrões reais, entre em **Editar padrões** com o acesso definido pela empresa.
3. Em **Medidas**, informe largura, altura, profundidade e espessura específicas do módulo. As medidas de um módulo não preenchem outros cadastros automaticamente.
4. Em **Peças**, confira a composição sugerida, remova o que não se aplica e adicione as peças reais. Defina quantidades, medidas acabadas, espessuras, materiais e orientação do veio.
5. Em **Bordas**, selecione cada peça e identifique seus lados. A numeração da face A é fixa: **L1 superior, L2 direita, L3 inferior e L4 esquerda**. Alterar o veio não muda a numeração. Cada lado pode estar a definir, sem fita ou com fita.
6. Em **Métodos produtivos**, revise a sequência sugerida ou cadastre o método usado pela empresa. Preencha etapas e conferências antes de aprová-lo. Em **Montagem** do módulo, vincule esse método e descreva a montagem específica.
7. Preencha ferragens e critérios de conferência. Use “Não se aplica” quando adequado. Confira o resumo da aba **Conferência**, escolha a situação e use **Salvar padrão** para disponibilizar a alteração à equipe.

Um módulo aprovado precisa das medidas obrigatórias e material, peças completas, bordas definidas, método aprovado vinculado, ferragens e instruções de montagem/conferência. Nas peças com fita, a largura da fita deve cobrir a espessura do painel. A liberação do conteúdo é uma decisão do responsável; o sistema verifica preenchimento e consistência, sem substituir a revisão do projeto pela empresa.

### Medida acabada e medida de corte

Escolha o critério por peça:

- **Corte igual à medida acabada:** mantém largura e altura cadastradas.
- **Descontar espessura das bordas:** largura de corte = largura acabada − espessura de L2 − espessura de L4; altura de corte = altura acabada − espessura de L1 − espessura de L3. Lado sem fita desconta zero; lado pendente impede o cálculo. O resultado precisa ser positivo.
- **Medida de corte informada:** usa as duas medidas de corte preenchidas pelo responsável.
- **A definir:** mantém o corte pendente.

A largura da fita não entra nesse desconto. O sistema não aplica automaticamente serra, sobremedida ou folgas. Quando o processo exigir outros descontos, registre o critério e informe o corte manual. Exemplo de unidade: painel de 18 mm = **1,8 cm**; fita de 1 mm = **0,1 cm**. As medidas acabadas são preservadas no cadastro.

## Publicar gratuitamente

### Ferragens, portas e documentos

A aba **Ferragens usadas** organiza dobradiças, sistemas de correr, corrediças, puxadores, articuladores e outras ferragens. Cadastre o nome, marca, modelo/código, aplicação e revisão do manual. Cada ficha tem cinco abas:

- **Identificação:** dados do modelo, situação do padrão e módulos vinculados.
- **Portas e folgas:** sistema de porta; recobrimento total, central/parcial ou porta embutida; espessuras, caneco, abertura e cinco folgas. Para correr, sobreposição, portas, trilhos, peso, descontos informados e regra de dimensionamento específica.
- **Cotas técnicas:** descrição da cota, valor, unidade e observação, até 30 cotas por ficha.
- **Instalação:** instruções e conferências do processo.
- **Anexos:** PDF, PNG, JPEG e WebP para consultar, abrir e baixar, até 5 MiB por arquivo e 10 anexos por ficha.

Os desenhos seguem o visual Steffens e identificam R (recobrimento), F (folga) e S (sobreposição). São esquemas sem escala. A imagem enviada pelo usuário foi usada como referência de apresentação; suas cotas não foram copiadas como padrões de fabricação. Não há fórmula universal de corte de portas de correr: registre a regra do fabricante e revise o dimensionamento para o modelo usado.

Em cada módulo, abra **Ferragens**, marque as fichas usadas e descreva as quantidades e particularidades de instalação. O botão **Consultar ferragem** abre a ficha vinculada. Um módulo aprovado só pode vincular ferragens aprovadas. Remova os vínculos dos módulos antes de excluir uma ferragem.

Para aprovar uma ficha, informe marca, referência, instalação e conferências. Portas de abrir/correr exigem ficha técnica anexada e cinco folgas definidas. Dobradiças exigem sistema de abrir, tipo/medida de recobrimento e espessuras; sistemas de correr exigem sistema correspondente, sobreposição, quantidades de portas/trilhos e regra de corte. Todas as cotas adicionais precisam de valor e unidade. Isso verifica preenchimento; a revisão técnica continua sendo responsabilidade da empresa.

Os anexos são armazenados em uma tabela separada no mesmo Turso, sem depender do disco do Render. O limite interno do acervo é **100 MiB de arquivos originais**. A codificação de armazenamento ocupa cerca de um terço a mais. Remover o vínculo de uma ficha preserva o arquivo para consulta ao histórico. Uploads ainda não vinculados por um salvamento também ocupam esse espaço. O JSON exportado contém os cadastros e as referências; **baixe os PDFs e imagens separadamente** para ter uma cópia completa. Importar referências de arquivos que não existem no banco exige reenviá-los. A migração preserva medidas, biblioteca e vínculos de clientes antigos.

Os testes usam SQLite e um servidor isolado que simula o protocolo Turso. A gravação no Turso real e o acesso pelo Render dependem das credenciais e do endereço público do serviço; essa verificação permanece pendente.

Use um banco Turso, um repositório GitHub e um serviço Render separados para este configurador. O site de orçamentos permanece como está, na mesma conta Render se isso facilitar a administração.

### 1. Criar o banco Turso

1. Abra o [painel Turso](https://app.turso.tech/) e crie uma conta ou entre na sua conta.
2. Confira que a organização está no plano **Free**, que permite começar sem cartão. Os limites vigentes estão na [página de preços Turso](https://turso.tech/pricing).
3. Crie um banco exclusivo. O banco desta publicação já foi criado com o nome `configuradorsteffens` e sua URL foi incluída no `render.yaml`.
4. Copie a URL desse banco para usar depois em `TURSO_DATABASE_URL`.
5. Gere um token do banco com permissão de leitura e escrita, para usar em `TURSO_AUTH_TOKEN`. Guarde-o em local seguro; ele autoriza acesso ao banco.
6. Não é necessário cadastrar tabelas manualmente: o configurador cria a estrutura e o padrão inicial na primeira inicialização bem-sucedida.

Se o painel não oferecer as opções de criação ou token, o caminho documentado pelo Turso usa sua ferramenta de terminal. No Windows, a instalação oficial usa WSL. Siga a [introdução Turso](https://docs.turso.tech/quickstart), instale a ferramenta e execute:

```sh
turso auth login
turso db create configuradorsteffens
turso db show configuradorsteffens --url
turso db tokens create configuradorsteffens
```

O último comando mostra um segredo: copie o resultado somente para a configuração do Render. O token precisa permitir escrita; não use a opção de somente leitura. Confira a [documentação de criação de tokens](https://docs.turso.tech/cli/db/tokens/create).

### 2. Guardar o projeto no GitHub

1. Entre no [GitHub](https://github.com/) e crie um repositório separado, por exemplo `configurador-steffens`.
2. Escolha **Private** para manter o código privado. Autorize o Render a acessar esse repositório quando solicitado.
3. Envie o conteúdo da pasta deste projeto. `package.json`, `server.mjs`, `storage.mjs` e `render.yaml` devem ficar na raiz; preserve a pasta `public/` com seus arquivos.
4. Inclua `.gitignore` e `.env.example`. Guarde os valores reais das credenciais fora do repositório; não envie `.env`, bancos locais, arquivos de sessão ou tokens.
5. Confirme que os arquivos foram salvos na branch escolhida, normalmente `main`.

A [introdução oficial a repositórios GitHub](https://docs.github.com/en/repositories/creating-and-managing-repositories/quickstart-for-repositories) explica a criação e o envio dos arquivos.

### 3. Criar o serviço no Render

Há duas formas equivalentes. Escolha uma para criar este serviço.

**Pelo Blueprint do projeto:**

1. Entre no [painel Render](https://dashboard.render.com/) usado pela empresa e confira o workspace escolhido.
2. Vá a **New > Blueprint**, conecte o GitHub e selecione o repositório `configurador-steffens`.
3. Selecione a branch dos arquivos. O caminho do Blueprint é `render.yaml` na raiz.
4. Preencha os três campos secretos da tabela abaixo: token do Turso, usuário e senha de edição. A URL do banco já está preenchida.
5. Confira a proposta: um novo Web Service chamado `configurador-dimensoes-steffens`, com plano **Free**.
6. Clique em **Deploy Blueprint** e aguarde a conclusão. [Guia oficial de Blueprints](https://render.com/docs/infrastructure-as-code)

**Pela criação manual de Web Service:**

1. No painel Render, vá a **New > Web Service** e conecte o mesmo repositório.
2. Use o nome `configurador-dimensoes-steffens`, a branch escolhida e a linguagem **Node**.
3. Como os arquivos estão na raiz, deixe **Root Directory** vazio.
4. Use **Build Command:** `npm run build` e **Start Command:** `npm start`.
5. Selecione **Free** em Compute/Instance Type. Configure **Health Check Path:** `/api/health`.
6. Preencha as seis variáveis da tabela abaixo e crie o serviço. [Guia oficial de publicação Render](https://render.com/docs/your-first-deploy)

### 4. Preencher as variáveis do configurador

**Se o serviço já foi criado como Docker:** o projeto inclui `Dockerfile` e `.dockerignore` para usar esse mesmo serviço. Em **Settings**, deixe **Root Directory** vazio, **Dockerfile Path** como `Dockerfile`, **Docker Build Context** como `.` e **Docker Command** vazio para usar o comando definido no arquivo. Mantenha o plano **Free** e o caminho de verificação `/api/health`. O container já define o modo de produção, a versão do Node e a porta de execução. Preencha as quatro variáveis do banco e de edição abaixo em **Environment**: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `ADMIN_USERNAME` e `ADMIN_PASSWORD`. Depois use **Manual Deploy > Deploy latest commit**. [Publicação Docker no Render](https://render.com/docs/docker)

Os nomes abaixo são os mesmos definidos em `render.yaml`. No Blueprint, a versão do Node, o modo de produção e a URL do banco já estão preenchidos; na criação manual, inclua todos.

| Variável | Valor a preencher no Render |
|---|---|
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `24.19.0` |
| `TURSO_DATABASE_URL` | `libsql://configuradorsteffens-steffensengenhariad-hash.aws-ap-northeast-1.turso.io` (já incluída no Blueprint). |
| `TURSO_AUTH_TOKEN` | O token real de leitura e escrita desse banco. |
| `ADMIN_USERNAME` | O usuário de edição escolhido pelo responsável. |
| `ADMIN_PASSWORD` | A senha escolhida pelo responsável, com pelo menos 12 caracteres. |

**Escolha e digite o usuário, a senha e o token nos painéis, sem enviá-los no chat.** Não existe usuário ou senha padrão. Para trocar o acesso, atualize os valores no serviço Render e aplique um novo deploy.

O Render informa o endereço público e a porta de execução automaticamente. Se cadastrar um domínio próprio, adicione a variável opcional `PUBLIC_ORIGIN` com a URL HTTPS completa do domínio.

Em produção, o servidor exige as credenciais Turso. Se o banco estiver indisponível, a consulta ou o salvamento informa o erro; o sistema não substitui os dados por um banco local temporário.

### 5. Conferir a publicação

1. Aguarde o estado **Live** e abra o endereço `.onrender.com` do novo serviço.
2. Confira a biblioteca pública de 12 ambientes, abra um grupo e um módulo e consulte as sete abas, incluindo as medidas individuais do módulo.
3. Entre em **Editar padrões** com o acesso escolhido no painel.
4. Cadastre um módulo de teste ou altere uma medida, clique em **Salvar padrão** e confirme os valores em outro navegador ou dispositivo. Teste uma peça com as quatro bordas e confira a medida de corte.
5. Reinicie apenas o serviço deste configurador no Render e confira que a medida continua salva.
6. Guarde uma exportação do padrão antes de cadastrar os valores definitivos da empresa.

Essa conferência com banco real ainda está pendente. O projeto não foi conectado ao serviço ou ao banco do site de orçamentos.

## Limites da opção gratuita

O Render Free repousa após **15 minutos sem tráfego**; a próxima abertura pode levar cerca de um minuto. São **750 horas gratuitas por mês por workspace**, compartilhadas entre os Web Services Free ativos. Se o site de orçamentos também usar Free nesse workspace, ambos consomem a mesma cota. Quando ela acaba, os serviços Free são suspensos até o mês seguinte.

Banda de saída e minutos de build também têm limites. Com pagamento cadastrado, excedentes podem gerar cobrança; sem pagamento, o Render pode suspender serviços ou impedir novos builds. Confira o uso em **Billing**. [Limites oficiais do Render Free](https://render.com/docs/free)

O Turso Free é gratuito dentro de suas cotas. Confira o plano e mantenha **Overages** desativado se desejar evitar contratação de uso adicional; o Turso informa que excedentes são cobrados quando habilitados. [Preços e uso Turso](https://turso.tech/pricing)

A configuração deste projeto usa os planos gratuitos. **Isso não garante uma fatura total de zero** para uma conta que já tenha serviços pagos, cartão ou cobrança de excedentes habilitada. Revise as configurações atuais das duas contas antes de publicar.

Os valores e limites foram consultados em **09/10/2026** e podem mudar. O Render apresenta Free como opção de teste e projetos menores; a disponibilidade acompanha as limitações desse plano.

## Usar localmente

É necessário Node.js 24.15 ou superior na série 24; esta versão foi verificada com 24.19.0. Não há dependências externas para instalar.

1. Copie `.env.example` para `.env` na pasta do projeto.
2. Defina `ADMIN_USERNAME` e `ADMIN_PASSWORD` se quiser editar localmente. Escolha uma senha com pelo menos 12 caracteres.
3. Para testar localmente sem Turso, mantenha `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` vazios. Nesse modo de desenvolvimento, os dados ficam no arquivo SQLite local.
4. Execute `npm run build` e `npm start`.
5. Abra `http://127.0.0.1:4173`.

Para usar o banco Turso também no teste local, preencha a URL e o token em `.env`; as gravações passarão a alterar esse banco compartilhado. Sem credenciais de edição, a consulta local funciona e o botão de edição fica bloqueado.

## Salvamento, acesso e cópias

Todos consultam os mesmos valores salvos. O responsável edita uma cópia temporária e grava as alterações ao clicar em **Salvar padrão**. A consulta também atualiza a cada 30 segundos enquanto a página está visível.

Se outra sessão salvar primeiro, o configurador detecta a revisão diferente e pede conferência antes da nova tentativa. Se houver erro durante o salvamento, recarregue e confira a revisão atual para verificar o resultado antes de repetir.

A senha é verificada no servidor e fica fora dos arquivos públicos. Em produção, a sessão usa cookie `HttpOnly`, `SameSite=Strict` e `Secure`. Reiniciar ou repousar o serviço encerra as sessões; os padrões continuam guardados no Turso.

Use **Exportar padrão** para guardar uma cópia JSON da biblioteca, das folgas e dos demais dados salvos. Para restaurar, entre como responsável, use **Importar padrão**, confira os cadastros e salve. Arquivos da primeira versão, que contêm somente dimensões e folgas, são aceitos e preservam a biblioteca existente. Os campos antigos continuam no banco e nas cópias para compatibilidade; a interface utiliza as medidas individuais de cada módulo. A exportação contém somente os dados do padrão, sem senhas ou sessões. Guarde exportações regularmente em local seguro.

A atualização para o esquema 3 acrescenta ferragens, cotas, anexos e vínculos por módulo, preservando bibliotecas, medidas e folgas das versões anteriores. Ao salvar, o conteúdo completo e o histórico são gravados na mesma transação. Limites de cadastro: 120 módulos, 40 peças por módulo, 60 métodos, 100 ferragens e 30 vínculos de ferragens por módulo; arquivo de importação e solicitação de salvamento de até 2 MB.

## Verificação e organização

Passaram 23 verificações da biblioteca em computador e celular, 13 verificações das novas ferragens e anexos, 16 de migração/API, 13 do catálogo/corte e 12 do protocolo remoto simulado. A verificação inclui PDF e imagem enviados pelo site, cadastro/vínculos, folgas e cotas, proteção de edição, preservação dos arquivos após reiniciar e operações remotas com confirmação perdida. Os testes usaram dados separados. **O resultado do deploy e o comportamento com o banco Turso real ainda precisam ser validados.** O build verifica a sintaxe e os arquivos necessários.

- `public/`: interface, estilos, catálogo de ambientes/módulos/métodos e validação dos cadastros.
- `server.mjs`: servidor e autenticação.
- `storage.mjs`: persistência Turso em produção e SQLite no desenvolvimento local.
- `attachments.mjs`: validação dos arquivos e metadados de anexos.
- `build.mjs`: verificação antes da publicação.
- `render.yaml`: serviço Free e variáveis do Render.
- `Dockerfile` e `.dockerignore`: publicação em um serviço Render já configurado como Docker.
- `.env.example`: exemplo de configuração, sem credenciais reais.

As ferramentas opcionais WebMCP dependem de suporte no navegador. Sua validação em navegador compatível continua pendente.

Referências adicionais: [SQL sobre HTTP Turso](https://docs.turso.tech/sdk/http/reference), [versão do Node no Render](https://render.com/docs/node-version), [SQLite nativo do Node](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html).
