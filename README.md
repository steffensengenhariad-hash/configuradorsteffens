# Configurador de Dimensões Steffens Móveis

**Padrão Produtivo — primeira versão**

Sistema de consulta pública das dimensões e folgas adotadas pela empresa, com edição protegida por um usuário e uma senha fixos definidos pelo responsável. Todas as medidas usam **centímetros**.

A publicação foi preparada para **Render Free + Turso Free**. O GitHub guarda os arquivos do projeto, o Render coloca o site no ar e o Turso mantém as medidas e folgas salvas quando o Render repousa, reinicia ou recebe uma atualização.

Repositório desta publicação: [configuradorsteffens](https://github.com/steffensengenhariad-hash/configuradorsteffens). Depois de enviar os arquivos, use [Abrir publicação no Render](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fsteffensengenhariad-hash%2Fconfiguradorsteffens) para importar o Blueprint. Preencha o token do Turso e o usuário e senha de edição no painel do Render.

**Ainda não há publicação concluída nem conexão validada com um banco Turso real.** Os passos abaixo precisam ser realizados nas contas do responsável e conferidos após o primeiro deploy.

## O que está pronto

- Ilustrações de balcão, armário, superior, gaveteiro e moldura, com cotas A a K clicáveis.
- Lista das 11 medidas da referência e seleção por tipo de módulo.
- Consulta de folgas por aplicação; cadastro, edição e remoção para o responsável.
- Login, sessão de até 8 horas, botão de saída e proteção das alterações no servidor.
- Salvamento compartilhado, com revisão para detectar conflitos entre sessões.
- Histórico de revisões salvo junto com a alteração do padrão.
- Exportação do padrão e importação para conferir antes de salvar.
- Interface adaptada para computador e celular.
- Arquivo `render.yaml` configurado com o plano `free` e banco externo Turso.

As medidas iniciais foram transcritas da imagem fornecida pelo usuário. A lista de folgas começa vazia, para cadastro dos valores reais da empresa. As ilustrações são esquemáticas. Limites, larguras, espessuras e regras de fabricação precisam ser definidos pela empresa antes de incorporados ao sistema.

## Medidas iniciais

| Cota | Aplicação | Valor (cm) |
|---|---|---:|
| A | Balcões — altura | 70 |
| B | Balcões — profundidade | 55 |
| C | Armários — altura | 160 |
| D | Armários — profundidade | 55 |
| E | Superiores — altura | 50 |
| F | Superiores — profundidade | 35 |
| G | Gaveteiros volantes — altura | 66 |
| H | Tampo — avanço | 2 |
| I | Rodapés — recuo | 2 |
| J | Rodapés — altura | 5 |
| K | Moldura de engrossamento — profundidade | 7 |

## Publicar gratuitamente

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
2. Confira a consulta pública das 11 medidas.
3. Entre em **Editar medidas** com o acesso escolhido no painel.
4. Cadastre uma folga de teste ou altere uma medida, clique em **Salvar padrão** e confirme os valores em outro navegador ou dispositivo.
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

É necessário Node.js 24.15 ou superior na série 24; a primeira versão foi verificada com 24.19.0. Não há dependências externas para instalar.

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

Use **Exportar padrão** para guardar uma cópia JSON dos valores salvos. Para restaurar, entre como responsável, use **Importar padrão**, confira as medidas e salve. A exportação contém somente os dados do padrão, sem senhas ou sessões. Guarde exportações regularmente em local seguro: elas ajudam a recuperar os valores se o banco for excluído ou o acesso à conta for perdido.

## Verificação e organização

A primeira versão teve 21 verificações do fluxo local e do visual em computador e celular. A adaptação de persistência remota passou em 10 verificações com um servidor HTTP local que simula o protocolo Turso, usando um banco separado; **o deploy e o comportamento com o banco Turso real ainda precisam ser validados**. O build de publicação verifica a sintaxe e os arquivos necessários.

- `public/`: interface, estilos e modelo de medidas.
- `server.mjs`: servidor e autenticação.
- `storage.mjs`: persistência Turso em produção e SQLite no desenvolvimento local.
- `build.mjs`: verificação antes da publicação.
- `render.yaml`: serviço Free e variáveis do Render.
- `.env.example`: exemplo de configuração, sem credenciais reais.

As ferramentas opcionais WebMCP dependem de suporte no navegador. Sua validação em navegador compatível continua pendente.

Referências adicionais: [SQL sobre HTTP Turso](https://docs.turso.tech/sdk/http/reference), [versão do Node no Render](https://render.com/docs/node-version), [SQLite nativo do Node](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html).
