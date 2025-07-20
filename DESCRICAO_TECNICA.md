# Descrição Técnica: RPG Sound Mixer

## 1. Visão Geral da Arquitetura

O RPG Sound Mixer é uma aplicação web full-stack projetada para fornecer uma experiência de áudio imersiva para sessões de RPG. A arquitetura é composta por um front-end interativo, um back-end robusto com uma API RESTful e um banco de dados para persistência de dados.

- **Front-end**: Construído com HTML, CSS e JavaScript puro, o front-end oferece uma interface de usuário dinâmica e responsiva para manipulação de áudio.
- **Back-end**: Desenvolvido em Node.js com o framework Express, o back-end gerencia a lógica de negócios, autenticação de usuários e a comunicação com o banco de dados.
- **Banco de Dados**: Utiliza SQLite3, um banco de dados relacional leve e baseado em arquivo, ideal para aplicações de pequeno a médio porte.

---

## 2. Front-end (`index.html`, `script.js`, `style.css`)

A interface do usuário é a principal forma de interação com o sistema, permitindo a manipulação de elementos de áudio de forma visual e intuitiva.

### Funcionalidades Principais:

- **Mixer de Som Grid-Based**: A interface principal é um grid de "slots" onde os usuários podem arrastar e soltar "tiles" de som. Cada tile representa um som ambiente (chuva, vento, etc.) ou um efeito sonoro.
- **Controle de Volume Individual**: Cada tile de som possui um slider de volume (fader) que permite ao usuário ajustar a intensidade do som em tempo real.
- **Reprodução Simultânea**: Múltiplos tiles de som podem ser ativados simultaneamente, permitindo a criação de paisagens sonoras complexas pela sobreposição de áudios.
- **Sistema de Cenas (Scenes)**:
    - **Salvamento e Carregamento**: Usuários autenticados podem salvar a configuração atual do mixer (quais sons estão em quais slots e seus volumes) como uma "cena". Essas cenas podem ser nomeadas e carregadas posteriormente, permitindo uma rápida transição entre diferentes ambientes sonoros.
    - **Persistência**: As cenas são salvas no banco de dados e associadas ao perfil do usuário.
- **Upload de Sons Personalizados**:
    - Usuários logados podem fazer o upload de seus próprios arquivos de áudio (com limite de tamanho e duração).
    - Os arquivos são armazenados no servidor em um diretório específico para cada usuário.
    - Os metadados do som (nome, ícone, caminho do arquivo) são salvos no banco de dados.
- **Autenticação de Usuário**:
    - Um modal de login/cadastro permite que os usuários criem uma conta ou acessem uma existente.
    - A autenticação é baseada em e-mail e senha.
    - O estado de login é mantido no front-end para controlar o acesso a funcionalidades como salvamento de cenas e upload de sons.
- **Integração com Spotify**:
    - Usuários podem conectar suas contas do Spotify para buscar e reproduzir músicas diretamente na interface do mixer.
    - Utiliza o fluxo de autorização OAuth 2.0 do Spotify.
    - O front-end interage com o Spotify Web Playback SDK para controlar a reprodução.
- **Rolador de Dados**: Um tile especial de "rolador de dados" pode ser adicionado ao grid, permitindo rolar diferentes tipos de dados (d4, d6, d8, d10, d12, d20) com um efeito sonoro.
- **Design Responsivo**: A interface se adapta a diferentes tamanhos de tela, garantindo a usabilidade em dispositivos móveis e desktops.

### Tecnologias e Lógicas:

- **Manipulação do DOM**: O `script.js` manipula intensivamente o DOM para criar, modificar e remover elementos da interface, como os tiles de som e os modais.
- **Event Listeners**: A interatividade é gerenciada por uma vasta gama de `event listeners` para cliques, arrastar e soltar (`drag and drop`), e inputs de formulário.
- **Fetch API**: A comunicação com o back-end é realizada através da `Fetch API` para enviar e receber dados no formato JSON (ex: login, salvar cena, buscar sons).
- **HTML5 Audio API**: A reprodução dos sons é controlada pela API de Áudio do HTML5, que permite carregar, reproduzir, pausar e controlar o volume dos arquivos de áudio.

