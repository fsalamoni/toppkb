import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Apple,
  Award,
  BarChart3,
  Brain,
  Calendar,
  Dumbbell,
  Heart,
  MessageSquare,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: Activity,
    title: 'Gestão de Treinos',
    description:
      'Registre cada sessão, analise carga, volume e intensidade. Veja sua evolução em gráficos claros e descubra onde melhorar.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Trophy,
    title: 'Controle de Partidas',
    description:
      'Anote placar, adversários, pontos fortes e fracos. Construa histórico estratégico para evoluir em cada confronto.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Apple,
    title: 'Nutrição Inteligente',
    description:
      'Diário alimentar, hidratação e suplementação. Macros calculados para performance e longevidade no esporte.',
    color: 'from-orange-500 to-rose-500',
  },
  {
    icon: Dumbbell,
    title: 'Preparação Física',
    description:
      'Força, mobilidade, prevenção de lesões. Plano focado em atletas 40+ que precisam chegar aos 50+ voando.',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    icon: Brain,
    title: '5 Coaches com IA',
    description:
      'Treinador, Preparador, Nutricionista, Estrategista e General. Cada um com corpus técnico e análises sob medida.',
    color: 'from-purple-500 to-fuchsia-500',
  },
  {
    icon: BarChart3,
    title: 'Dashboards e Tendências',
    description:
      'Sono, peso, dores, humor, performance. Tudo conectado para você enxergar padrões e tomar decisões melhores.',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: MessageSquare,
    title: 'Chat com seus Coaches',
    description:
      'Pergunte, reflita, receba orientações. Os coaches conhecem seu histórico e aprendem com seu contexto.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Target,
    title: 'Torneios e Metas',
    description:
      'Calendário de torneios, planejamento de provas, objetivos anuais. Acompanhe o caminho até 2032.',
    color: 'from-red-500 to-orange-500',
  },
];

const stats = [
  { label: 'Áreas de gestão', value: '8+' },
  { label: 'Coaches IA', value: '5' },
  { label: 'Fontes de dados', value: '100%' },
  { label: 'Foco em 50+', value: 'até 2032' },
];

const audiences = [
  {
    icon: Users,
    title: 'Para iniciantes sérios',
    text: 'Quer começar com método? Construa base sólida desde o primeiro treino.',
  },
  {
    icon: Activity,
    title: 'Para intermediários',
    text: 'Já joga, mas quer subir de nível? Encontre os gargalos e quebre plateau.',
  },
  {
    icon: Trophy,
    title: 'Para competidores',
    text: 'Sonha em ser o melhor 50+ do Brasil? Aqui é seu cockpit de campeonato.',
  },
];

