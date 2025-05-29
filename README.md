# RPG Sound Mixer

## Visão Geral

O RPG Sound Mixer é uma aplicação web projetada para fornecer uma interface intuitiva para mixagem de sons ambientes, ideal para sessões de Role-Playing Games (RPG). Desenvolvido utilizando HTML, CSS e JavaScript puro, o projeto também incorpora Capacitor, permitindo a sua potencial conversão para aplicações mobile nativas.

## Funcionalidades Implementadas

*   **Interface Drag and Drop:** Permite a organização interativa de tiles de som na grade principal.
*   **Controle de Volume Individual:** Cada tile de som possui um slider de volume dedicado.
*   **Adição Dinâmica de Sons:** Um menu overlay possibilita a adição de novos sons à grade a partir de uma lista pré-definida.
*   **Gerenciamento de Cenas:**
    *   **Salvar Cenas:** Usuários podem salvar a configuração atual dos sons (incluindo volumes e estado de reprodução) como uma "cena" nomeada. As cenas são persistidas no Local Storage do navegador.
    *   **Carregar Cenas:** Cenas salvas podem ser selecionadas e carregadas, restaurando a configuração dos sons na grade.
*   **Overlay de Login:** Interface para login/criação de conta (a lógica de autenticação backend não está implementada).
*   **Exclusão de Tiles:** Tiles de som podem ser removidos da grade ao serem arrastados para fora da área de slots designada, com uma animação de feedback.
*   **Feedback Visual:**
    *   Tiles de som mudam de aparência para indicar o estado de reprodução (play/pause).
    *   Slots vazios exibem um ícone indicativo para adição de novos sons e destacam-se ao passar o mouse.

## Pré-requisitos Técnicos

*   **Node.js e npm:** Essencial para o gerenciamento de dependências e para executar o servidor de desenvolvimento local. Recomenda-se a versão LTS mais recente do [Node.js](https://nodejs.org/).
*   **(Opcional) Ambiente Capacitor:** Para explorar as funcionalidades de build para plataformas mobile (Android/iOS), será necessário configurar o ambiente de desenvolvimento do Capacitor conforme a [documentação oficial](https://capacitorjs.com/docs/getting-started/environment-setup).

## Instalação e Execução

1.  **Obtenção do Código-Fonte:**
    *   Clone o repositório (após configuração no GitHub):
        ```bash
        # git clone https://github.com/SEU_USUARIO/rpg-sound-mixer.git
        # cd rpg-sound-mixer
        ```
    *   Alternativamente, realize o download dos arquivos do projeto e extraia-os para um diretório local.

2.  **Instalação de Dependências:**
    Navegue até o diretório raiz do projeto via terminal e execute:
    ```bash
    npm install
    ```
    Este comando instalará as dependências listadas no arquivo [`package.json`](package.json) (primariamente `http-server` para desenvolvimento).

3.  **Execução da Aplicação:**
    Para iniciar o servidor de desenvolvimento local, utilize o comando:
    ```bash
    npm start
    ```
    Este script, definido no [`package.json`](package.json:7), executa `http-server -c-1`, servindo os arquivos da raiz do projeto e desabilitando o cache para facilitar o desenvolvimento.

4.  **Acesso via Navegador:**
    O terminal indicará o endereço para acesso (usualmente `http://localhost:8080`). Abra este URL em um navegador web compatível. A aplicação é servida a partir do arquivo [`index.html`](index.html).

## Estrutura do Projeto

*   `index.html`: Ponto de entrada principal da aplicação web.
*   `style.css`: Folha de estilos global.
*   `script.js`: Contém toda a lógica de frontend e interações.
*   `sounds/`: Diretório destinado aos arquivos de áudio (`.mp3`, etc.) para a versão servida via `http-server`. **Nota:** Os arquivos de áudio referenciados no código (ex: `rain.mp3`) devem ser populados neste diretório.
*   `www/`: Diretório configurado como `webDir` no [`capacitor.config.json`](capacitor.config.json), contendo os assets para builds do Capacitor.
    *   `www/sounds/`: Destinado aos arquivos de áudio para builds do Capacitor.
*   `package.json`: Manifest do projeto Node.js, com scripts e dependências.
*   `capacitor.config.json`: Arquivo de configuração do Capacitor.
*   `android/`: Diretório do projeto Android gerado pelo Capacitor.

## Considerações e Próximos Passos

*   **Arquivos de Áudio:** É necessário adicionar os arquivos `.mp3` correspondentes aos sons definidos (e.g., `rain.mp3`, `wind.mp3`) nos diretórios `sounds/` e `www/sounds/` para a funcionalidade de reprodução de áudio.
*   **Autenticação:** A funcionalidade de login é apenas um protótipo de interface; a lógica de backend para autenticação e gerenciamento de usuários não está implementada.
*   **Versionamento:** Recomenda-se a configuração de um sistema de controle de versão (Git) e hospedagem em plataformas como GitHub para colaboração e histórico do projeto.