---

## 3. Back-end (`server.js`)

O servidor Node.js atua como o cérebro da aplicação, orquestrando todas as operações de dados e a lógica de negócios.

### Endpoints da API RESTful:

- **Autenticação**:
    - `POST /api/signup`: Registra um novo usuário, validando os dados e criptografando a senha com `bcrypt`.
    - `POST /api/login`: Autentica um usuário comparando a senha fornecida com o hash armazenado no banco de dados.
- **Cenas (Scenes)**:
    - `POST /api/scenes`: Salva ou atualiza uma cena para um usuário autenticado. A operação é transacional para garantir a integridade dos dados.
    - `GET /api/scenes`: Retorna a lista de cenas salvas por um usuário.
    - `GET /api/scenes/:sceneId`: Retorna os detalhes de uma cena específica, incluindo a configuração dos sons.
- **Sons (Sounds)**:
    - `POST /api/sounds/upload/:userId`: Processa o upload de um novo arquivo de som. Utiliza a biblioteca `multer` para gerenciar o upload de arquivos e `music-metadata` para validar a duração do áudio.
    - `GET /api/sounds`: Retorna a lista de sons disponíveis (padrão e do usuário).
    - `DELETE /api/sounds/:soundId`: Remove um som personalizado do banco de dados e do sistema de arquivos.
- **Spotify**:
    - `GET /callback`: Endpoint de redirecionamento para o fluxo OAuth 2.0 do Spotify. Recebe o código de autorização e o troca por tokens de acesso e de atualização.
    - `GET /api/spotify-token`: Fornece o token de acesso do Spotify para o front-end, atualizando-o automaticamente se estiver expirado.

### Tecnologias e Lógicas:

- **Node.js e Express**: A base do servidor, gerenciando rotas, requisições e respostas HTTP.
- **CORS**: Middleware `cors` para permitir requisições de origens autorizadas (como o cliente local e o ngrok).
- **Bcrypt**: Biblioteca para hashing de senhas, garantindo que as senhas não sejam armazenadas em texto plano.
- **Multer**: Middleware para manipulação de uploads de arquivos (`multipart/form-data`).
- **SQLite3**: Driver para interação com o banco de dados SQLite.

---

## 4. Banco de Dados (`db/database.js`, `sql/schema.sql`)

O banco de dados armazena todas as informações persistentes da aplicação.

### Estrutura do Schema:

- **Tabela `Users`**:
    - `user_id`: Chave primária, autoincremento.
    - `username`, `email`: Identificadores únicos para o usuário.
    - `password_hash`: Armazena a senha criptografada.
    - `spotify_access_token`, `spotify_refresh_token`, `spotify_token_expires_at`: Campos para armazenar as credenciais do Spotify.
- **Tabela `Sounds`**:
    - `sound_id`: Chave primária, autoincremento.
    - `user_id`: Chave estrangeira para a tabela `Users` (pode ser `NULL` para sons padrão).
    - `sound_name`, `file_path`, `icon`: Metadados do som.
- **Tabela `Scenes`**:
    - `scene_id`: Chave primária, autoincremento.
    - `user_id`: Chave estrangeira para a tabela `Users`.
    - `scene_name`: Nome da cena.
    - `total_tiles`: Número de slots no grid no momento do salvamento.
- **Tabela `SceneSounds`**:
    - Tabela de junção que associa sons a cenas.
    - `scene_id`, `sound_name`: Chaves compostas.
    - `volume`, `slot_index`: Armazena o volume e a posição do som na cena.

### Lógica de Inicialização:

- O arquivo `db/database.js` é responsável por inicializar a conexão com o banco de dados.
- Ao iniciar, ele lê o arquivo `sql/schema.sql` e o executa para garantir que todas as tabelas e suas estruturas existam.
- Em seguida, insere os sons padrão na tabela `Sounds` se eles ainda não existirem.
- Exporta funções `Promise`-based (`dbRun`, `dbGet`, `dbAll`) para facilitar a execução de queries assíncronas no `server.js`.