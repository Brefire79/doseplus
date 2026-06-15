# PRD — DoseCheck Plus v2: Hardening de Segurança + Camada de Dados

**Produto:** DoseCheck Plus v2 (PWA GLP-1/GIP, produção Vianexx)
**Épico:** Segurança, integridade de dados e conformidade LGPD
**Product Owner:** Breno (Vianexx)
**Data:** 14/06/2026
**Status:** Draft para execução
**Documento irmão:** [PRD de produto](PRD_VIANEXX_DOSECHECK_PLUS_V2.md) · [Prompt de execução](PROMPT-glp-monitor-hardening-v2.md)

---

## 1. Resumo Executivo

O DoseCheck Plus v2 é um PWA médico single-file (Vanilla JS, offline-first) que acompanha tratamento com agonistas GLP-1/GIP. A base funcional é sólida, mas a camada de **segurança e persistência** ainda é frágil para uso com dados de saúde reais:

- Dados do usuário entram em `innerHTML` sem escape → **XSS armazenado**.
- Dependências CDN sem **CSP** nem **SRI** → superfície de supply-chain.
- Persistência só em `localStorage` → **evictável** (iOS apaga após 7 dias) e síncrona.
- Migração de schema **ad-hoc**, sem backup nem versionamento.
- Dados clínicos **em claro** no dispositivo e **na URL** ao compartilhar (LGPD art. 11).

Este épico endereça os cinco pontos sem alterar design, motor clínico ou stack.

## 2. Objetivos e Métricas de Sucesso

| Objetivo | Métrica | Meta |
|---|---|---|
| Eliminar XSS | Payloads de teto em todos os campos | 0 execuções |
| Reduzir superfície CDN | CSP ativa + SRI nos 3 scripts | 100% |
| Durabilidade dos dados | `navigator.storage.persist()` + IndexedDB primário | Concedido quando suportado |
| Zero perda em migração | Fixtures v1/v2/v3 → v4 | 100% íntegros |
| Conformidade LGPD em repouso | Cifragem opt-in AES-GCM 256 | PIN → storage ilegível |
| Cobertura de teste | `node test.js` | 100% verde |

## 3. Escopo

### 3.1 Dentro do escopo
Tarefas 1–8 do [prompt de execução](PROMPT-glp-monitor-hardening-v2.md):
1. Eliminação de XSS (`esc()` + validação de ranges)
2. CSP + SRI + fallback de CDN
3. Camada `Store` (IndexedDB primário + espelho localStorage + debounce)
4. Migração versionada (`SCHEMA_VERSION`, backup pré-migração, modo somente-leitura em falha)
5. Criptografia opcional em repouso (PIN, PBKDF2 ≥ 310k, AES-GCM 256)
6. Compartilhamento seguro (sem dados na URL, Web Share API com PDF)
7. Integridade de backup/export (envelope + checksum SHA-256)
8. Service Worker stale-while-revalidate + aviso de atualização

### 3.2 Fora do escopo (fase futura)
- Backend, login, sync remoto (Firebase) — `Store` deve apenas deixar interface plugável.
- Troca de bibliotecas ou versões além do necessário para SRI.
- Qualquer alteração em `analyzeCase`, `DRUGS` ou textos médicos/referências.
- Redesign visual (paleta teal/dourado, Fraunces + Inter Tight permanecem).

## 4. Requisitos Não-Funcionais (invioláveis)

- **Single-file** `index.html` — sem bundler, npm ou framework.
- **Vanilla JS** ES2020+, sem TypeScript.
- **Offline-first** — funcional 100% sem rede após primeiro load.
- **Compatibilidade de dados** — histórico em `glp_monitor_v3`, `tg_monitor_v1/v2` migra sem perda.
- **Diffs revisáveis** — sem reformatação/minificação em massa.

## 5. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Reescrita monolítica trunca/entrega parcial | Alto | **Execução fatiada em 3 lotes (A→B→C)**, cada um com Definição de Pronto e testes próprios |
| Hash SRI inventado quebra carregamento | Alto | **Patch A**: placeholder + comando de geração; nunca estimar |
| CSP bloqueia geração de PDF / Web Share | Médio | **Patch B**: validar manualmente, adicionar só a diretiva mínima documentada |
| Migração corrompe dado cifrado | Alto | **Patch C**: ordem desbloquear→migrar→recifrar; falha mantém blob original |
| Escrita dupla falha no meio → estado híbrido | Alto | **Patch D**: teste de rollback; IndexedDB como fonte da verdade |
| PIN esquecido → perda total | Médio | Sem recuperação por design; UI avisa + lembrete de export |

## 6. Estado Atual vs. Alvo (verificado no código)

| Item | Atual | Alvo |
|---|---|---|
| Escape de HTML | ausente | `esc()` em todo interpolado |
| CSP | ausente | meta restritiva |
| SRI | ausente | sha384 + crossorigin nos 3 CDNs |
| Persistência | `localStorage` (`glp_monitor_v3`) | IndexedDB `glp_monitor` + espelho |
| Migração | ad-hoc em `loadState()` | `MIGRATIONS` versionado + backup |
| Cifragem | nenhuma (plaintext) | AES-GCM 256 opt-in |
| Cache SW | `dosecheck-v2.3` | `dosecheck-v2.4` SWR |

## 7. Definição de Pronto

Espelha o checklist do [prompt](PROMPT-glp-monitor-hardening-v2.md#definição-de-pronto). Entrega aceita quando todos os itens estão marcados e `node test.js` passa 100%.
