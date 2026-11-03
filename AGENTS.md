# AGENTS.md — DoseCheck Plus v2

Regras para qualquer agente de IA (Claude Code, Codex, Cursor etc.) trabalhando neste repositório.

## O que é este projeto

PWA médico **single-file** que acompanha tratamento com agonistas GLP-1/GIP (Ozempic, Mounjaro, Wegovy, Saxenda…). Codinome interno: *GLP Monitor*; marca na tela: *DOSE Plus*. Produção: Vianexx.

- **No ar:** https://doseplus.netlify.app (Netlify, conta `casatvboxbrefire@gmail.com`, projeto `doseplus`, ID `0a3b89a9-4e0b-4d59-8b6c-4c4dcd3e8a19`).
- **Repositório:** `Brefire79/doseplus`, branch `main`. **Versão atual:** 2.6.1.

- `index.html` — **todo o app** (HTML + CSS + Vanilla JS inline). ~285 KB.
- `sw.js` — Service Worker, cache offline-first (`dosecheck-v2.6.1`, sempre `dosecheck-v` + `APP_VERSION`).
- `manifest.json`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` — PWA.
- `apple-touch-icon.png`, `favicon-16.png`, `favicon-32.png`, `favicon.ico`, `og-image.png` — ícones do navegador/iOS e prévia de links.
- `netlify.toml`, `_headers` — deploy e headers (`no-cache` em `/`, `index.html`, `sw.js`).
- `test.js` — suite de testes (Node, sem dependências).
- `accordion-relatorio.html` — página avulsa antiga; **não** faz parte do app nem do deploy.

## Stack e restrições invioláveis

- **Single-file**: toda a lógica vive em `index.html`. Sem bundler, sem npm, sem framework, sem build step.
- **Vanilla JS** ES2020+. Sem TypeScript.
- **Offline-first**: precisa funcionar 100% sem rede após o primeiro load.
- **Sem backend** neste ciclo. Sem login, sem Firebase, sem sync remoto.
- Libs via CDN, versões fixadas: Chart.js 4.4.1, jsPDF 2.5.1, PapaParse 5.4.1.

## Arquitetura (mapa rápido)

- **Estado**: objeto `state`, schema `SCHEMA_VERSION = 5` (campo `_v`). Campos: `cfg` (perfil), `apps` (doses), `pesos`, `medidas` (com `bio` de bioimpedância), `quizes` (diário), `medHistory` (trocas de medicamento), `applicationPauses` (pausas/retomadas).
- **Persistência**: módulo `Store` — IndexedDB `glp_monitor` (fonte da verdade) + espelho em `localStorage`, chave `glp_monitor_v3` (mantida apesar do rebranding). Migrações em `MIGRATIONS` (1→5), backup pré-migração e modo somente-leitura em falha.
- **Cripto opcional**: módulo `Sec` (PIN → PBKDF2 310k → AES-GCM 256).
- **Versão/atualização**: `APP_VERSION`, `renderVersionInfo()`, `checkForUpdates()`, `executeForceUpdate()` (apaga só SW e caches `dosecheck-*`).
- **Catálogo**: objeto `DRUGS` — 10 medicamentos com `escala`, `intervalo_dias`, `dose_maxima`, `evidence`.
- **Motor clínico**: `analyzeCase()` — adesão, resposta, platô, sarcopenia, tolerabilidade, recomendação de dose.
- **Relatório**: `buildSOAPHTML()` (HTML) e `exportPDF()` (jsPDF).
- **Render**: `renderDashboard()`, `timelineApp()`, `loadState()`, `persist()`.
- **Chaves legadas**: `tg_monitor_v1`, `tg_monitor_v2` (versões anteriores, ainda em uso por alguns usuários).

## Regras de ouro

1. **NÃO altere** `analyzeCase()`, o catálogo `DRUGS`, nem textos médicos/referências sem pedido explícito. São conteúdo clínico revisado.
2. **NÃO remova** o aviso legal dos relatórios.
3. **NÃO quebre dados existentes.** Qualquer mudança de schema precisa migrar `glp_monitor_v3` / `tg_monitor_v1` / `tg_monitor_v2` sem perda. Teste com fixtures.
4. **NÃO reformate/minifique em massa.** Diffs devem ser revisáveis.
5. **NÃO mude o design** (paleta teal/dourado, fontes Fraunces + Inter Tight) salvo pedido explícito.
6. **Dado de saúde é sensível (LGPD art. 11).** Nunca exponha dados clínicos em URL, log ou serviço externo.

## Segurança

O épico de hardening (Lotes A, B e C) foi **concluído em jun/2026** — histórico no [PRD](PRD_HARDENING_DOSECHECK_PLUS_V2.md), no [prompt de execução](PROMPT-glp-monitor-hardening-v2.md) e no `CHANGELOG.md`. Pontos de atenção permanentes:

- **Todo dado de usuário em HTML deve passar por `esc()`** (escapar `& < > " '`). Prefira `textContent` quando possível. XSS armazenado é a vulnerabilidade nº 1 aqui.
- **SRI**: nunca invente um hash `sha384`. Use placeholder + comando `openssl dgst -sha384` documentado, ou bytes reais baixados.
- **CSP**: não afrouxe a política inteira para resolver um bloqueio pontual de PDF/Share — adicione só a diretiva mínima e comente o porquê.
- **Cripto**: ordem canônica no boot com PIN ativo = desbloquear → migrar → recifrar. Migração que falha mantém o blob cifrado original intacto.

## Como testar

- Não há build. Para rodar: sirva a pasta (`npx serve .`, ou `.claude/launch.json` → `dosecheck` na porta 4178) — teste como PWA via servidor para o SW funcionar.
- `node test.js` (extrai o JS inline, roda com stubs de DOM e IndexedDB em memória). Deve passar 100% antes de qualquer entrega. Cobre: `esc()` vs XSS, validação de ranges, migrações 1→5, pausa/retomada, rollback de escrita dupla, checksum export/import, regressão de `analyzeCase()`, sincronia `APP_VERSION` ↔ `CACHE` ↔ `ASSETS`.
- Mudança visual: confira em 320, 360, 390 e 412 px (sem scroll horizontal).

## Ao entregar mudanças

- Atualize o `CHANGELOG.md` com cada mudança e trade-offs.
- **Toda versão nova** atualiza juntos: `APP_VERSION` (`index.html`), `CACHE` = `dosecheck-v` + versão e `ASSETS` (`sw.js`), `CHANGELOG.md`, "Versão atual" no `README.md` e nesta página. Sem bump do cache, o app instalado não percebe a atualização.
- Arquivo novo que o app usa offline → entra em `ASSETS` e na lista do zip (README → Deploy).
- **Deploy** só a partir de uma pasta limpa com os arquivos do zip `doseplus-vX.Y.Z-netlify.zip` — nunca `netlify deploy --dir=.`. Deploy, commit e push só com pedido explícito do usuário.
- Verifique a Definição de Pronto do PRD antes de declarar pronto.
