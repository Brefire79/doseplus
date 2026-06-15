# PROMPT — DoseCheck Plus v2 (GLP Monitor): Hardening de Segurança + Camada de Dados

> **Execução fatiada em 3 lotes.** Cada lote é um turno independente do Opus 4.8.
> Em **cada** execução, cole: o bloco **CONTEXTO COMPARTILHADO** (logo abaixo) + **um lote** (A, B ou C).
> Ordem obrigatória: **A → B → C** (B depende de A; C depende de B).
> Versão 2 — inclui os 4 patches: (A) SRI sem inventar hash, (B) CSP validada vs PDF/Share, (C) ordem cripto×migração, (D) teste de rollback da escrita dupla.

-----

# CONTEXTO COMPARTILHADO  *(colar antes de TODO lote)*

Você trabalha num PWA médico **DoseCheck Plus v2** (codinome interno *GLP Monitor*, produção Vianexx) — single-file (`index.html`), Vanilla JS, sem framework, sem build step. Acompanha tratamento com agonistas GLP-1/GIP (Ozempic, Wegovy, Mounjaro, Saxenda etc.).

Arquitetura atual (verificada no código):

- **Estado**: objeto `state` em `localStorage`, chave `glp_monitor_v3` (mantida apesar do rebranding). Campos: `cfg` (perfil), `apps` (doses), `pesos`, `medidas` (com `bio` de bioimpedância), `quizes` (diário).
- **Catálogo**: objeto `DRUGS` — 10 medicamentos com `escala`, `intervalo_dias`, `dose_maxima`, `evidence`.
- **Motor clínico**: `analyzeCase()` — adesão, resposta, platô, sarcopenia, tolerabilidade, recomendação de dose.
- **Relatório**: `buildSOAPHTML()` (HTML) e `exportPDF()` (jsPDF).
- **Render/estado**: `renderDashboard()`, `timelineApp()`, `loadState()`, `persist()`.
- **Libs via CDN** (versões fixadas, confirmadas no `index.html`):
  - Chart.js 4.4.1 — `cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js`
  - jsPDF 2.5.1 — `cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`
  - PapaParse 5.4.1 — `cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js`
- **PWA**: `manifest.json` + `sw.js` (cache offline-first, versão atual **`dosecheck-v2.3`**).
- **Chaves legadas**: `tg_monitor_v1`, `tg_monitor_v2` (ainda em uso por alguns usuários).

Restrições invioláveis (valem em TODOS os lotes):

- **Single-file** `index.html` — sem bundler, npm ou framework. **Vanilla JS** ES2020+, sem TypeScript.
- **Offline-first** — funcional 100% sem rede após primeiro load.
- **Não quebrar dados existentes** (`glp_monitor_v3`, `tg_monitor_v1/v2`).
- **Design intacto** (paleta teal/dourado, Fraunces + Inter Tight) — trabalho estrutural, não visual.
- **Não alterar** `analyzeCase()`, `DRUGS` nem textos médicos/referências.
- **Não reformatar/minificar em massa** — diffs revisáveis.
- **Não remover** o aviso legal dos relatórios.
- **Sem backend/login/Firebase** neste ciclo.

Ao final de cada lote, entregue: arquivos alterados completos + o trecho relevante do `CHANGELOG.md` + os testes daquele lote passando.

═══════════════════════════════════════════════════════════════
# LOTE A — XSS + CSP/SRI  *(risco zero para dados; comece por aqui)*
═══════════════════════════════════════════════════════════════

Independente da camada de dados. Só mexe em sanitização e headers/tags. **Não toca em persistência.**

## A1 — Eliminar XSS (prioridade máxima)

O código interpola dados do usuário direto em `innerHTML` por template literals em dezenas de pontos: `timelineApp()` (`notes`, `local`), `renderDashboard()` (`nome`), `buildSOAPHTML()` (`nome`, `medico`, `crm`, `notas`), listas de medidas, quiz etc.

