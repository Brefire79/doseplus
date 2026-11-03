# PROMPT — doseplus v2.6.1 · versão visível, atualização forçada e assets do navegador

> **Status: ✅ executado** e publicado em doseplus.netlify.app em 03/11/2026 (commit `53968e1`). Extra além deste prompt: círculo vermelho de marcador no símbolo do cabeçalho. Mantido como registro.

Pasta do projeto (trabalhe SOMENTE nela): `/Users/brenoluis/Documents/Projetos APPs/doseplus`
Não toque em nenhum outro projeto. Leia antes: `AGENTS.md`, `CLAUDE.md`, `CHANGELOG.md`.

## Regras (do AGENTS.md — invioláveis)
- Single-file Vanilla JS em `index.html`. Sem framework, sem bundler. Edições cirúrgicas, sem reformatar.
- NÃO altere `analyzeCase()`, `DRUGS`, textos clínicos, schema (`SCHEMA_VERSION` segue 5) nem chaves de storage.
- NÃO apague nem migre dados. Nenhum código novo pode tocar em `localStorage`, `sessionStorage` ou IndexedDB do app.
- NÃO mude paleta (teal/dourado) nem fontes (Fraunces + Inter Tight).
- NÃO delete arquivos sem minha aprovação. NÃO faça commit/push/deploy: no fim, gere o zip e pare.
- Dado de saúde é sensível (LGPD): nada de dado clínico em URL, log ou serviço externo.

## Como trabalhar
1. Primeiro mostre um PLANO curto (arquivos que vai tocar + riscos) e ESPERE minha aprovação.
2. Depois execute em etapas, uma por vez, rodando `node test.js` ao final de cada uma (deve passar 100%).

