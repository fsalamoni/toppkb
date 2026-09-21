/**
 * Breadcrumbs — navegação hierárquica consistente em todo o app.
 *
 * Mostra o caminho atual e permite voltar para níveis anteriores.
 * Lê automaticamente da URL (useLocation) e mapeia rotas para labels amigáveis.
 */
import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mapa de paths → labels. Use `null` para esconder um segmento (ex: IDs numéricos).
// Use `dynamic` para segmentos variáveis como :id.
const PATH_LABELS: Record<string, string | null | 'dynamic'> = {
  '': 'Início',
  app: 'App',
  dashboard: 'Dashboard',
  treinos: 'Treinos',
  novo: 'Novo',
  partidas: 'Partidas',
  preparacao: 'Preparação',
  nutricao: 'Alimentação',
  sono: 'Sono',
  peso: 'Peso',
  medidas: 'Medidas',
  dores: 'Dores',
  lesoes: 'Lesões',
  suplementos: 'Suplementos',
  hidratacao: 'Hidratação',
  torneios: 'Torneios',
  metas: 'Metas',
  estudos: 'Estudos',
  chat: 'Chat',
  onboarding: 'Onboarding',
  consent: 'Consentimento',
  configuracoes: 'Configurações',
  perfil: 'Perfil',
  notificacoes: 'Notificações',
  // Treinamento
  treinamento: 'Treinamento',
  'meu-programa': 'Meu Programa',
  calendario: 'Calendário',
  sessoes: 'Sessões',
  planos: 'Planos',
  progresso: 'Progresso',
  heatmap: 'Consistência',
  prs: 'Personal Records',
  achievements: 'Achievements',
  templates: 'Templates',
  avaliacoes: 'Avaliações',
  notas: 'Notas',
  composicao: 'Composição Corporal',
  recuperacao: 'Recuperação',
  config: 'Configurações',
  exercicios: 'Biblioteca',
  periodizacao: 'Periodização',
  // Admin
  admin: 'Admin',
  corpus: 'Corpus',
  llm: 'LLM',
  agents: 'Agentes',
  users: 'Usuários',
  stats: 'Estatísticas',
  documentos: 'Documentos',
};

function getLabel(segment: string, params: Record<string, string | undefined>): string {
  // Substitui :id por um nome mais amigável
  if (params[segment]) return params[segment]!;
  if (params.id === segment) return `#${segment.slice(0, 6)}`;
  const mapped = PATH_LABELS[segment];
  if (mapped === 'dynamic') return segment;
  if (mapped === null) return '';
  return mapped ?? segment;
}

interface BreadcrumbsProps {
  className?: string;
  /** Lista custom de crumbs. Se omitido, gera automaticamente da URL. */
  items?: Array<{ label: string; to?: string }>;
  /** Esconder o segmento raiz (Home) */
  hideRoot?: boolean;
}

export function Breadcrumbs({ className, items, hideRoot = false }: BreadcrumbsProps) {
  const location = useLocation();
  const params = useParams();

  const crumbs = items ?? generateCrumbs(location.pathname, params, hideRoot);

  if (crumbs.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'flex items-center text-xs text-muted-foreground mb-4',
        'overflow-x-auto whitespace-nowrap scrollbar-thin',
        className,
      )}
    >
      <ol className="flex items-center gap-1">
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 flex-shrink-0 opacity-50" />}
              {c.to && !isLast ? (
                <Link
                  to={c.to}
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  {i === 0 && <Home className="h-3 w-3" />}
                  {c.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    'font-medium',
                    isLast ? 'text-foreground' : '',
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {i === 0 && <Home className="h-3 w-3 inline mr-1" />}
                  {c.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function generateCrumbs(
  pathname: string,
  params: Record<string, string | undefined>,
  hideRoot: boolean,
): Array<{ label: string; to?: string }> {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return [];

  const crumbs: Array<{ label: string; to?: string }> = [];

  // Não mostra o "Home" se for a única rota
  if (!hideRoot) {
    crumbs.push({ label: 'Início', to: '/app/dashboard' });
  }

  let acc = '';
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    // Pula o segmento inicial "app" — ele é só parte do "namespace" do shell
    if (i === 0 && seg === 'app') {
      acc += `/${seg}`;
      continue;
    }

    acc += `/${seg}`;

    // Esconde segmentos que são IDs (Firestore IDs são tipicamente hex/base36 de 20+ chars)
    const isLast = i === segments.length - 1;
    const isId = /^[a-zA-Z0-9_-]{14,}$/.test(seg) && isLast;

    const label = isId ? 'Detalhes' : getLabel(seg, params);
    if (label) {
      crumbs.push({
        label,
        to: isLast ? undefined : acc,
      });
    }
  }

  return crumbs;
}
