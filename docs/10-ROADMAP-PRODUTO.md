# 🗺️ Roadmap de Produto — Top Pickleball 50+

> Features planejadas, priorização e timeline.

---

## MVP (v0.1.0) — 6-8 semanas

### Funcionalidades essenciais
- ✅ Login Magic Link
- ✅ Consentimento + onboarding (5 perguntas)
- ✅ Dashboard com 4 KPIs + resumo IA
- ✅ 6 tipos de registro: treino, partida, peso, dor, refeição, sono
- ✅ Chat com 5 agentes IA
- ✅ Resumo semanal automático
- ✅ Calendário de torneios
- ✅ Exportar dados (LGPD)
- ✅ Deletar conta (LGPD)
- ✅ Sentry + Cloud Logging
- ✅ Deploy produção: toppkb.web.app

---

## v0.2.0 — UX Polish (1-2 semanas após MVP)

- Notificações push (FCM) — alerta de dor, lembrete de treino
- Heatmap de calendário de treinos (estilo GitHub)
- Gráficos de evolução (peso, performance, RPE)
- Tema dark/light toggle
- Filtros avançados em todas as listas
- Atalhos de teclado

---

## v0.3.0 — Recursos Avançados (3-4 semanas)

- Upload de fotos (fisioterapia, postura, refeições)
- Análise de vídeo de jogo (upload → tags automáticas)
- Geração automática de plano de treino semanal (IA)
- Plano alimentar semanal (IA)
- Notificações inteligentes ("Você não treina há 3 dias")
- Comparação consigo mesmo mês a mês

---

## v0.4.0 — Multi-usuário (4-6 semanas)

- Coach pode ver progresso de atleta (mediante consentimento)
- Família pode acompanhar (read-only)
- Compartir rotina com parceiro de duplas
- Sistema de convite (coach ← atleta)

---

## v0.5.0 — Integrações (3-4 semanas)

- Apple Health (passos, sono, peso)
- Google Fit (passos, FC)
- Garmin / smartwatch (FC de treino)
- DUPR API (ranking oficial)
- Google Calendar (torneios)

---

## v0.6.0 — Mobile Nativo (6-8 semanas)

- PWA instalável (offline)
- React Native (iOS + Android)
- Widget de home (próximo treino, peso de hoje)
- Watch app (Apple Watch, Wear OS)

---

## v1.0.0 — Plataforma Pública (4-6 semanas)

- Outros atletas 50+ podem se cadastrar
- Marketplace de coaches
- Templates de treino (de outros atletas)
- Feed social opcional
- Planos pagos (free / pro / team)

---

## v2.0.0 — Inteligência Avançada (futuro)

- Análise de vídeo com Computer Vision
- Previsão de lesão (modelo ML)
- Simulador de cenários (perder peso em X meses)
- Assistente de voz (hands-free no treino)
- Realidade aumentada para análise de jogo

---

## Backlog de features pequenas (sempre)

- [ ] Modo offline (PWA)
- [ ] Compressão de imagens
- [ ] Atalhos de teclado
- [ ] Modo claro/escuro/auto
- [ ] Tradução EN/ES
- [ ] Compartilhar conquista (imagem)
- [ ] Backup local (JSON download)
- [ ] QR code para login no mobile
- [ ] Apple Watch app
- [ ] Comando de voz (Siri/Google Assistant)

---

## Como priorizar

1. **Bloqueador de objetivo:** atleta precisa disso pra avançar?
2. **Custo de implementação:** quanto tempo?
3. **Risco de quebrar algo:** pode introduzir bug?
4. **Engajamento:** vai ser usado diariamente?

Se (1) e (4) são altos e (2) é baixo → faz agora.
Se (1) é baixo e (2) é alto → backlog.
Se (3) é alto → fase de hardening primeiro.

---

## Próximo

[`11-PERFIL-ATLETA.md`](./11-PERFIL-ATLETA.md) — perfil completo do atleta.
