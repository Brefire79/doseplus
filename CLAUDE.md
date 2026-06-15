# CLAUDE.md

As regras de trabalho deste repositório vivem em **[AGENTS.md](AGENTS.md)** (padrão aberto). Leia-o antes de qualquer mudança — ele cobre stack, arquitetura, restrições invioláveis e o épico de segurança ativo.

## Atalhos específicos do Claude Code

- **App inteiro = `index.html`** (single-file, Vanilla JS inline). Edições cirúrgicas, sem reformatação em massa.
- **Não toque** em `analyzeCase()`, `DRUGS` ou textos clínicos sem pedido explícito.
- **Antes de declarar pronto:** rode `node test.js` (deve passar 100%) e cheque a Definição de Pronto em [PRD_HARDENING_DOSECHECK_PLUS_V2.md](PRD_HARDENING_DOSECHECK_PLUS_V2.md).
- **Mexeu no `sw.js`?** Bump do cache (`dosecheck-v2.3` → próxima) e atualize o `CHANGELOG.md`.

## Documentos do projeto

- [AGENTS.md](AGENTS.md) — regras canônicas para agentes.
- [PRD_VIANEXX_DOSECHECK_PLUS_V2.md](PRD_VIANEXX_DOSECHECK_PLUS_V2.md) — PRD de produto.
- [PRD_HARDENING_DOSECHECK_PLUS_V2.md](PRD_HARDENING_DOSECHECK_PLUS_V2.md) — PRD do épico de segurança.
- [PROMPT-glp-monitor-hardening-v2.md](PROMPT-glp-monitor-hardening-v2.md) — prompt de execução do hardening.
