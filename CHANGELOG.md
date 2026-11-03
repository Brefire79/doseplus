# CHANGELOG — DoseCheck Plus v2

Formato: épico de hardening executado em lotes (ver [PRD](PRD_HARDENING_DOSECHECK_PLUS_V2.md) e [prompt](PROMPT-glp-monitor-hardening-v2.md)).

## [2.6.1] — 2026-11-03 — Versão visível, atualização forçada e ícones do navegador

### Versão e atualização
- `APP_VERSION` `2.5.0` → `2.6.1` (estava desatualizada e sem uso). Agora aparece no rodapé do Painel e no card "Atualização de app" das Preferências, junto com o cache do SW ativo (lido via `caches.keys()`; a linha some se não houver acesso). Tudo via `textContent`.
- "Verificar" mostra o resultado no próprio card: "Você está na versão mais recente (v2.6.1)" ou "Nova versão disponível — toque em Atualizar". O banner do topo agora só aparece quando há versão nova (antes piscava "✓ Versão atualizada"/"⚠ Erro" com o botão "Atualizar agora" sem função).
- Novo botão **"Forçar atualização"** com modal de confirmação: remove os registros do SW, apaga só os caches com prefixo `dosecheck-` e recarrega. **Não toca em `localStorage`, `sessionStorage` nem IndexedDB.** Botão desabilitado quando `navigator.onLine` é falso.

- **Marcador visual da atualização:** círculo vermelho (`--tg-rose`) em volta do símbolo da marca no cabeçalho, para confirmar de relance que a v2.6.1 carregou. Só CSS (`.brand-mark::after`); remover quando não for mais necessário.

### Service Worker
- Cache `dosecheck-v2.6` → `dosecheck-v2.6.1`; `ASSETS` inclui `apple-touch-icon.png`, `favicon-16.png`, `favicon-32.png`, `favicon.ico`.
- Navegação (`req.mode === 'navigate'`) passa a ser **network-first** com fallback ao cache (`index.html`), para um deploy novo aparecer já na 1ª abertura com rede. Assets locais e CDN seguem stale-while-revalidate.

### Ícones e metadados
- `apple-touch-icon.png` 180×180 **opaco** sobre fundo sand `#F5F1EA` (sem cantos pretos no iOS); `favicon-16/32.png` + `favicon.ico` (16/32/48); `og-image.png` 1200×630.
- `<head>`: `rel="icon"`, `apple-touch-icon` 180, `meta description` e `og:title/description/type/image` (`https://doseplus.netlify.app/og-image.png`). CSP inalterada (`img-src 'self'` já cobre).
- `manifest.json`: `"id": "./"`.

### Sincronia de versão
- Pasta do projeto e pacotes de deploy renomeados para o nome real do site (`doseplus.netlify.app`): pasta `doseplus/`, zips `doseplus-vX.Y.Z-netlify.zip`.
- `test.js`: falha se `APP_VERSION` ≠ sufixo do `CACHE` do `sw.js` ou se algum arquivo de `ASSETS` não existir. AGENTS/CLAUDE/README atualizados.

### Trade-offs
- Quem está na v2.6.0 ainda precisa tocar em "Atualizar" no banner uma vez: a estratégia network-first só vale depois que o SW v2.6.1 estiver ativo.
- "Forçar atualização" sem rede deixaria o app sem cópia offline até reconectar — por isso o botão é bloqueado offline e o modal avisa.
- `og:image` usa URL absoluta do domínio `doseplus.netlify.app`; outro domínio exige ajuste.
- `og-image.png` não entra no pré-cache (só serve para pré-visualização de links).
- Sem alteração em `analyzeCase()`, `DRUGS`, schema (segue 5) ou chaves de storage.

## [2.6.0] — 2026-11-02 — Otimização mobile (somente layout)

