# DOSE Plus · GLP Monitor (DoseCheck Plus v2)

**No ar:** https://doseplus.netlify.app · **Repositório:** `Brefire79/doseplus`

> Nomes usados: **DOSE Plus** (marca na tela e no ícone), **GLP Monitor · Emagrecedores** (título da página e nome no `manifest.json`), **DoseCheck Plus v2** (nome do projeto nos documentos), **doseplus** (site, repositório e pasta).

Acompanhamento clínico completo para tratamento com **agonistas GLP-1 / GIP**. Suporte multi-medicamento — o app se adapta à caneta em uso (Ozempic, Wegovy, Mounjaro, Saxenda, Trulicity, Retatrutida etc.), com escala de doses, intervalo, orientações e análise específicas por droga.

**Stack:** Vanilla JS em um único `index.html` · IndexedDB (fonte da verdade) + espelho em `localStorage` · Chart.js 4.4.1, jsPDF 2.5.1 e PapaParse 5.4.1 via CDN com SRI · Service Worker offline-first · sem backend, sem build.

**Versão atual:** 2.6.1 (visível no rodapé do Painel e em Preferências → Atualização de app).

---

## Medicamentos suportados

### 🟢 Geração 1 — GLP-1 clássico
| Caneta | Princípio | Freq. | Escala | Perda esperada (longo prazo) |
|---|---|---|---|---|
| **Saxenda** | Liraglutida | Diário | 0,6 → 3,0 mg | ~8% |
| **Victoza** | Liraglutida | Diário | 0,6 → 1,8 mg | ~5% |
| **Ozempic** | Semaglutida | Semanal | 0,25 → 2,0 mg | ~12% |
| **Wegovy** | Semaglutida | Semanal | 0,25 → 2,4 mg | ~15% |
| **Trulicity** | Dulaglutida | Semanal | 0,75 → 4,5 mg | ~5% |

### 🟡 Geração 2 — Duplo agonista (GLP-1 + GIP)
| Caneta | Princípio | Freq. | Escala | Perda esperada |
|---|---|---|---|---|
| **Mounjaro** | Tirzepatida | Semanal | 2,5 → 15 mg | ~20% |
| **Zepbound** | Tirzepatida | Semanal | 2,5 → 15 mg | ~20% |

### 🔴 Geração 3 — Em desenvolvimento (experimental)
| Caneta | Princípio | Notas |
|---|---|---|
| **Retatrutida** | Triplo (GLP-1 + GIP + glucagon) | Fase 3 · perda ~24% em fase 2 |
| **MariTide** | Duplo long-acting (Amgen) | Aplicação mensal em estudo |
| **Bioglutida** | Próxima geração | Dados públicos limitados |

⚠️ Canetas da geração 3 aparecem marcadas como experimentais e o motor de sugestão de dose fica em modo "cautela — uso apenas em protocolo de pesquisa".

---

## Funcionalidades

- **Dashboard adaptativo:** hero card com última dose na unidade correta da caneta + contagem regressiva (dias/horas conforme frequência), stats de peso/IMC/% gordura, alerta clínico inteligente.
- **Biblioteca de canetas:** tela dedicada com cards por geração, seleção com 1 toque, conteúdo educativo sobre GLP-1/GIP/triplo.
- **Nova aplicação:** chips de dose gerados dinamicamente pela escala da caneta ativa, 8 locais de aplicação, jejum, observações.
- **Peso & Medidas:** gráficos de evolução; antropometria (altura, cintura, quadril, peito, braço) com relação cint./quadril.
- **Bioimpedância:** % gordura, massa gorda/magra/muscular, água corporal, gordura visceral, TMB, idade metabólica — com auto-derivação (ex: magra = peso − gorda).
- **Diário clínico:** 4 escalas (humor, energia, efeitos, apetite) + notas livres.
- **Motor clínico:** cruza aplicações × peso × bioimpedância × diário e calcula:
  - Adesão terapêutica (% vs intervalo esperado da caneta)
  - Resposta (responder / parcial / non-responder · critério ≥5%)
  - Platô (<1% variação em ≥28 dias)
  - Risco de sarcopenia (% da perda que veio da massa magra)
  - Intensidade de efeitos adversos (30d)
  - Sugestão de ajuste de dose adaptada à escala da droga
- **Relatório SOAP:** Subjetivo / Objetivo / Avaliação / Plano, formatado padrão médico, com cabeçalho institucional, tabelas de dados, referências bibliográficas específicas da caneta, assinaturas e aviso legal.
- **Pausa e retomada de aplicações** (v2.5): pausa só as doses do medicamento atual, com data, motivo e anotação; peso, medidas e diário continuam. Alertas ficam suspensos e voltam após a primeira dose pós-retomada.
- **Proteção por PIN (opcional):** dados cifrados no aparelho (PBKDF2 310 mil iterações → AES-GCM 256). Não há recuperação de PIN.
- **Backup com integridade:** JSON exportado com envelope e checksum SHA-256; a importação valida antes de sobrescrever qualquer coisa e mostra uma prévia (mesclar ou substituir).
- **Atualização do app** (v2.6.1): versão visível no rodapé do Painel e em Preferências; botões "Verificar" e "Forçar atualização" (limpa só o cache do app, nunca os dados).
- **Export:** PDF profissional (cabeçalho teal + banda dourada, paginação, rodapé legal), CSV multi-sessão, JSON de backup, impressão. WhatsApp/e-mail enviam só uma mensagem-resumo (nenhum dado clínico na URL); o PDF é compartilhado como anexo pela Web Share API quando o aparelho suporta.

