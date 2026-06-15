# AGENTS.md — DoseCheck Plus v2

Regras para qualquer agente de IA (Claude Code, Codex, Cursor etc.) trabalhando neste repositório.

## O que é este projeto

PWA médico **single-file** que acompanha tratamento com agonistas GLP-1/GIP (Ozempic, Mounjaro, Wegovy, Saxenda…). Codinome interno: *GLP Monitor*. Produção: Vianexx.

- `index.html` — **todo o app** (HTML + CSS + Vanilla JS inline). ~235 KB.
- `sw.js` — Service Worker, cache offline-first (`dosecheck-v2.3`).
- `manifest.json`, `icon-192.png`, `icon-512.png` — PWA.
- `netlify.toml` — deploy.

## Stack e restrições invioláveis

- **Single-file**: toda a lógica vive em `index.html`. Sem bundler, sem npm, sem framework, sem build step.
- **Vanilla JS** ES2020+. Sem TypeScript.
- **Offline-first**: precisa funcionar 100% sem rede após o primeiro load.
- **Sem backend** neste ciclo. Sem login, sem Firebase, sem sync remoto.
- Libs via CDN, versões fixadas: Chart.js 4.4.1, jsPDF 2.5.1, PapaParse 5.4.1.

## Arquitetura (mapa rápido)

- **Estado**: objeto `state` em `localStorage`, chave `glp_monitor_v3` (mantida apesar do rebranding). Campos: `cfg` (perfil), `apps` (doses), `pesos`, `medidas` (com `bio` de bioimpedância), `quizes` (diário).
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

## Segurança (épico ativo)

Há um épico de hardening em andamento — ver [PRD](PRD_HARDENING_DOSECHECK_PLUS_V2.md) e [prompt de execução](PROMPT-glp-monitor-hardening-v2.md). Pontos de atenção permanentes:

- **Todo dado de usuário em HTML deve passar por `esc()`** (escapar `& < > " '`). Prefira `textContent` quando possível. XSS armazenado é a vulnerabilidade nº 1 aqui.
- **SRI**: nunca invente um hash `sha384`. Use placeholder + comando `openssl dgst -sha384` documentado, ou bytes reais baixados.
- **CSP**: não afrouxe a política inteira para resolver um bloqueio pontual de PDF/Share — adicione só a diretiva mínima e comente o porquê.
- **Cripto**: ordem canônica no boot com PIN ativo = desbloquear → migrar → recifrar. Migração que falha mantém o blob cifrado original intacto.

## Como testar

- Não há build. Para rodar: sirva a pasta (`npx serve` ou abra `index.html`) — mas teste como PWA via servidor para o SW funcionar.
- Suite de testes alvo: `node test.js` (extrai o JS inline, roda com stubs de DOM). Deve passar 100% antes de qualquer entrega. Cobertura mínima: `esc()` vs XSS, migrações 1→4, checksum export/import, rollback de escrita dupla, regressão de `analyzeCase()`, validação de ranges.

## Ao entregar mudanças

- Atualize o `CHANGELOG.md` com cada mudança e trade-offs.
- Ao mexer no SW, **bump a versão do cache** (`dosecheck-v2.3` → próxima) senão o cache velho persiste.
- Verifique a Definição de Pronto do PRD antes de declarar pronto.