- Card "Última aplicação": a tag do medicamento deixou de ser `position:absolute` no mobile e entra no fluxo, sem sobrepor o rótulo nem o anel de dias (360px/320px).
- Cabeçalho: o bloco de texto da marca aceita encolher (`min-width:0`), evitando que o seletor de medicamento cubra o subtítulo em 320px.
- Barra de abas: fade na borda direita + padding para sinalizar que há mais abas ao rolar (Canetas/Backup ficavam cortadas sem indicação).
- `100vh`/`90vh` ganharam fallback `100dvh`/`90dvh` (barra do navegador mobile).
- Fontes mínimas: abas 10px, rótulos de estatística 11px, anel 10px.
- Manifest: ícone `maskable` dedicado (`icon-maskable-512.png`, com margem de segurança), separado dos ícones `any`.
- Cache do Service Worker `dosecheck-v2.5` → `dosecheck-v2.6`.
- Sem alteração em `analyzeCase()`, `DRUGS`, schema ou dados salvos.

## [2.5.0] — 2026-07-20 — Pausa e retomada de aplicações

### Controle de aplicações
- Nova ação para **pausar apenas as aplicações** do medicamento atual, preservando peso, medidas, bioimpedância, diário e todo o histórico anterior.
- Pausa registra data, motivo e anotação opcional; retomada registra data e anotação separada.
- Controle isolado por medicamento, com histórico visível na tela de doses e incluído nos relatórios, backup JSON e exportação CSV.
- A prévia de importação e a limpeza de dados contabilizam também o histórico de pausas.
- Durante a pausa, novos registros e alertas da aplicação ficam suspensos; os demais acompanhamentos continuam disponíveis.
- Após a retomada, o calendário aguarda a **primeira nova aplicação** antes de reativar alertas, evitando marcar como atrasado o intervalo em que o tratamento esteve pausado.

### Compatibilidade, segurança e validação
- Schema `4 → 5` com migração aditiva de `applicationPauses`, sem alterar aplicações ou dados clínicos existentes.
- Datas inválidas/futuras são rejeitadas; uma pausa retroativa não pode anteceder a última aplicação já registrada.
- Datas padrão passam a usar o calendário local do aparelho, evitando avançar um dia no período noturno por conversão UTC.
- Novas aplicações recebem `createdAt` para distinguir corretamente uma dose pós-retomada de outra dose antiga registrada na mesma data.
- Campos livres da pausa limitados a 500 caracteres e escapados antes de entrar em HTML.
- Cache do Service Worker atualizado de `dosecheck-v2.4` para `dosecheck-v2.5` para distribuir a nova interface offline.
- Deploy manual da Netlify recebe `_headers` no diretório público e `no-cache` em `/`, `index.html` e `sw.js`, reduzindo o risco de a PWA continuar servindo a versão anterior.

### Testes
- Cobertura de migração 1→5, isolamento por medicamento, preservação dos acompanhamentos, retomada, datas inválidas e espera da primeira dose pós-retomada.

### Trade-off clínico
- `analyzeCase()` e suas regras revisadas não foram alterados. Depois da primeira dose pós-retomada, um intervalo longo causado pela pausa ainda pode aparecer na métrica histórica de adesão; excluir esse período exige validação clínica específica antes de mudar o motor.

## [Hardening · Lote C] — 2026-06-15 — Cripto + Share + Export + SW

### Criptografia opcional em repouso (Tarefa C1 · LGPD art. 11)
- Módulo **`Sec`**: PBKDF2 (`crypto.subtle`, **310.000 iterações**, salt 16 bytes) → AES-GCM 256, **IV aleatório por escrita**.
- Opção **"Proteger dados com PIN"** (4–8 dígitos) nas Preferências (`#pin-toggle-btn`).
- PIN ativo → `Store.save` grava **cifrado** em localStorage e IndexedDB (nada legível em DevTools).
- **Tela de desbloqueio** (`#lock-screen`) antes de renderizar dados; **5 erros → 30s de backoff persistido** entre reloads (`glp_monitor_sec`).
- **Sem recuperação de PIN** (explícito na UI). Export continua em claro mediante PIN; **JSON exportado não contém PIN/salt/IV**.
- **PATCH C — ordem no boot**: desbloquear → migrar → re-cifrar. Migração que falha mantém o **blob cifrado original** intacto (modo somente-leitura).

