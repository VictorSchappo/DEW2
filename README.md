# Loja Três Laços

Bem-vindo ao repositório do projeto **Loja Três Laços**. Esta é uma aplicação web completa de e‑commerce, desenvolvida com foco em design responsivo, funcionalidades administrativas e uma experiência de compra integrada com WhatsApp.

---

## 1. Visão Geral

A Loja Três Laços é uma plataforma fictícia de venda de roupas femininas que oferece:

* **Vitrine elegante**: exibição de produtos com filtros por categoria e faixa de preço.
* **Painel administrativo (Admin)**: sistema para criar, editar e excluir produtos, com upload de imagens e gerenciamento de estoque.
* **Sacola de compras**: carrinho persistente (salvo no navegador via LocalStorage).
* **Finalização via WhatsApp**: integração que envia o pedido formatado para o WhatsApp da loja.
* **Segurança**: autenticação de usuários e proteção de rotas administrativas.

---

## 2. Tecnologias utilizadas

**Front-end**

* HTML5 (semântica)
* CSS3 (Flexbox, Grid, responsividade e animações)
* JavaScript — lógica da vitrine, filtros, carrinho e integração com a API

**Back-end**

* Node.js
* Express
* SQLite (arquivo `db.sqlite`)
* Multer (upload de imagens)
* Sharp (redimensionamento/otimização de imagens)
* Bcrypt (hash de senhas)

Outras dependências: `uuid`, `dotenv`, `cors`.

---

## 3. Estrutura do projeto

```
/tres-lacos-store
├─ backend
│  ├─ .env
│  ├─ db.sqlite
│  ├─ package.json
│  ├─ server.js
├─ frontend
│  ├─ loja.html
│  ├─ admin.html
│  ├─ index.html
│  ├─ vestidos.html
│  ├─ blusas.html
│  ├─ calcas.html
│  ├─ login.html
│  ├─ criar-conta.html
│  ├─ styles.css
│  └─ script.js
├─ /uploads
└─ README.md
```

Principais arquivos:

* `server.js`: servidor e endpoints da API
* `script.js`: lógica do front-end (filtros, carrinho, fetch)
* `styles.css`: estilos globais
* `uploads/`: imagens enviadas pelo admin
* `db.sqlite`: banco de dados SQLite (gerado automaticamente)

---

## 4. Como executar o projeto

### Pré-requisitos

* Node.js (LTS recomendado)
* npm

### Passo a passo

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/tres-lacos-store.git
cd tres-lacos-store
```

2. Instale as dependências:

```bash
npm install
```

3. Crie um arquivo `.env` na raiz (exemplo):

```
PORT=3000
DB_FILE=./db.sqlite
WHATSAPP_NUMBER=5511999999999
JWT_SECRET=sua_chave_secreta
```

4. Inicie o servidor:

```bash
node server.js
```

5. Acesse no navegador:

* Vitrine: `http://localhost:3000/loja.html`
* Admin: `http://localhost:3000/admin.html`

---

## 5. Funcionalidades detalhadas

### Para o cliente

* Navegação por categorias: Vestidos, Blusas, Calças, Saias, Croppeds.
* Filtro por faixa de preço (mínimo/máximo) e filtro automático por categoria.
* Visualização detalhada de produto (imagem ampliada, descrição, cores, estoque).
* Adição ao carrinho com persistência local (LocalStorage).
* Finalização do pedido: montagem de mensagem com itens e total e envio via WhatsApp.

### Para o administrador

* Acesso restrito: o primeiro usuário cadastrado automaticamente recebe permissão de ADMIN; demais usuários são clientes.
* CRUD de produtos (upload, edição, exclusão).
* Upload de imagem com Multer e otimização com Sharp.
* Campos do produto: título, preço, estoque, descrição, categoria e cores.

---

## 6. Segurança

* Senhas armazenadas com `bcrypt`.
* Rotas administrativas protegidas via middleware (verificação de token ou sessão).
* Recomendação: mantenha `JWT_SECRET` e `WHATSAPP_NUMBER` fora do repositório público.

---

## 7. Integração com WhatsApp

Ao finalizar a compra, o front-end monta uma mensagem contendo: nome do cliente (se disponível), itens, quantidades, preços e total. A mensagem é enviada via link:

```
https://api.whatsapp.com/send?phone={WHATSAPP_NUMBER}&text={MENSAGEM_ENCODE}
```

---

## 8. Scripts úteis (package.json)

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

---

## 9. Sugestões de melhorias

* Integração com gateway de pagamentos (PagSeguro, Pagar.me, Stripe).
* Dashboard com métricas (vendas, produtos com estoque baixo).
* Armazenamento de imagens em CDN (S3 / Cloud Storage) para produção.
* Testes automatizados (unitários e de integração).
* Internacionalização (i18n) e melhorias de acessibilidade (WCAG).

---

## 10. Autoria

Desenvolvido por **[VICTOR SCHAPPO, ASAFE IVAN, IGOR GRABOWSKI, HENRIQUE MELO E VINICYUS CESAR]** como parte da disciplina de Desenvolvimento Web.

---

Se quiser, eu gero agora os arquivos básicos (`server.js`, `script.js`, `styles.css` e páginas HTML) prontos para download. É isso que você quer?
