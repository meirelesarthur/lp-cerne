# Arquivos pesados no Cloudflare R2 (2026-10-16)

- **Bucket:** `lp-cerne-assets` (conta do Arthur, classe Standard, ENAM). URL pública de desenvolvimento: `https://pub-c156089fe622434b9b529ed137da360e.r2.dev`. CORS: GET/HEAD de qualquer origem, com `Range`. Objetos enviados com `Cache-Control: public, max-age=31536000, immutable`.
- **O que está lá:** `public/{frames,video,app,screens,mocks}` (1.221 arquivos, ~72 MB), mesmas chaves de caminho (`/frames/hero/desktop-hd/001.avif` etc.).
- **Código:** `src/lib/assets.ts` (`asset(path)`) prefixa os caminhos com `VITE_ASSET_BASE`. Usado no Hero, nas seções, nos manifestos (normalizados em `Hero.tsx`), no fundo da seção Sistema (variáveis CSS) e nos preloads do `index.html` (`%VITE_ASSET_BASE%`, resolvido em `vite.config.ts`).
- **Ambientes:** `.env.production` e `.env.development` apontam para o R2 (versionados; a URL não é segredo). Para testar arquivos locais: crie `.env.local` com `VITE_ASSET_BASE=` (vazio).
- **Build:** com a base definida, `dist/` não leva a cópia de `public/` (977 KB). As pastas pesadas saíram do git e estão no `.gitignore` (continuam no disco para regerar e reenviar).
- **Reenviar:** `cd public && bash ../workbench/tools/r2-upload.sh` (precisa de `npx wrangler login`). Sempre que regerar frames, reenviar.
- **Verificação:** build de produção servido localmente: 170 requisições (desktop) e 164 (celular) ao R2, nenhuma falha, nenhuma local, sem erro de CORS.
- **Atenção:** a URL `r2.dev` é de desenvolvimento (limite de taxa, sem cache da Cloudflare). Para produção, ligar um domínio próprio ao bucket (a conta ainda não tem domínio) e trocar `VITE_ASSET_BASE`.