export function Landing() {
  const { user, userDoc, loading } = useAuth();
  const navigate = useNavigate();

  // Se já está logado, manda pro app
  useEffect(() => {
    if (loading) return;
    if (!user) return;
    // IMPORTANTE: verificar consent ANTES de tudo (LGPD)
    // userDoc.consent pode ser `true` ou um objeto { acceptedAt, version, ip }
    const hasConsent = userDoc?.consent === true || (userDoc?.consent && typeof userDoc.consent === 'object');
    if (!hasConsent) {
      navigate('/app/consent', { replace: true });
      return;
    }
    if (!userDoc?.onboardingComplete) {
      navigate('/app/onboarding', { replace: true });
      return;
    }
    navigate('/app/dashboard', { replace: true });
  }, [user, userDoc, loading, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/app/" className="flex items-center gap-2 font-semibold">
            <span className="text-2xl">🏓</span>
            <span>Top Pickleball 50+</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Funcionalidades</a>
            <a href="#coaches" className="hover:text-foreground transition">Coaches IA</a>
            <a href="#metodo" className="hover:text-foreground transition">Método</a>
          </nav>
          <Button asChild size="sm">
            <Link to="/login">Entrar</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-background to-amber-500/10" />
          <div
            className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[120%] h-[60%] rounded-full blur-3xl opacity-30"
            style={{
              background:
                'radial-gradient(closest-side, rgba(16,185,129,0.4), rgba(245,158,11,0.2), transparent)',
            }}
          />
        </div>
        <div className="container py-20 md:py-28 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Beta aberto · Plano até 2032
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Sua jornada para ser
              <span className="block bg-gradient-to-r from-emerald-500 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                o melhor 50+ do Brasil
              </span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
              Uma plataforma completa de gestão esportiva para atletas de pickleball
              que não aceitam envelhecer no banco. Treinos, partidas, nutrição,
              preparação física, sono, dores e coaches com IA — tudo num só lugar.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="text-base">
                <Link to="/login">
                  <Zap className="mr-2 h-4 w-4" />
                  Começar agora
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base">
                <a href="#features">Ver funcionalidades</a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Login com Google · Sem cartão · Configuração em 5 minutos
            </p>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-border/60 bg-card/50 p-4 text-center backdrop-blur"
              >
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-br from-emerald-500 to-amber-500 bg-clip-text text-transparent">
                  {s.value}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-20 md:py-24">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Tudo que você precisa para evoluir
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            8 áreas de gestão integradas, pensadas para o atleta de pickleball
            que leva o jogo a sério — em qualquer idade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative rounded-xl border border-border/60 bg-card p-6 transition hover:border-border hover:shadow-lg"
              >
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${f.color} text-white mb-4`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Coaches IA */}
      <section id="coaches" className="bg-muted/30 py-20 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 mb-4">
              <Brain className="h-3.5 w-3.5" />
              5 Coaches com IA
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Um time inteiro de especialistas na sua mão
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Cada coach tem um corpus técnico próprio, estilo de conversa e foco.
              Configure seu provedor de IA favorito e converse com eles quando quiser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { name: 'Treinador', focus: 'Técnica, tática, drills', color: 'from-emerald-500 to-teal-500', emoji: '🏓' },
              { name: 'Preparador', focus: 'Força, mobilidade, lesões', color: 'from-blue-500 to-indigo-500', emoji: '💪' },
              { name: 'Nutricionista', focus: 'Dieta, macros, suplementação', color: 'from-orange-500 to-rose-500', emoji: '🥗' },
              { name: 'Estrategista', focus: 'Jogos, adversários, torneios', color: 'from-purple-500 to-fuchsia-500', emoji: '🧠' },
              { name: 'General', focus: 'Visão holística, mindset', color: 'from-slate-500 to-zinc-500', emoji: '🤖' },
            ].map((c) => (
              <div
                key={c.name}
                className="rounded-xl border border-border/60 bg-card p-5 text-center"
              >
                <div
                  className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${c.color} text-2xl`}
                >
                  {c.emoji}
                </div>
                <h3 className="font-semibold">{c.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{c.focus}</p>
              </div>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-muted-foreground">
            Suporte a 17 provedores de IA: Google AI, OpenAI, Anthropic, OpenRouter,
            DeepSeek, Kimi, Qwen, Groq, NVIDIA, Mistral, xAI, Cohere, Together,
            Fireworks, Perplexity, Ollama, Custom.
          </p>
        </div>
      </section>

      {/* Método / Para quem é */}
      <section id="metodo" className="container py-20 md:py-24">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Para quem é a plataforma
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Se você leva o pickleball a sério e quer tratar seu desenvolvimento
            como um atleta — você tem lugar aqui.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {audiences.map((a) => {
            const Icon = a.icon;
            return (
              <div
                key={a.title}
                className="rounded-xl border border-border/60 bg-card p-6 text-center"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">{a.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{a.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Roadmap */}
      <section className="bg-muted/30 py-20 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 mb-4">
              <Calendar className="h-3.5 w-3.5" />
              Roadmap
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              A jornada até 2032
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Marcos anuais para acompanhar a evolução. Você define a meta,
              a plataforma te ajuda a chegar lá.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {[
              { year: '2026', label: 'Fundação', sub: 'Base técnica + dados' },
              { year: '2027', label: 'Consistência', sub: 'Ranking estadual' },
              { year: '2028', label: 'Competição', sub: 'Ranking nacional' },
              { year: '2032', label: 'Top 50+', sub: 'Melhor do Brasil 🎯' },
            ].map((m) => (
              <div
                key={m.year}
                className="rounded-xl border border-border/60 bg-card p-4 text-center"
              >
                <div className="text-2xl font-bold text-foreground">{m.year}</div>
                <div className="text-sm font-semibold mt-1 text-emerald-600 dark:text-emerald-400">
                  {m.label}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{m.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container py-20 md:py-24">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-500/10 via-amber-500/5 to-orange-500/10 p-10 md:p-14 text-center">
          <Heart className="mx-auto h-10 w-10 text-emerald-500 mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Pronto para tratar seu pickleball como esporte?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Entre com sua conta Google, configure sua IA favorita em 1 minuto
            e comece a registrar sua jornada. Você não vai envelhecer no banco.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="text-base">
              <Link to="/login">
                <Zap className="mr-2 h-4 w-4" />
                Entrar com Google
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏓</span>
            <span>Top Pickleball 50+</span>
          </div>
          <div className="flex items-center gap-4">
            <Award className="h-4 w-4" />
            <span>Plano até 2032 · Ser o melhor 50+ do Brasil</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