## Contexto já verificado
- `index.html` tem `const APP_VERSION = '2.5.0'` (linha ~1399) que NÃO é usada em lugar nenhum e está desatualizada (o que está no ar é a v2.6.0 de layout mobile).
- Já existe em Preferências (~linha 1038) o card "Atualização de app" com botão "Verificar" que chama `checkForUpdates()` (~linha 4196). Ele só mostra toast/banner, sem exibir a versão.
- `sw.js`: `CACHE = 'dosecheck-v2.6'`, ASSETS = `./`, `index.html`, `manifest.json`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`. Estratégia: cache-first + revalidação em background (por isso a 1ª abertura após um deploy ainda mostra a versão antiga).
- O banner "Nova versão disponível" + `SKIP_WAITING` + `controllerchange → location.reload()` já funciona. NÃO recarregar sozinho: pode perder dado digitado.
- Deploy é manual via Netlify (zip/CLI), publicado de uma pasta limpa. Conta correta: casatvboxbrefire@gmail.com, projeto `doseplus` (Project Id 0a3b89a9-4e0b-4d59-8b6c-4c4dcd3e8a19).

## ETAPA 1 — Versão visível
- `APP_VERSION = '2.6.1'`.
- Mostrar `v2.6.1` de forma discreta (fonte pequena, cor `--tg-mist`) (a) no rodapé do Painel e (b) no card "Atualização de app" das Preferências ("Versão instalada: v2.6.1"). Usar `textContent`, nunca `innerHTML` com dado dinâmico.
- Mostrar também, nas Preferências, o cache do SW ativo (ex.: "Cache: dosecheck-v2.6.1") lendo via `caches.keys()` com try/catch; se falhar, omitir a linha.
- Garantir que não quebre em 320px (sem overflow horizontal).

## ETAPA 2 — Verificar e Forçar atualização
- Melhorar o botão "Verificar" existente: após checar, mostrar no próprio card "Você está na versão mais recente (v2.6.1)" ou "Nova versão disponível — toque em Atualizar".
- Novo botão "Forçar atualização" (estilo `btn-ghost`) no mesmo card, com confirmação em modal do próprio app (não `alert`). Ao confirmar:
  1. `navigator.serviceWorker.getRegistrations()` → `unregister()` de todas;
  2. `caches.keys()` → `caches.delete()` de todas as do app (prefixo `dosecheck-`);
  3. `location.reload()`.
  Tudo com try/catch e mensagem clara se falhar. Texto na UI: "Seus dados não são apagados."
  PROIBIDO: `localStorage.clear()`, `indexedDB.deleteDatabase`, `sessionStorage.clear()`.

## ETAPA 3 — Service Worker
- `CACHE = 'dosecheck-v2.6.1'`; incluir novos assets (Etapa 4) em `ASSETS`.
- Para requisições de navegação (`req.mode === 'navigate'`) usar network-first com fallback ao cache (offline continua funcionando). Assets locais e CDN seguem como estão. Se isso complicar ou quebrar algo, NÃO implemente e me avise com o motivo.

## ETAPA 4 — Imagens e metadados ao abrir no navegador/instalar
Hoje: só `apple-touch-icon` apontando para `icon-192.png` (PNG com cantos TRANSPARENTES → no iOS aparecem cantos pretos), sem `rel="icon"`/favicon, sem og:image.
Criar (Python + Pillow; `pip install pillow` se faltar), usando `icon-512.png` sobre fundo sand `#F5F1EA`:
- `apple-touch-icon.png` 180×180, OPACO (sem transparência), ícone ocupando ~80%.
- `favicon-32.png` e `favicon-16.png` (e `favicon.ico` com 16/32/48 se simples).
- `og-image.png` 1200×630 (fundo `#0B3B3C`, nome "DOSE Plus" em branco, subtítulo curto) — gerar só com Pillow e fontes do sistema; sem usar marca de terceiros.
No `<head>` do `index.html` (cirúrgico):
- `<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png">` e 16x16;
- trocar `apple-touch-icon` para `apple-touch-icon.png` (180x180);
- `<meta name="description">`, `og:title`, `og:description`, `og:type`, `og:image` com URL absoluta `https://doseplus.netlify.app/og-image.png`.
No `manifest.json`: adicionar `"id": "./"` e manter `orientation: portrait`, `start_url`, `scope`. Ícones `any` e `maskable` já estão separados — não mexer.
NÃO criar splash screens do iOS (muitos tamanhos; o `background_color` já cobre).
Verificar que a CSP (`img-src 'self' data: blob:`) não bloqueia nada novo.

## ETAPA 5 — Estrutura a manter em sincronia (checklist de TODA versão)
Atualizar juntos: `APP_VERSION` (index.html) · `CACHE` e `ASSETS` (sw.js) · `CHANGELOG.md` (nova entrada 2.6.1 com trade-offs) · `README.md` (versão) · `AGENTS.md` e `CLAUDE.md` (hoje citam `dosecheck-v2.3`; corrigir para o cache atual) · nome do zip.
Adicionar em `test.js` um teste que falhe se `APP_VERSION` do index.html não bater com o sufixo do `CACHE` do sw.js, e se algum arquivo listado em `ASSETS` não existir na pasta.

## ETAPA 6 — Validação e entrega
- `node test.js` 100% verde.
- Servir a pasta (`npx serve .`) e conferir com Playwright em 320, 360, 390 e 412px: Painel (versão no rodapé), Preferências (card de atualização), sem scroll horizontal, sem erro no console além de rede/CDN.
- Gerar `doseplus-v2.6.1-netlify.zip` (ignorado pelo git) contendo APENAS: `_headers`, `index.html`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `favicon-32.png`, `favicon-16.png`, `og-image.png` (+ `favicon.ico` se criado). Listar o conteúdo do zip.
- Parar aqui e me entregar um resumo: o que mudou, o que NÃO foi feito, riscos. Eu faço o deploy.

## Definição de pronto
Versão visível no Painel e nas Preferências · "Verificar" e "Forçar atualização" funcionando sem apagar dados · SW v2.6.1 · assets criados e referenciados · testes verdes · CHANGELOG/README/AGENTS/CLAUDE atualizados · zip gerado · nada commitado.
