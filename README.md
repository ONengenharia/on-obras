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
