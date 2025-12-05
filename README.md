# Personal Budget Manager

Sistema de gerenciamento de orçamento pessoal usando o método de envelopes (envelope budgeting).

## 📋 Descrição

Este projeto implementa uma API RESTful e interface web para gerenciar orçamentos pessoais usando o método de envelopes, onde você divide seu dinheiro em diferentes categorias (envelopes) para melhor controle financeiro.

## 🚀 Funcionalidades

### API Endpoints

#### Envelopes
- `GET /envelopes` - Lista todos os envelopes e orçamento total
- `GET /envelopes/:id` - Busca um envelope específico
- `POST /envelopes` - Cria um novo envelope
- `PUT /envelopes/:id` - Atualiza título e/ou orçamento de um envelope
- `DELETE /envelopes/:id` - Remove um envelope

#### Operações
- `POST /envelopes/:id/subtract` - Subtrai valor de um envelope (gastos)
- `POST /envelopes/transfer/:from/:to` - Transfere dinheiro entre envelopes
- `POST /envelopes/distribute` - Distribui um valor entre múltiplos envelopes por porcentagem

### Interface Web
- Visualização de todos os envelopes e orçamento total
- Criação de novos envelopes
- Atualização de orçamentos
- Subtração de valores (registrar gastos)
- Transferência entre envelopes
- Distribuição proporcional de valores
- Design responsivo e moderno

## 🛠️ Tecnologias

- **Backend**: Node.js + Express
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Armazenamento**: Em memória (variáveis)

## 📦 Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd personal-budget
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor:
```bash
node server.js
```

4. Acesse no navegador:
```
http://localhost:3000
```

## 📁 Estrutura do Projeto

```
personal-budget/
├── server.js           # Servidor Express e API
├── public/
│   ├── index.html     # Interface web
│   ├── app.js         # Lógica do frontend
│   └── style.css      # Estilos
├── package.json
└── README.md
```

## 🔧 Estrutura do Código

### Backend (server.js)

O código está organizado em seções claras:

1. **Middleware Configuration** - Configuração de CORS e parsers
2. **Data Storage** - Armazenamento em memória
3. **Helper Functions** - Funções auxiliares reutilizáveis
4. **Routes** - Endpoints organizados por funcionalidade:
   - Envelope Retrieval
   - Envelope Creation
   - Envelope Updates
   - Envelope Deletion
   - Envelope Transfers

### Frontend (app.js)

Organizado em módulos funcionais:

1. **Configuration** - Configurações da aplicação
2. **API Calls** - Funções para comunicação com a API
3. **UI Rendering** - Funções de renderização
4. **User Actions** - Handlers de eventos do usuário
5. **Utility Functions** - Funções auxiliares

## 📝 Exemplos de Uso

### Criar um Envelope

```bash
curl -X POST http://localhost:3000/envelopes \
  -H "Content-Type: application/json" \
  -d '{"title": "Groceries", "budget": 500}'
```

### Transferir entre Envelopes

```bash
curl -X POST http://localhost:3000/envelopes/transfer/1/2 \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'
```

### Distribuir Valor

```bash
curl -X POST http://localhost:3000/envelopes/distribute \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "distributions": [
      {"id": 1, "percentage": 50},
      {"id": 2, "percentage": 30},
      {"id": 3, "percentage": 20}
    ]
  }'
```

## 🔒 Validações

O sistema inclui validações completas:

- Valores numéricos positivos
- IDs válidos
- Fundos suficientes para transferências
- Porcentagens somando 100% na distribuição
- Prevenção de XSS na interface

## 🎨 Design

- Interface moderna com gradientes
- Cards interativos com hover effects
- Design responsivo para mobile
- Feedback visual para ações do usuário
- Acessibilidade com ARIA labels

## 🚧 Melhorias Futuras

- [ ] Persistência de dados (banco de dados)
- [ ] Autenticação de usuários
- [ ] Histórico de transações
- [ ] Gráficos e relatórios
- [ ] Exportação de dados
- [ ] Categorias de envelopes
- [ ] Metas de economia
- [ ] Notificações de orçamento

## 📄 Licença

ISC

## 👤 Autor

Desenvolvido como projeto de estudo do CodeCademy