---

## Base científica das sugestões

Cada droga carrega referência específica no motor:
- **Semaglutida (Wegovy):** Wilding JPH et al. NEJM 2021 (STEP-1)
- **Semaglutida (Ozempic):** Davies M. Lancet 2021 · SUSTAIN trials
- **Tirzepatida (Mounjaro):** Jastreboff AM. NEJM 2022 (SURMOUNT-1) · Garvey WT. Lancet 2023 (SURMOUNT-2)
- **Liraglutida (Saxenda):** Pi-Sunyer X. NEJM 2015 (SCALE)
- **Dulaglutida (Trulicity):** AWARD trials
- **Retatrutida:** Jastreboff AM. NEJM 2023 (fase 2)
- **Referências transversais:** SBEM, AACE 2023, Endocrine Society, bula ANVISA

Todas as sugestões são **educacionais**. O PDF traz disclaimer em todas as páginas: "não substitui decisão médica".

---

## Deploy

Site de produção: **doseplus.netlify.app** — conta Netlify `casatvboxbrefire@gmail.com`, projeto `doseplus` (Project ID `0a3b89a9-4e0b-4d59-8b6c-4c4dcd3e8a19`, já vinculado em `.netlify/state.json`).

O deploy publica **só os arquivos do app**, nunca a pasta inteira (ela tem PRDs, prompts e zips antigos). O pacote é `doseplus-vX.Y.Z-netlify.zip` (ignorado pelo git), com `index.html` na raiz e exatamente estes arquivos:

`_headers`, `index.html`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `favicon-16.png`, `favicon-32.png`, `favicon.ico`, `og-image.png`

**Manual:** painel da Netlify → projeto `doseplus` → **Deploys** → arraste o zip.

**CLI:** extraia o zip numa pasta limpa e publique essa pasta:

```sh
netlify deploy --prod --no-build --dir=<pasta-limpa> --site 0a3b89a9-4e0b-4d59-8b6c-4c4dcd3e8a19
```

> ⚠️ Não use `netlify deploy --dir=.` — publicaria documentos internos e zips junto com o app.

**Local:** `npx serve .` ou `python3 -m http.server 8080`. O Service Worker só registra em HTTPS ou `localhost`; via `file://` o app funciona, mas sem cache offline.

O `_headers` (e o `netlify.toml`) mandam `no-cache` em `/`, `index.html` e `sw.js`, para o navegador sempre checar a versão nova.

### Checklist de cada versão

Atualizar juntos, sempre:
1. `APP_VERSION` no `index.html`.
2. `CACHE` (`dosecheck-v` + versão) e `ASSETS` no `sw.js` — o `node test.js` falha se divergirem ou se faltar arquivo.
3. Entrada nova no `CHANGELOG.md`, com trade-offs.
4. "Versão atual" neste README.
5. Gerar o zip `doseplus-vX.Y.Z-netlify.zip` e publicar.

---

## Dados e migração

- Tudo fica **no aparelho**: IndexedDB `glp_monitor` (fonte da verdade) com espelho em `localStorage` na chave `glp_monitor_v3` (nome mantido por compatibilidade). O app pede armazenamento persistente (`navigator.storage.persist()`) e mostra o resultado nas Preferências.
- Schema versionado (`SCHEMA_VERSION = 5`, campo `_v`). Migrações 1→5 rodam automaticamente, com backup antes de migrar; se uma migração falhar, o app entra em modo somente-leitura e não apaga nada.
- Quem usava o **TG Monitor v1/v2** (só tirzepatida, chaves `tg_monitor_v1`/`tg_monitor_v2`) é migrado sozinho: as aplicações antigas viram `drugId: "mounjaro"` e as chaves legadas são removidas só depois da migração dar certo.
- "Forçar atualização" e o Service Worker **nunca** tocam nesses dados.

---

## Testes

```sh
node test.js
```

Sem dependências: extrai o JS do `index.html` e roda em sandbox com DOM e IndexedDB simulados. Cobre `esc()` contra XSS, validação de faixas, migrações 1→5, pausa/retomada, rollback da escrita dupla, envelope/checksum do backup, regressão do `analyzeCase()` e a sincronia versão ↔ cache ↔ assets. Precisa passar 100% antes de qualquer entrega.

---

## Design tokens

Paleta inspirada na embalagem Mounjaro/Tirzepatida:
- `--tg-deep: #0B3B3C` — teal escuro (hero)
- `--tg-core: #0F5B5D` — teal core
- `--tg-accent: #14A098` — teal vibrante (ação)
- `--tg-glow: #2DD4BF` — highlight
- `--tg-sand: #F5F1EA` — fundo off-white
- `--tg-gold: #C9A961` — luxo (banda SOAP)

Tipografia: **Fraunces** (display editorial) + **Inter Tight** (UI) + **JetBrains Mono** (dados).

---

## Próximos passos sugeridos

- Sync multi-device (exige backend; a camada `Store` já deixa a interface plugável)
- Capacitor wrap → .ipa/.aab (App Store/Play Store)
- Lembretes push via Web Notifications API (hoje os alertas são sonoros/visuais dentro do app)
- OCR de rótulo de caneta + reconhecimento de voz para ditado de aplicação
- Remover o círculo vermelho de marcador da v2.6.1 (`.brand-mark::after`) quando não for mais necessário

---

Feito para **AMB FUSI AI** · *Damos vida à inovação*