### Compartilhamento seguro (Tarefa C2)
- **WhatsApp/e-mail sem dados clínicos na URL** — apenas mensagem-resumo + instrução para anexar o PDF.
- **Web Share API** (`navigator.share` com `files`): `sharePDF()` gera `File` via `doc.output('blob')` e compartilha o PDF como anexo. Fallback: download + instrução manual.

### Integridade de backup/export (Tarefa C3)
- Export ganha **envelope** `{ app, schema, exported_at, checksum (SHA-256 do payload), data }`.
- Import valida envelope, **checksum**, `schema ≤ atual` e estrutura; corrompido → mensagem clara, **nada sobrescrito** (`buildExportEnvelope`/`parseImportEnvelope`).
- Lembrete de backup já existente preservado.

### Service Worker (Tarefa C4)
- Cache **`dosecheck-v2.3` → `dosecheck-v2.4`**; pré-cache de manifest/ícones.
- **Stale-while-revalidate** estendido aos CDNs (jsdelivr/cdnjs/fonts) — cacheia respostas CORS; cache-first para assets locais.
- Toast "Nova versão disponível" via `controllerchange` (mantido).

### Testes (suite completa)
- Envelope/checksum: roundtrip + corrupção de checksum + adulteração de payload + schema futuro.
- **Regressão `analyzeCase()`**: Mounjaro 27 semanas, 10mg, platô → recomenda **escalada para 12.5mg** (motor clínico inalterado).
- `node test.js` → **`Passou: 26 | Falhou: 0 | Pendente: 0`**.

## [Hardening · Lote B] — 2026-06-15 — Camada de dados + migração versionada

### Persistência — módulo `Store` (Tarefa B1)
- **IndexedDB primário** (db `glp_monitor`, store `state`, key `current`) + **espelho `localStorage`** (`glp_monitor_v3`).
- API assíncrona e plugável (adapter remoto futuro): `Store.load/save/export/import`, `_open/_get/_put`, `reconcile`.
- **Escrita dupla**: `localStorage` síncrono (recuperação imediata) + IndexedDB com **debounce 300ms** (durável). Consistência: IndexedDB é a fonte da verdade; `localStorage` é espelho descartável.
- **`Store.reconcile()`** no boot: recupera de eviction (localStorage apagado mas IndexedDB intacto) e re-renderiza.
- **`navigator.storage.persist()`** no primeiro save + **badge** nas Preferências (`#persist-badge`) com estado real (`persisted()`): durável / sem persistência / não suportado. Retorno `false` tratado.

### Migração versionada (Tarefa B2)
- **`SCHEMA_VERSION = 4`** + **`MIGRATIONS` {1,2,3}**, cada uma pura e idempotente; estado ganha campo `_v`.
- `loadState()` infere a versão de origem pela chave (`tg_monitor_v1`→1, `tg_monitor_v2`→2, `glp_monitor_v3`→3) e roda até v4.
- **Backup pré-migração** (`snapshotBackup`): snapshot síncrono em `glp_monitor_backup_v{N}` (localStorage) + espelho IndexedDB; mantém os 2 últimos.
- Importação automática das chaves legadas com remoção após sucesso.
- **Falha de migração não destrói** (`migrate` try/catch): mantém o dado original, ativa **modo somente-leitura** (`_readOnly`), `persist()` bloqueia escrita e avisa o usuário.

### Testes (acumulado)
- Migrações 1→4 com **fixtures reais** de v1/v2/v3 (sem perda + idempotência + fixture inválida).
- **PATCH D**: shim de IndexedDB em memória no harness; round-trip Store + falha parcial (localStorage falha / IndexedDB mantém íntegro).
- `node test.js` → `Passou: 20 | Falhou: 0`.

### Trade-offs / notas
- Boot permanece **síncrono** (pinta da cópia `localStorage`) e o IndexedDB **reconcilia depois** — evita reescrever 11 call-sites de `persist()` para async e mantém a UI instantânea.
- Backup pré-migração priorizado em `localStorage` (síncrono, confiável no instante da migração) e espelhado no IndexedDB.

## [Hardening · Lote A] — 2026-06-15 — XSS + CSP + SRI

