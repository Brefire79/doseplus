# GLP Monitor · Emagrecedores PWA

Acompanhamento clínico completo para tratamento com **agonistas GLP-1 / GIP**. Suporte multi-medicamento — o app se adapta à caneta em uso (Ozempic, Wegovy, Mounjaro, Saxenda, Trulicity, Retatrutida etc.), com escala de doses, intervalo, orientações e análise específicas por droga.

**Stack:** Vanilla JS + localStorage + Chart.js + jsPDF + PapaParse · single-file HTML · 100% offline-first.

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
- **Export:** PDF profissional (cabeçalho teal + banda dourada, paginação, rodapé legal), CSV multi-sessão, JSON de backup, impressão, WhatsApp, e-mail.

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

## Deploy rápido

**Netlify manual (site existente):** abra o site no painel da Netlify, entre em **Deploys** e arraste `DoseCheck-Plus-v2.5.0-netlify.zip` para a área de deploy manual. O ZIP deve ter `index.html` diretamente na raiz.

**Netlify Drop (site novo):** arraste o mesmo ZIP em https://app.netlify.com/drop.

**CLI opcional:** `netlify deploy --prod --dir=.`

**Local:** `npx serve .` ou `python -m http.server 8080`

> Service Worker só registra em HTTPS ou `localhost`. Via `file://` o app funciona via localStorage mas sem cache SW.
> O arquivo `_headers` acompanha o deploy manual para impedir cache antigo do `index.html` e do Service Worker.

---

## Migração de dados

Se você já usava o **TG Monitor v1/v2** (só tirzepatida), o app migra automaticamente:
- Lê `tg_monitor_v2` ou `tg_monitor_v1` do localStorage
- Marca todas as aplicações antigas como `drugId: "mounjaro"`
- Grava em `glp_monitor_v3`
- Nenhum dado perdido

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

- `localStorage` → **IndexedDB** (idb-keyval) para +1MB de dados
- Firebase Firestore para sync multi-device
- Capacitor wrap → .ipa/.aab (App Store/Play Store)
- Lembretes push via Web Notifications API
- OCR de rótulo de caneta + reconhecimento de voz para ditado de aplicação

---

Feito para **AMB FUSI AI** · *Damos vida à inovação*
