TRÊS LAÇOS STORE

Sistema de E-commerce de Moda Feminina

Projeto desenvolvido como trabalho acadêmico para a disciplina de Desenvolvimento Web (Engenharia de Software). O objetivo é criar uma aplicação Full Stack que integra uma vitrine de produtos (Frontend) com um painel administrativo (Backend) para gestão de conteúdo, demonstrando a comunicação Cliente-Servidor.

🛠️ Tecnologias Utilizadas

Node.js & Express (Framework Backend)

SQLite (Banco de Dados Local - Arquivo)

HTML5 (Semântico) & CSS3 (Interface e Estilização Responsiva)

JavaScript ES6+ (Lógica do Cliente e Servidor com Async/Await)

Multer & Sharp (Upload, processamento e redimensionamento de imagens)

Bcrypt (Segurança e Criptografia de senhas)

📂 Estrutura do Projeto

loja.html – Página pública (Vitrine) onde os clientes visualizam os produtos.

admin.html – Painel administrativo para cadastro, edição e exclusão de produtos.

login.html – Página de autenticação para acesso restrito.

criar-conta.html – Página para registro de novos administradores.

server.js – Código do servidor (API, conexão com banco SQLite e rotas).

script.js – Lógica de integração (Fetch API) entre o Frontend e o Backend.

db.sqlite – Arquivo do banco de dados (gerado automaticamente na primeira execução).

uploads/ – Pasta onde as imagens dos produtos são armazenadas.

🚀 Funcionalidades

Vitrine Dinâmica: Os produtos cadastrados no banco aparecem automaticamente na loja.

Painel Admin (CRUD): Funcionalidade completa de Criar, Ler, Atualizar e Deletar produtos.

Upload de Imagens: Envio de fotos com redimensionamento automático para otimização.

Autenticação: Sistema de login e registro com senha criptografada (Hash).

Cálculo Automático: Parcelamento e precificação exibidos na vitrine.

Responsividade: Layout adaptável para dispositivos móveis e desktop.

👩‍💻 Equipe

[Nome do Aluno 1] – [Ex: Backend e Banco de Dados]

[Nome do Aluno 2] – [Ex: Frontend e Design]

[Nome do Aluno 3] – [Ex: Integração e Documentação]

📖 Como Executar

Siga este passo a passo para rodar o projeto na sua máquina local. Diferente de sites apenas HTML, este projeto requer o Node.js instalado.

1️⃣ Escolher a Pasta onde Salvar

No terminal, navegue até a pasta onde deseja baixar o projeto:

cd C:\Users\SeuUsuario\Documents\Projetos


2️⃣ Clonar o Repositório (ou Baixar)

Se estiver usando Git:

git clone [https://github.com/SeuUsuario/tres-lacos.git](https://github.com/SeuUsuario/tres-lacos.git)


Ou apenas extraia a pasta .zip se tiver baixado manualmente.

3️⃣ Entrar na Pasta do Projeto

cd tres-lacos


4️⃣ Instalar as Dependências (IMPORTANTE)

Como é um projeto Node.js, precisamos baixar as bibliotecas (Express, SQLite, etc.) listadas no package.json. Execute:

npm install


Isso criará a pasta node_modules automaticamente.

5️⃣ Iniciar o Servidor

Agora vamos colocar o Backend para rodar:

npm start


Você verá a mensagem no terminal: "Servidor rodando na porta 3000".

6️⃣ Acessar no Navegador

Com o terminal aberto e o servidor rodando, acesse os links:

Vitrine (Loja): http://localhost:3000/loja.html

Painel Admin: http://localhost:3000/admin.html

📝 Observações Importantes

Banco de Dados: O arquivo db.sqlite será criado automaticamente na primeira vez que o servidor rodar.

Primeiro Acesso: Para acessar o admin, crie primeiro uma conta em /criar-conta.html.

Imagens: As fotos enviadas ficam salvas localmente na pasta uploads dentro do projeto.

Univille - Engenharia de Software - 2025
