# Script para Criação de Conta Administradora

Este script cria uma conta de administrador no sistema de gestão de tarefas.

## Detalhes da Conta

- **Email**: admin@admin.com
- **Senha**: admin123
- **Função**: Administrador

## Como Executar

Para executar o script e criar a conta de administrador, siga os passos abaixo:

### Método 1: Localmente

```bash
# Navegue até a pasta do backend
cd backend

# Execute o script
node scripts/createAdmin.js
```

### Método 2: Via Docker

Se você estiver usando Docker, pode executar o script dentro do container do backend:

```bash
# Execute o comando no container do backend
docker exec dash_gestao_tarefas-backend-1 node scripts/createAdmin.js
```

## Observações

- O script verifica se já existe um administrador com o mesmo email antes de criar um novo
- A senha é automaticamente criptografada antes de ser armazenada no banco de dados
- Após a execução bem-sucedida, você poderá fazer login com as credenciais acima