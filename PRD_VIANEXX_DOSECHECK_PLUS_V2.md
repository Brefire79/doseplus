# PRD - DoseCheck Plus v2 (Produção Vianexx)

**Produto:** DoseCheck Plus v2 (PWA de acompanhamento de tratamento com GLP-1/GIP)
**Empresa:** Vianexx
**Product Owner (responsável):** Breno (Vianexx)
**Data:** 30/05/2026
**Status:** Draft para execução

---

## 1. Resumo Executivo

O DoseCheck Plus v2 já possui uma base funcional robusta em frontend único (PWA offline-first), com foco em acompanhamento terapêutico de medicamentos para obesidade/DM2 (GLP-1/GIP), registro clínico e geração de relatório SOAP.

Este PRD define a transição do app atual para **operação de produção na Vianexx**, priorizando:
- Confiabilidade de dados e backup
- Governança clínica e compliance
- Evolução para uso profissional com menor risco operacional
- Base de métricas para crescimento do produto

---

## 2. Contexto e Diagnóstico do Estado Atual

### 2.1 O que já está forte (forças)

1. Produto funcional com escopo clínico amplo:
- Registro de aplicações, peso, medidas e diário clínico
- Biblioteca multi-medicamento (GLP-1/GIP/triplo em estudo)
- Motor de análise (adesão, resposta, platô, sarcopenia, efeitos)
- Relatório SOAP com exportação PDF

2. Boa experiência mobile e visual consistente:
- Layout responsivo e UI bem trabalhada
- Navegação por abas e fluxo de uso claro

3. PWA offline-first:
- Service Worker ativo
- Uso local sem necessidade de backend

4. Portabilidade de dados:
- Export/import JSON
- CSV e PDF para consulta
- Migração de formatos legados já implementada

### 2.2 Riscos e limitações para produção

1. Dependência exclusiva de localStorage:
- Risco de perda de dados por limpeza do navegador
- Limites de armazenamento
- Ausência de sincronização entre dispositivos

2. Arquitetura monolítica em arquivo único:
- index.html concentra HTML/CSS/JS (manutenção e evolução mais difíceis)
- Aumenta risco de regressão em mudanças

3. Ausência de autenticação e trilha de auditoria:
- Não há gestão de usuário/roles
- Não há histórico auditável de ações clínicas

4. Compliance e dados sensíveis:
- Dados clínicos pessoais armazenados localmente sem criptografia dedicada
- Necessidade de reforçar requisitos de LGPD e governança

5. Sem suíte de testes automatizados:
- Falta de validação automatizada para regressões críticas

---

## 3. Problema de Produto

Profissionais e pacientes em uso de terapias GLP-1/GIP precisam de um acompanhamento estruturado, contínuo e confiável. O app atual resolve boa parte da jornada clínica, mas ainda carece de fundamentos de produção para escalar com segurança e previsibilidade sob a operação da Vianexx.

---

## 4. Objetivos de Produto (Produção Vianexx)

### 4.1 Objetivos principais

1. Tornar o DoseCheck Plus v2 pronto para produção com segurança operacional.
2. Reduzir risco de perda de dados e elevar confiabilidade das informações clínicas.
3. Estruturar governança e conformidade para operação sob marca Vianexx.
4. Preparar base técnica para evolução para sync multi-dispositivo e gestão profissional.

### 4.2 Objetivos de negócio

1. Aumentar retenção de uso semanal.
2. Melhorar qualidade percebida de relatórios para uso clínico.
3. Criar trilha para versão premium/profissional (clínicas e prescritores).

---

## 5. Personas

1. Paciente em tratamento:
- Registra aplicação, peso, sintomas e progresso.
- Precisa de lembretes, histórico e clareza na evolução.

2. Profissional de saúde (médico/nutrólogo/endócrino):
- Precisa de dados organizados para decisão clínica.
- Valoriza relatório objetivo e confiável.

3. Operação Vianexx (Breno):
- Precisa de produto estável em produção, com roadmap claro.
- Precisa de risco controlado para expansão.

---

## 6. Escopo

### 6.1 Em escopo (Fase de Produção v2.x)

1. Hardening da versão atual (sem reescrever tudo):
- Revisão de fluxos críticos
- Correções de confiabilidade
- Ajustes de branding para Vianexx

2. Dados e segurança básica:
- Estratégia de backup mais forte
- Plano de migração localStorage -> IndexedDB
- Políticas mínimas de privacidade e consentimento

3. Governança clínica:
- Reforço de disclaimers e limites de uso
- Padronização de textos de orientação

4. Qualidade:
- Definição de testes manuais críticos
- Primeira camada de testes automatizados (mínimo viável)

### 6.2 Fora de escopo imediato

1. Backend completo com prontuário em nuvem multi-tenant
2. Integração com sistemas hospitalares (TISS/HL7/FHIR)
3. Prescrição eletrônica integrada
4. App nativo completo separado (iOS/Android)

---

## 7. Requisitos Funcionais

### RF-01: Cadastro e Configuração
- Permitir configurar perfil clínico e parâmetros iniciais.
- Persistir dados localmente com consistência.