### Segurança — Sanitização (Tarefa A1)
- **Nova função `esc(str)`** — escapa `& < > " '` antes de qualquer interpolação em `innerHTML`.
- **`esc()` aplicado** em todos os pontos onde dado do usuário entra em HTML:
  - `renderDashboard()` — saudação (`nome`).
  - `timelineApp()` — `local`, `time`, `notes`.
  - lista de quiz — `notas`.
  - `buildSOAPHTML()` — `nome`, `medico`, `crm`, `notas` do diário, `local`/`dose`/`time` das aplicações, linha de assinatura.
  - Campos de medidas/bioimpedância confirmados como numéricos (`parseFloat`) — sem risco de XSS, não exigem escape.
  - Saídas de PDF (`doc.text`, jsPDF) não são HTML → fora do escopo de XSS.

### Segurança — Validação de entrada (Tarefa A1)
- **Novos helpers `clampNum`, `clampStr`, `clampSave`** (validador testável).
- Limites aplicados nos saves:
  - `savePeso` — peso 20–400 kg; rejeita data futura.
  - `saveApp` — `notes` ≤ 500, `local` ≤ 60; dose > 0 e ≤ `dose_maxima × 2`.
  - `saveQuiz` — `notas` ≤ 500.
  - `saveCfg` — `nome`/`email` ≤ 120, `medico` ≤ 120, `crm`/`tel` ≤ 40, `peso_inicial` 20–400.

### Segurança — CSP (Tarefa A2)
- **Meta `Content-Security-Policy`** restritiva adicionada ao `<head>`.
  - `script-src` permite `'unsafe-inline'` — **necessário** pelo modelo single-file (todo JS e handlers inline). Documentado em comentário.
  - `connect-src 'self' blob:` — inclui `blob:` proativamente para jsPDF/Web Share (PATCH B); `'self'` porque o app é offline/local.
  - `img-src 'self' data: blob:`, `font-src` Google Fonts, `frame-ancestors 'none'`, `base-uri 'self'`.

### Segurança — SRI (Tarefa A2 · PATCH A)
- **`integrity` (sha384) + `crossorigin="anonymous"`** nas 3 tags CDN, com **hashes reais** calculados contra os arquivos das versões fixadas:
  - Chart.js 4.4.1 → `sha384-9nhczxUqK87bcKHh20fSQcTGD4qq5GhayNYSYWqwBkINBhOfQLg/P5HG5lF1urn4`
  - jsPDF 2.5.1 → `sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk`
  - PapaParse 5.4.1 → `sha384-D/t0ZMqQW31H3az8ktEiNb39wyKnS82iFY52QPACM+IjKW3jDUhyIgh2PApRqJZs`
- **Reverificação** (rodar antes de qualquer bump de versão de lib):
  ```sh
  curl -s https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js        | openssl dgst -sha384 -binary | openssl base64 -A
  curl -s https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js       | openssl dgst -sha384 -binary | openssl base64 -A
  curl -s https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js   | openssl dgst -sha384 -binary | openssl base64 -A
  ```

### Resiliência — Fallback de CDN (Tarefa A2)
- **`checkCDN()`** detecta `typeof Chart/jspdf/Papa === 'undefined'` (SRI mismatch ou offline sem cache) e substitui `<canvas>` por aviso, em vez de quebrar com exception.

### Testes
- **Nova suite `test.js`** (Node, zero-dependência): extrai o JS inline via `vm` + stubs de DOM.
- Lote A coberto e **verde**: `esc()` contra 5 payloads XSS + escape canônico + idempotência + não-string; validação de ranges (`clampSave`). Scaffolds marcados para Lotes B e C.
- Rodar: `node test.js` → `Passou: 11 | Falhou: 0`.

### Trade-offs / notas
- `'unsafe-inline'` em `script-src` é uma concessão consciente ao modelo single-file; mitigado por SRI nos scripts externos e ausência de `eval`/origens de terceiros para script.
- SRI com hash real **fixa as versões** das libs — qualquer atualização exige recalcular os hashes (comandos acima).
- Pendente para o deploy: validação manual do PATCH B (gerar PDF + Web Share sob a CSP) será fechada no Lote C, onde a Web Share entra; a geração de PDF já passa com `connect-src ... blob:`.
