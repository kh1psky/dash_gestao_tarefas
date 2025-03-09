# Dashboard de Gestão de Tarefas

Um sistema completo de gerenciamento de tarefas com frontend moderno, backend RESTful e containerização Docker.

## Estrutura do Projeto

- **frontend**: Aplicação React com interface responsiva
- **backend**: API RESTful em Node.js/Express com MongoDB
- **docker**: Arquivos de configuração para containerização

## Funcionalidades

### Frontend
- Interface moderna e responsiva com menu lateral
- Cards de estatísticas (tarefas totais, concluídas, pendentes, membros)
- Seções de tarefas pendentes e concluídas
- Tarefas com prioridades destacadas por cores
- Modal para adicionar novas tarefas
- Gráficos de progresso

### Backend
- API RESTful completa (CRUD de tarefas)
- Autenticação JWT
- Banco de dados MongoDB
- Filtros de tarefas por status, data e prioridade
- Endpoints para estatísticas
- Sistema de notificações

### Docker
- Containers separados para frontend, backend e banco de dados
- Orquestração via Docker Compose
- Volumes para persistência
- Rede dedicada para comunicação entre serviços

## Como Executar

```bash
# Clonar o repositório
git clone [url-do-repositorio]

# Navegar até a pasta do projeto
cd dash_gestao_tarefas

# Iniciar com Docker Compose
docker-compose up
```

Acesse o dashboard em: http://localhost:3000