1. Crie `esc(str)` que escapa `& < > " '` — aplique em **TODO** ponto onde input do usuário entra em HTML. Auditoria sistemática: busque todos os template literals atribuídos a `innerHTML` e trate cada variável interpolada.
2. Onde possível, prefira `textContent` a `innerHTML` (ex.: toast, greeting).
3. Validação no save: notes ≤ 500 chars, nome ≤ 120; numéricos com range plausível (peso 20–400 kg, altura 100–250 cm, dose > 0 e ≤ dose_maxima × 2; datas não-futuras exceto agendamentos).
4. No PDF (jsPDF) não há XSS, mas valide que campos longos não quebram o layout (truncar com reticências).

**Aceite:** `<img src=x onerror=alert(1)>` em qualquer campo, salvo, NÃO executa em nenhuma view nem no relatório.

## A2 — CSP + SRI + fallback de CDN

1. `<meta http-equiv="Content-Security-Policy">` restritiva:
   - `script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com` (inline necessário pelo single-file; documente em comentário)
   - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
   - `font-src https://fonts.gstatic.com` · `connect-src 'self'` · `img-src 'self' data: blob:` · `frame-ancestors 'none'`

   **PATCH B — validar CSP vs PDF e Web Share antes de fechar.** jsPDF gera blobs; Web Share monta `File`/`Blob`. Algumas builds podem precisar de `blob:` em `connect-src`/`worker-src` ou `'unsafe-eval'` em `script-src`. **Não afrouxe a CSP inteira.** Gere o PDF num teste manual, identifique a diretiva mínima que faltou, adicione **só ela** e **comente o porquê**. Se nada faltar, mantenha a CSP acima. (O share completo será testado no Lote C — aqui garanta ao menos que a geração de PDF passa.)

2. **PATCH A — SRI sem inventar hash.** Você NÃO tem os bytes reais dos arquivos CDN. **Não invente `sha384`.**
   - Adicione `integrity="sha384-REPLACE_ME"` + `crossorigin="anonymous"` nas 3 tags `<script src>`.
   - Acima de cada tag, comentário com o comando de geração, ex.:
     `<!-- gerar: curl -s https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js | openssl dgst -sha384 -binary | openssl base64 -A -->`
   - No `CHANGELOG.md`, liste os 3 comandos como passo obrigatório de pré-deploy.
   - Só substitua os placeholders por hashes reais se tiver baixado os bytes reais.

3. **Fallback de CDN.** Se um CDN falhar (SRI mismatch / offline sem cache): detectar `typeof Chart === 'undefined'`, `typeof jspdf === 'undefined'`, `typeof Papa === 'undefined'` e exibir aviso no lugar de gráficos/botões — sem exception.

## Entrega do Lote A
- `index.html` atualizado · trecho do `CHANGELOG.md` (incl. 3 comandos SRI)
- `test.js` parcial: `esc()` contra payloads XSS + validação de ranges no save → 100% verde.

## Definição de Pronto — Lote A
- [ ] Payload XSS em qualquer campo não executa em nenhuma view
- [ ] CSP ativa sem quebrar gráficos, PDF, fontes e ícones (PATCH B validado)
- [ ] Tags SRI com `crossorigin` + comando de geração documentado (PATCH A)
- [ ] App carrega normalmente; fallback de CDN testado

═══════════════════════════════════════════════════════════════
# LOTE B — Camada de dados + Migração versionada  *(núcleo; depende de A)*
═══════════════════════════════════════════════════════════════

Mexe na espinha dorsal dos dados. **Mais perigoso para "não quebrar dados existentes" — teste pesado obrigatório.** Assume o `index.html` já saneado do Lote A.

## B1 — Persistência robusta (localStorage → IndexedDB)

`localStorage` é evictável (iOS apaga após 7 dias) e síncrono. Camada dupla:

