# ON Obras — gerenciador de obras

Site estático (HTML + JavaScript, sem etapa de build) ligado ao Supabase.

- `index.html` — login, kanban de obras (Compras → Liberado para execução → Em andamento de obra → Finalizado), equipe de cada obra e cadastro de usuários.
- `obra.html?id=<obra>` — painel da obra para administrador e executor (login).
- `obra.html?t=<token>` — painel da obra para o cliente, somente leitura, sem login.
- `portfolio.html` — portfólio digital da ON Engenharia.

## Perfis

| Perfil | Pode fazer |
|---|---|
| Administrador | Tudo: criar/mover/excluir obras, quantitativos, etapas, materiais, arquivos, planta, dados da obra, usuários e equipes |
| Executor | Só nas obras em que está na equipe: lançar/mover pontos, traçar rede, fotos e diário |
| Cliente | Ver a obra pelo link, sem login |

As permissões são garantidas no banco (Row Level Security), não só na tela.

## Supabase

Projeto `on-obras` (região São Paulo). Tabelas: `perfis`, `obras`, `obra_membros`, `pontos`, `redes`, `diario`. Fotos e arquivos no bucket `obras`. Função `usuarios` (Edge Function) para o administrador cadastrar usuários.

O primeiro usuário que se cadastrar em **Primeiro acesso** vira administrador. Depois disso, recomenda-se desligar o cadastro público em
Supabase → Authentication → Sign In / Providers → "Allow new users to sign up", e cadastrar executores pelo botão **Usuários**.

Em Authentication → URL Configuration, coloque o endereço do site da Vercel em **Site URL** (para os e-mails de confirmação e de nova senha voltarem ao site).

## Publicar na Vercel

1. Na Vercel: **Add New → Project → Import** este repositório.
2. Framework Preset: **Other**. Sem comando de build. Output: raiz.
3. Deploy.

## Cópia de segurança

Toda segunda-feira às 06:00 o GitHub Actions (`.github/workflows/backup.yml`) exporta **todo o banco** (obras, postes, rede, diário, mural, usuários, colunas) e **todos os arquivos/fotos** do Supabase, criptografa com uma senha e guarda:

- banco: no ramo `backups`, pasta `banco/` (um arquivo por semana, ~1 ano de histórico);
- fotos e arquivos: em *Actions → execução → Artifacts* (ficam 90 dias).

Configuração (uma vez): em **Settings → Secrets and variables → Actions → New repository secret**, criar:

| Nome | Valor |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys → chave `service_role` (secreta) |
| `BACKUP_SENHA` | uma senha forte só sua, **guarde-a**: sem ela a cópia não abre |

Para rodar na hora: **Actions → Cópia de segurança semanal → Run workflow**.

Para abrir uma cópia (no computador, com OpenSSL):

```
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in banco-AAAA-MM-DD.json.enc -out banco.json
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in arquivos-AAAA-MM-DD.tar.gz.enc | tar -xz
```