### RF-02: Registro de Aplicações
- Registrar dose, data/hora, local e observações.
- Suportar múltiplos medicamentos com escala específica.

### RF-03: Evolução Clínica
- Registrar peso, medidas e diário de sintomas.
- Exibir gráficos de evolução.

### RF-04: Análise Clínica
- Gerar indicadores: adesão, resposta, platô, risco de sarcopenia e efeitos.
- Exibir recomendação educacional de dose conforme contexto.

### RF-05: Relatório SOAP
- Gerar relatório estruturado para consulta clínica.
- Exportar em PDF com identidade visual profissional.

### RF-06: Backup/Restore
- Exportar e importar backup completo.
- Permitir mescla e substituição com proteção contra duplicidade por ID.

### RF-07: Operação Offline
- Funcionar sem internet para os principais fluxos de registro e consulta.

---

## 8. Requisitos Não Funcionais

### RNF-01: Segurança e Privacidade
- Adequação mínima LGPD para dados sensíveis.
- Transparência de uso e limitação de responsabilidade clínica.

### RNF-02: Performance
- Carregamento inicial rápido em dispositivos móveis medianos.
- Interações de registro sem travamentos perceptíveis.

### RNF-03: Confiabilidade
- Zero perda de dados em fluxos normais.
- Recuperação clara em cenários de importação inválida.

### RNF-04: Manutenibilidade
- Iniciar plano de modularização progressiva do arquivo único.

### RNF-05: Compatibilidade
- Suporte consistente aos navegadores móveis modernos (Android/iOS).

---

## 9. Métricas de Sucesso (KPIs)

1. Ativação:
- % usuários que registram 1ª aplicação em até 24h

2. Engajamento:
- WAU/MAU
- Média de registros por usuário ativo/semana

3. Retenção:
- Retenção D7 e D30

4. Confiabilidade:
- % sessões sem erro crítico
- % importações bem-sucedidas

5. Valor clínico percebido:
- % usuários que exportam relatório SOAP
- NPS/CSAT (quando coleta for habilitada)

---

## 10. Roadmap Recomendado

## Fase 0 (0-2 semanas) - Preparação de Produção
1. Ajustar branding oficial Vianexx e textos institucionais.
2. Revisar fluxo de backup/importação com checklist de QA.
3. Publicar política de privacidade e termo de uso simplificado.
4. Definir baseline de métricas e eventos essenciais.

## Fase 1 (2-6 semanas) - Confiabilidade e Qualidade
1. Implementar camada de persistência em IndexedDB com migração segura.
2. Criar suíte mínima de testes para fluxos críticos.
3. Separar módulos iniciais (dados, análises, export) para reduzir acoplamento.
4. Hardening do Service Worker e estratégia de atualização.

## Fase 2 (6-12 semanas) - Escala Controlada
1. Piloto com grupo real monitorado pela Vianexx.
2. Coleta de métricas e ajustes de UX com base no uso.
3. Definição de arquitetura de sync opcional (ex.: Firebase/Backend próprio).
4. Planejamento da versão profissional multiusuário.

---

## 11. Critérios de Aceite (Go-Live Produção Vianexx)

1. Fluxos críticos funcionando sem falhas graves:
- cadastro
- nova aplicação
- registro de peso/medidas
- relatório SOAP
- backup/export/import

2. Documentação mínima publicada:
- termo de uso
- política de privacidade
- limitações clínicas explícitas

3. Qualidade validada:
- checklist de QA concluído
- regressão dos principais cenários aprovada

4. Operação pronta:
- responsável definido (Breno)
- rotina de versionamento e release definida
- plano de rollback documentado

---

## 12. Dependências

1. Definição jurídica/compliance Vianexx para textos finais de LGPD e isenção clínica.
2. Decisão técnica sobre estratégia de persistência (IndexedDB primeiro, nuvem depois).
3. Disponibilidade de tempo de produto/engenharia para modularização progressiva.

---

## 13. Riscos do Projeto e Mitigação

1. Risco: perda de dados por storage local
- Mitigação: IndexedDB + incentivo de backup recorrente + futura sincronização

2. Risco: regressão por arquivo monolítico
- Mitigação: testes críticos + modularização incremental por domínio

3. Risco: interpretação clínica indevida das recomendações
- Mitigação: disclaimers fortes + linguagem educacional + validação de conteúdo

4. Risco: baixa adesão após lançamento
- Mitigação: onboarding mais simples + lembretes + iteração por métricas

---

## 14. Plano de Entrega e Governança

1. Cadência sugerida:
- Sprint semanal de produto/tech
- Revisão quinzenal de métricas com Breno (Vianexx)

2. Rituais mínimos:
- Planejamento semanal
- Demo interna
- Post-mortem de incidentes (quando houver)

3. Responsável final:
- **Breno (Vianexx)** como owner de priorização, aceite e release

---

## 15. Próxima Decisão Executiva (imediata)

Escolher a estratégia da Fase 1:

1. Caminho A (rápido): hardening + QA + branding, mantendo arquitetura atual no curto prazo.
2. Caminho B (estruturado): hardening + início da modularização + IndexedDB já no primeiro ciclo.

Recomendação: **Caminho B** para reduzir risco de crescimento e retrabalho.
