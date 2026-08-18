# Top Pickleball 50+ — Plataforma de Gestão do Atleta

> **Visão**: ser a melhor plataforma pessoal de gestão esportiva para um atleta
> de pickleball 44+ que quer chegar ao topo do ranking 50+ no Brasil em 2032.
> Não é só um diário — é um **cockpit de campeonato**.

---

## 🏗️ Arquitetura

### Stack
- **Frontend**: React 18 + Vite + TypeScript + Tailwind + shadcn-style
- **Backend**: Firebase Auth (Google) + Cloud Functions Gen 2 (Node 20) + Firestore
- **IA**: 17 provedores (provider-agnostic)
- **Deploy**: Firebase Hosting (`toppkb.web.app`) + GitHub Actions CI/CD

### Isolamento de Banco (Firestore) — NAMESPACE `toppkb_`

O projeto Firebase `antonov-82411` é compartilhado com outras plataformas
(Cofrito Acervo, SIGO/CAOCIPP Parcerias). Para garantir **isolamento total**:

1. **Todas as coleções** desta plataforma usam o prefixo `toppkb_`:
   ```
   /toppkb_users/{uid}/
     /profile, /onboarding
     /treinos/{treinoId}
     /partidas/{partidaId}
     /preparacao/{sessaoId}
     /nutricao/{refeicaoId}
     /nutricao_agua/{dia}
     /nutricao_suplementos/{dia}
     /sono/{noiteId}
     /peso/{pesagemId}
     /medidas/{medidaId}
     /dores/{dorId}
     /lesoes/{lesaoId}
     /torneios/{torneioId}
     /metas/{metaId}
     /estudos/{estudoId}
     /notas/{notaId}
     /agregados/{agregadoId}
     /chat/conversas/{conversaId}/mensagens/{msgId}
   /toppkb_agents_config/  (LLM global + por user)
   /toppkb_corpus/         (fontes de conhecimento)
   /toppkb_admin/          (admins, audit_logs, feature_flags)
   /toppkb_tournaments_public/  (catálogo público)
   /toppkb_seed/           (drills, exercícios, alimentos — read all)
   ```

2. **Firestore Rules** negam tudo que NÃO começa com `toppkb_`:
   - Default: `allow read, write: if false`
   - Somente paths `toppkb_*` têm regras específicas

3. **Cloud Functions** validam namespace:
   - Helper `assertToppkbPath()` lança erro se path inválido
   - Helper `userDoc(uid)`, `userSubCol(uid, col, id?)` padronizam paths

4. **Resultado**: o app lê/escreve/processa APENAS dados com prefixo `toppkb_`.
   Outras plataformas (Cofrito, SIGO) usam outros paths e são INVISÍVEIS.

---

## 🧩 Módulos da Plataforma

### CORE
1. **Perfil & Onboarding** — dados pessoais, objetivos, histórico médico
2. **Auth** — Google Sign-In, gestão de sessão, claims admin

### TREINOS
3. **Treinos** — registro de sessões (tipo, duração, RPE, drills, local, parceiros)
4. **Drills** — banco de 50+ drills catalogados
5. **Plano semanal** — template de treinos recorrentes
6. **Análise de treino** — gráficos de volume, intensidade, frequência

### PARTIDAS
7. **Partidas** — registro completo (placar, adversário, SWOT, vídeos)
8. **Ranking pessoal** — % vitórias, evolução
9. **Adversários** — histórico contra cada adversário

### PREPARAÇÃO FÍSICA
10. **Sessões de força** — musculação com catálogo de exercícios
11. **Mobilidade** — rotina de flexibilidade
12. **Cardio** — aeróbico
13. **Periodização** — macros/mesociclos

### NUTRIÇÃO
14. **Diário alimentar** — refeições com busca
15. **Banco de alimentos** — 200+ alimentos BR
16. **Macros & calorias** — tracking
17. **Hidratação** — controle de água
18. **Suplementação** — cronograma
19. **Plano alimentar semanal**

### SAÚDE
20. **Sono** — qualidade, duração
21. **Peso** — pesagem com média móvel
22. **Medidas** — circunferências, % gordura
23. **IMC** — cálculo automático
24. **Dores** — mapa corporal
25. **Lesões** — histórico, prevenção

### COMPETIÇÃO
26. **Torneios** — calendário, resultados
27. **Ranking** — DUPR / IN
28. **Metas** — SMART goals até 2032

### CONHECIMENTO
29. **Estudos** — artigos, vídeos
30. **Anotações** — notas livres
31. **Corpus** — base dos coaches IA

### IA & COACHING
32. **5 Coaches IA** — Treinador, Preparador, Nutricionista, Estrategista, General
33. **Chat com memória** — conversa contínua
34. **Insights diários** — push diário
35. **Análise automática** — IA detecta padrões

### DASHBOARD
36. **Visão geral** — KPIs, streaks
37. **Calendário de atividades** — heatmap
38. **Relatório semanal** — resumo automático
39. **Relatório mensal** — comparativo

### AUTOMAÇÕES
40. **Lembretes** — treino, refeição, sono
41. **Alertas** — estagnação, risco de lesão
42. **Check-in semanal** — prompt automático

### ADMIN
43. **Gestão de LLM** — provedor, fallback
44. **Gestão de agentes** — corpus, skills
45. **Gestão de usuários** — admins, roles
46. **Auditoria** — logs
47. **Feature flags** — ativar/desativar

---

## 🧪 Princípios

- **Módulos independentes** — uma feature quebrada não pode impedir outras
- **Banco isolado** — `toppkb_` namespace em TUDO
- **Feature flags** — cada feature pode ser desativada
- **Provider-agnostic** — nenhum LLM hardcoded
- **Audit logs** — ações sensíveis registradas
- **Type-safe** — TypeScript strict
- **Testes** — vitest em ambos packages
- **Lint zero** — sem warnings, sem errors
- **Calma, cautela, atenção** — NÃO PREJUDICAR NADA