1. Módulo `Store` (objeto literal) com API assíncrona: `Store.load()`, `Store.save(state)`, `Store.export()`, `Store.import(json)`. **Deixe a interface plugável para um adapter remoto futuro** (sem implementá-lo).
2. **IndexedDB primário** (db `glp_monitor`, store `state`, key `current`) + **localStorage espelho** (chave `glp_monitor_v3`). Leitura: IndexedDB → fallback localStorage → default vazio. Escrita: ambos (IndexedDB `await`, localStorage sync best-effort).
3. **Persistência durável**: `navigator.storage.persist()` no primeiro save. **Trate `false` graciosamente** (iOS nega sem prompt). Badge discreto nas configurações: `granted` / `not granted` / `unsupported`.
4. Debounce de escrita (300 ms) — hoje cada `persist()` serializa o estado inteiro a cada toque.

**PATCH D — rollback da escrita dupla.** Defina a estratégia de consistência (recomendado: IndexedDB = fonte da verdade; localStorage = espelho descartável). No `test.js`, simule exception no meio da gravação (IndexedDB ok / localStorage falha — e vice-versa) e confirme que `Store.load()` recupera um estado íntegro (anterior ou novo, nunca híbrido). Documente a estratégia no `CHANGELOG.md`.

## B2 — Migração versionada

Substitua a migração ad-hoc em `loadState()` por sistema explícito:

```js
const SCHEMA_VERSION = 4;
const MIGRATIONS = {
  1: (d) => { /* tg_monitor_v1 → v2: adiciona cfg.dn, sexo, indic... */ },
  2: (d) => { /* v2 → v3: adiciona cfg.drugId, normaliza doses... */ },
  3: (d) => { /* v3 → v4: estrutura nova deste lote */ },
};
```

1. Estado ganha campo `_v` (int). Ao carregar, rode migrações em sequência de `_v` até `SCHEMA_VERSION`, cada uma pura e idempotente.
2. **Backup pré-migração**: snapshot em `glp_monitor_backup_v{N}` no IndexedDB. Mantenha só os 2 últimos.
3. Detecte e importe chaves legadas (`tg_monitor_v1`, `tg_monitor_v2`, `glp_monitor_v3`) na primeira execução; remova após sucesso confirmado.
4. Migração lançou exception: **não destrua nada** — mantenha o dado original, alerte pedindo export de backup, rode em modo somente-leitura dos dados antigos.

## Entrega do Lote B
- `index.html` atualizado · trecho do `CHANGELOG.md` (incl. estratégia de consistência do PATCH D)
- `test.js` acumulado: testes do Lote A + migrações 1→4 com fixtures de cada versão legada + rollback da escrita dupla (PATCH D) → 100% verde.

## Definição de Pronto — Lote B
- [ ] `Store` assíncrono com IndexedDB primário + espelho localStorage + debounce 300 ms
- [ ] `navigator.storage.persist()` com badge; `false` tratado
- [ ] Dados de `tg_monitor_v1/v2` e `glp_monitor_v3` migram sem perda (fixtures)
- [ ] Backup pré-migração (2 últimos) + modo somente-leitura em falha
- [ ] Falha parcial na escrita dupla não corrompe o estado (PATCH D testado)

═══════════════════════════════════════════════════════════════
# LOTE C — Cripto + Share + Export + Service Worker  *(depende de B)*
═══════════════════════════════════════════════════════════════

Assume o módulo `Store` e o sistema de `MIGRATIONS` do Lote B já no lugar — a cripto envelopa o `Store`, o export usa o schema versionado.

## C1 — Criptografia opcional em repouso (LGPD art. 11)

