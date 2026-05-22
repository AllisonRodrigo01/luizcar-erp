<<<<<<< HEAD
# LuizCar - Sistema ERP para Oficinas Mecânicas

Sistema web desenvolvido para a **Rede Lopes** - oficina do Luiz.

## Tecnologias

- React + Vite
- Netlify Functions (serverless)
- Turso (SQLite na nuvem)

## Deploy na Netlify

1. Crie um repositório no GitHub
2. Envie este código para lá
3. Na Netlify, clique em "Add new site" → "Import an existing project"
4. Escolha o repositório GitHub
5. Configure:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Adicione as variáveis de ambiente:
   - `TURSO_URL` = URL do seu banco Turso
   - `TURSO_AUTH_TOKEN` = Token do Turso
7. Deploy!

## Login padrão

- **Usuário:** admin
- **Senha:** 1234

## Estrutura

- `src/` - Código fonte React
- `netlify/functions/` - API serverless
- `dist/` - Build de produção (gerado automaticamente)
=======
# luizcar-erp
>>>>>>> a96b21c74f9588bcf9035da9da76eae094a565b5
