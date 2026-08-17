# FAQ Institucional — Top Pickleball 50+

## O que é o Top Pickleball 50+?

Um aplicativo pessoal de gestão esportiva para um atleta de 44 anos cujo objetivo é ser o **nº 1 do Brasil na categoria 50+** em 2032. Ele é usado pelo próprio atleta (uso pessoal) e pode servir de template para outros atletas.

## Quem pode usar?

Inicialmente, **apenas o dono da conta** (uso pessoal). A infraestrutura é multi-usuário (Firestore rules isolam dados por usuário), mas a interface é single-tenant.

## Como funciona o sistema multi-agente?

Existem 5 agentes LLM especializados:

- 🏓 **Treinador**: técnica, tática, fundamentos
- 💪 **Preparador**: físico, lesão, periodização
- 🥗 **Nutricionista**: dieta, suplementação, composição
- 🧠 **Estrategista**: metas, torneios, calendário
- 🤖 **General**: orientação geral no app

Você pode:
- Escolher o agente manualmente
- Deixar o sistema detectar automaticamente (router por keywords)

## Como funciona a LLM?

O sistema usa uma **hierarquia de 4 níveis**:

1. **Config específica do agente** (ex: o admin define o Treinador com GPT-4o, o Nutricionista com Claude, o Estrategista com Google AI, etc)
2. **Config pessoal do usuário** (sobrescreve a do agente)
3. **Config global do admin** (sobrescreve tudo se ativo)
4. **Nenhum fallback hardcoded** — se ninguém configurou, o agente retorna mensagem amigável pedindo setup

17 providers são suportados: Google AI, OpenAI, Anthropic, OpenRouter, DeepSeek, Kimi, Qwen, Groq, NVIDIA, Mistral, xAI, Cohere, Together, Fireworks, Perplexity, Ollama, Custom.

**Importante**: o sistema é 100% provider-agnostic. Nenhum LLM é sugerido como padrão. O admin master ou o usuário escolhem qual usar. Sem configuração, os agentes não respondem (em vez de assumir um LLM qualquer).

## Como meus dados são protegidos?

- **Isolamento total**: cada usuário só vê seus próprios dados (Firestore Rules validam `request.auth.uid`)
- **apiKey segura**: chaves de API ficam no Firestore com regras restritivas, nunca são expostas ao frontend (sempre mascaradas como `sk-1••••cdef`)
- **PII filter**: antes de enviar mensagens ao LLM, dados sensíveis (CPF, e-mail, telefone) são anonimizados
- **LGPD completo**: você pode exportar tudo ou deletar sua conta a qualquer momento
- **Audit log**: ações sensíveis (promover admin, deletar conta) são registradas

## Posso usar meu próprio modelo LLM?

Sim! Vá em **Configurações → Meu LLM Pessoal** e adicione sua chave. Você pode usar qualquer um dos 17 providers.

## O que é o corpus (RAG)?

O sistema usa busca semântica (embeddings) sobre documentos de pickleball indexados. Quando você faz uma pergunta, os 5 trechos mais relevantes do corpus são injetados no contexto do LLM, melhorando muito a qualidade das respostas.

## Posso adicionar meus próprios documentos?

Sim, se você for admin master. Vá em **Admin → Corpus → Upload**.

## O sistema tem versão mobile?

Ainda não (Fase 2). Atualmente é PWA (Progressive Web App) — funciona em qualquer navegador mobile, pode ser instalado como app.

## Quanto custa?

Depende de quanto você usar:
- **Firebase Spark (free)**: até certo volume
- **Firebase Blaze (pay-as-you-go)**: ~R$ 50-200/mês para uso pessoal intenso
- **LLM API**: depende do provider que você escolheu. Google AI tem free tier generoso; OpenAI/Claude são ~R$ 0.10-1.00 por conversa longa; Ollama (local) é grátis. Você escolhe.

## Como faço backup?

O Firestore (Blaze) tem backup automático diário configurável. Vá em Console Firebase → Firestore → Backups.

## Posso rodar offline?

Sim, em modo leitura (PWA com service worker). Escrever dados requer conexão.

## O sistema assume um LLM padrão?

**Não.** Este projeto é provider-agnostic. Nenhum LLM é hardcoded como padrão. Se ninguém (admin master ou você) configurar uma chave, os agentes retornam uma mensagem amigável pedindo setup. Você tem controle total sobre:
- Qual provedor usar (17 opções)
- Qual modelo dentro do provedor
- Onde guardar a chave (Firestore seguro)
- Quem pode usar qual (config por agente, por usuário ou global)

## Como o primeiro usuário vira admin?

O trigger `onUserCreated` checa se já existe algum `admin master`. Se não existir, **o novo user é promovido automaticamente** a master.

## Como promover outros admins?

**Admin → Usuários → Adicionar admin** (cole o e-mail). O usuário precisa já ter conta.

## Como customizar os agentes?

**Admin → Agents** — você pode:
- Habilitar/desabilitar cada agente
- Trocar o modelo LLM
- Editar as skills (instruções customizadas)

## Como funciona a privacidade do chat?

- Mensagens são salvas no Firestore com isolamento por usuário
- Antes de enviar ao LLM, PII é anonimizado (e-mail → `[EMAIL]`, CPF → `[CPF]`, etc)
- Você pode deletar conversas individualmente ou toda a conta
- Audit log registra ações sensíveis

## Onde fica hospedado?

Firebase (Google Cloud) — região `southamerica-east1` (São Paulo) para latência baixa no Brasil.

## Tem CI/CD?

Sim:
- **PR/push** → CI roda lint + typecheck + tests
- **Push em develop** → Deploy automático em ambiente dev
- **Push em main** → Deploy manual (com aprovação)