1. Configurações: opção "Proteger dados com PIN" (4–8 dígitos).
2. Derivação: PBKDF2 (`crypto.subtle`) ≥ 310.000 iterações, salt aleatório 16 bytes armazenado junto. Cifra: AES-GCM 256, IV aleatório por escrita.
3. PIN ativo → estado gravado cifrado (IndexedDB e localStorage). Tela de desbloqueio antes de renderizar qualquer dado. 5 erros consecutivos → 30 s de backoff. **Contador e backoff persistem entre reloads.**
4. **Sem recuperação de PIN** — explícito na UI ("Se esquecer o PIN, só restaurando um backup exportado"). Export JSON continua em claro mediante PIN correto (avisar no momento do export). **O JSON exportado NÃO contém hash do PIN, salt nem IV.**
5. Sem PIN configurado → comportamento atual (plaintext). Não force.

**PATCH C — ordem cripto × migração** (resolve o conflito B2.4 × C1). Boot com PIN ativo:
   1. **Desbloquear** (descriptografar) — PIN errado nunca chega a migrar.
   2. **Migrar** o estado em claro (`MIGRATIONS`).
   3. **Migração falha** → mantenha o blob **cifrado original** intacto, modo somente-leitura, peça export. Nunca regrave versão parcialmente migrada por cima do original.
   4. **Re-cifrar e salvar** só após migração bem-sucedida.

## C2 — Compartilhamento seguro

1. **Remova o relatório completo da URL do WhatsApp.** Mensagem-resumo mínima, sem dados clínicos ("Olá Dr(a). X, segue meu relatório de acompanhamento do DoseCheck — enviarei o PDF em anexo") + instrução na UI para anexar o PDF.
2. **Web Share API** (`navigator.share` com `files`) quando disponível: blob do jsPDF via `doc.output('blob')` → `File`. Fallback: download + instrução manual.
3. E-mail: mesmo princípio — corpo mínimo, PDF anexo manual.

## C3 — Integridade do backup/export

1. Export JSON com envelope: `{ app: "dosecheck-plus", schema: SCHEMA_VERSION, exported_at: ISO, checksum: SHA-256 do payload, data: {...} }`.
2. Import valida: envelope, checksum, `schema` ≤ atual (se menor, roda migrações), sanidade (arrays/tipos). Corrompido → mensagem clara, nada sobrescrito.
3. **Lembrete de backup**: > 20 registros e último export > 30 dias (rastrear `cfg.last_export`) → alerta suave no dashboard.

## C4 — Service Worker e atualização

1. Bump do cache **`dosecheck-v2.3` → `dosecheck-v2.4`** + **stale-while-revalidate** para os CDNs (cache-first com revalidação em background), mantendo cache-first para assets locais.
2. Novo SW assume (`controllerchange`) → toast "Nova versão disponível — toque para recarregar".

## Entrega do Lote C
- `index.html` + `sw.js` (cache `dosecheck-v2.4`) + `manifest.json` (se necessário)
- `CHANGELOG.md` final consolidado
- `test.js` completo: Lotes A + B + checksum export/import (roundtrip + corrupção) + `analyzeCase()` regressão (Mounjaro 27 sem com platô → escalada 12,5 mg) → 100% verde
- **ZIP final com tudo**

## Definição de Pronto — Lote C (e do projeto)
- [ ] PIN ativo → nada legível em DevTools > Application > Storage; export sem salt/IV/hash
- [ ] Ordem desbloquear→migrar→recifrar; migração falha mantém blob cifrado original (PATCH C)
- [ ] WhatsApp/e-mail não carregam dados clínicos na URL; Web Share do PDF funciona
- [ ] Export com envelope + checksum; import corrompido não sobrescreve
- [ ] App funciona offline após primeiro load (SW `dosecheck-v2.4`); toast de atualização
- [ ] `node test.js` → 100% verde (suite completa A+B+C)

-----

## Resumo da sequência

| Lote | Tarefas | Risco p/ dados | Depende de |
|---|---|---|---|
| **A** | XSS, CSP, SRI, fallback CDN | Nenhum | — |
| **B** | `Store`/IndexedDB, migração versionada | **Alto** | A |
| **C** | Cripto, share, export, SW | Médio | B |

Rode um lote por vez. Só avance quando a Definição de Pronto do lote anterior estiver verde e o `test.js` acumulado passar.
