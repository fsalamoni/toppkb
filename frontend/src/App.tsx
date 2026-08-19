import { Suspense, lazy } from 'react';
import * as React from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Toaster } from './components/ui/toaster';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { InstallPWA } from './components/pwa/InstallPWA';
import { Card, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Login } from './pages/Login';
import { Landing } from './pages/Landing';
import { Loader2 } from 'lucide-react';

// Lazy load — code splitting
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Treinos = lazy(() => import('./pages/Treinos').then((m) => ({ default: m.Treinos })));
const TreinoForm = lazy(() => import('./pages/TreinoForm').then((m) => ({ default: m.TreinoForm })));
const Partidas = lazy(() => import('./pages/Partidas').then((m) => ({ default: m.Partidas })));
const PartidaForm = lazy(() => import('./pages/PartidaForm').then((m) => ({ default: m.PartidaForm })));
const Preparacao = lazy(() => import('./pages/Preparacao').then((m) => ({ default: m.Preparacao })));
const PreparacaoForm = lazy(() => import('./pages/PreparacaoForm').then((m) => ({ default: m.PreparacaoForm })));
const Nutricao = lazy(() => import('./pages/Nutricao').then((m) => ({ default: m.Nutricao })));
const NutricaoForm = lazy(() => import('./pages/NutricaoForm').then((m) => ({ default: m.NutricaoForm })));
const Sono = lazy(() => import('./pages/Sono').then((m) => ({ default: m.Sono })));
const SonoForm = lazy(() => import('./pages/SonoForm').then((m) => ({ default: m.SonoForm })));
const Peso = lazy(() => import('./pages/Peso').then((m) => ({ default: m.Peso })));
const PesoForm = lazy(() => import('./pages/PesoForm').then((m) => ({ default: m.PesoForm })));
const Dores = lazy(() => import('./pages/Dores').then((m) => ({ default: m.Dores })));
const DoresForm = lazy(() => import('./pages/DoresForm').then((m) => ({ default: m.DoresForm })));
const Torneios = lazy(() => import('./pages/Torneios').then((m) => ({ default: m.Torneios })));
const TorneiosForm = lazy(() => import('./pages/TorneiosForm').then((m) => ({ default: m.TorneiosForm })));
const Metas = lazy(() => import('./pages/Metas').then((m) => ({ default: m.Metas })));
const MetasForm = lazy(() => import('./pages/MetasForm').then((m) => ({ default: m.MetasForm })));
const Estudos = lazy(() => import('./pages/Estudos').then((m) => ({ default: m.Estudos })));
const EstudosForm = lazy(() => import('./pages/Estudos').then((m) => ({ default: m.EstudosForm })));
const Medidas = lazy(() => import('./pages/Medidas').then((m) => ({ default: m.Medidas })));
const MedidasForm = lazy(() => import('./pages/MedidasForm').then((m) => ({ default: m.MedidasForm })));
const Lesoes = lazy(() => import('./pages/Lesoes').then((m) => ({ default: m.Lesoes })));
const LesoesForm = lazy(() => import('./pages/LesoesForm').then((m) => ({ default: m.LesoesForm })));
const Suplementos = lazy(() => import('./pages/Suplementos').then((m) => ({ default: m.Suplementos })));
const SuplementosForm = lazy(() => import('./pages/SuplementosForm').then((m) => ({ default: m.SuplementosForm })));
const Hidratacao = lazy(() => import('./pages/Hidratacao').then((m) => ({ default: m.Hidratacao })));
const HidratacaoForm = lazy(() => import('./pages/HidratacaoForm').then((m) => ({ default: m.HidratacaoForm })));
const Onboarding = lazy(() => import('./pages/Onboarding').then((m) => ({ default: m.Onboarding })));
const Configuracoes = lazy(() => import('./pages/Configuracoes').then((m) => ({ default: m.Configuracoes })));
const Perfil = lazy(() => import('./pages/Perfil').then((m) => ({ default: m.Perfil })));
const ConfiguracoesLLM = lazy(() => import('./pages/ConfiguracoesLLM').then((m) => ({ default: m.ConfiguracoesLLM })));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminCorpus = lazy(() => import('./pages/admin/AdminCorpus').then((m) => ({ default: m.AdminCorpus })));
const AdminLLMConfig = lazy(() => import('./pages/admin/AdminLLMConfig').then((m) => ({ default: m.AdminLLMConfig })));
const AdminAgents = lazy(() => import('./pages/admin/AdminAgents').then((m) => ({ default: m.AdminAgents })));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers').then((m) => ({ default: m.AdminUsers })));
const AdminStats = lazy(() => import('./pages/admin/AdminStats').then((m) => ({ default: m.AdminStats })));
const ChatPage = lazy(() => import('./pages/ChatPage').then((m) => ({ default: m.default })));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60 * 1000, refetchOnWindowFocus: false } },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

// Redireciona com base no path: se é /app ou /, vai para /app/dashboard.
// Senão, vai para /app/dashboard.
function NotFoundRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  React.useEffect(() => {
    navigate('/app/dashboard', { replace: true });
  }, [navigate, location.pathname]);
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

// Versão interna para o Routes aninhado do AppShell — redireciona se user null
function NotFoundRedirectInner() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login', { replace: true });
    } else {
      navigate('/app/dashboard', { replace: true });
    }
  }, [navigate, user, loading]);
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function PrivateRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, claims, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-4">
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <Loader2 className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-sm">Sessão expirada ou não detectada</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Por favor, faça login novamente para acessar a plataforma.
                </p>
                <Button asChild size="sm" className="mt-3">
                  <a href="/login">Ir para o login</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (adminOnly && !claims?.admin) return <Navigate to="/app/dashboard" replace />;
  return <>{children}</>;
}

function AppShell() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/app/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/app/treinos" element={<PrivateRoute><Treinos /></PrivateRoute>} />
              <Route path="/app/treinos/novo" element={<PrivateRoute><TreinoForm /></PrivateRoute>} />
              <Route path="/app/treinos/:id" element={<PrivateRoute><TreinoForm /></PrivateRoute>} />
              <Route path="/app/partidas" element={<PrivateRoute><Partidas /></PrivateRoute>} />
              <Route path="/app/partidas/nova" element={<PrivateRoute><PartidaForm /></PrivateRoute>} />
              <Route path="/app/partidas/:id" element={<PrivateRoute><PartidaForm /></PrivateRoute>} />
              <Route path="/app/fisio" element={<PrivateRoute><Preparacao /></PrivateRoute>} />
              <Route path="/app/preparacao" element={<PrivateRoute><Preparacao /></PrivateRoute>} />
              <Route path="/app/preparacao/nova" element={<PrivateRoute><PreparacaoForm /></PrivateRoute>} />
              <Route path="/app/preparacao/:id" element={<PrivateRoute><PreparacaoForm /></PrivateRoute>} />
              <Route path="/app/nutricao" element={<PrivateRoute><Nutricao /></PrivateRoute>} />
              <Route path="/app/nutricao/nova" element={<PrivateRoute><NutricaoForm /></PrivateRoute>} />
              <Route path="/app/nutricao/:id" element={<PrivateRoute><NutricaoForm /></PrivateRoute>} />
              <Route path="/app/sono" element={<PrivateRoute><Sono /></PrivateRoute>} />
              <Route path="/app/sono/nova" element={<PrivateRoute><SonoForm /></PrivateRoute>} />
              <Route path="/app/sono/:id" element={<PrivateRoute><SonoForm /></PrivateRoute>} />
              <Route path="/app/peso" element={<PrivateRoute><Peso /></PrivateRoute>} />
              <Route path="/app/peso/nova" element={<PrivateRoute><PesoForm /></PrivateRoute>} />
              <Route path="/app/peso/:id" element={<PrivateRoute><PesoForm /></PrivateRoute>} />
              <Route path="/app/medidas" element={<PrivateRoute><Medidas /></PrivateRoute>} />
              <Route path="/app/medidas/nova" element={<PrivateRoute><MedidasForm /></PrivateRoute>} />
              <Route path="/app/medidas/:id" element={<PrivateRoute><MedidasForm /></PrivateRoute>} />
              <Route path="/app/dores" element={<PrivateRoute><Dores /></PrivateRoute>} />
              <Route path="/app/dores/nova" element={<PrivateRoute><DoresForm /></PrivateRoute>} />
              <Route path="/app/dores/:id" element={<PrivateRoute><DoresForm /></PrivateRoute>} />
              <Route path="/app/lesoes" element={<PrivateRoute><Lesoes /></PrivateRoute>} />
              <Route path="/app/lesoes/nova" element={<PrivateRoute><LesoesForm /></PrivateRoute>} />
              <Route path="/app/lesoes/:id" element={<PrivateRoute><LesoesForm /></PrivateRoute>} />
              <Route path="/app/suplementos" element={<PrivateRoute><Suplementos /></PrivateRoute>} />
              <Route path="/app/suplementos/novo" element={<PrivateRoute><SuplementosForm /></PrivateRoute>} />
              <Route path="/app/suplementos/:id" element={<PrivateRoute><SuplementosForm /></PrivateRoute>} />
              <Route path="/app/hidratacao" element={<PrivateRoute><Hidratacao /></PrivateRoute>} />
              <Route path="/app/hidratacao/nova" element={<PrivateRoute><HidratacaoForm /></PrivateRoute>} />
              <Route path="/app/torneios" element={<PrivateRoute><Torneios /></PrivateRoute>} />
              <Route path="/app/torneios/novo" element={<PrivateRoute><TorneiosForm /></PrivateRoute>} />
              <Route path="/app/torneios/:id" element={<PrivateRoute><TorneiosForm /></PrivateRoute>} />
              <Route path="/app/metas" element={<PrivateRoute><Metas /></PrivateRoute>} />
              <Route path="/app/metas/nova" element={<PrivateRoute><MetasForm /></PrivateRoute>} />
              <Route path="/app/metas/:id" element={<PrivateRoute><MetasForm /></PrivateRoute>} />
              <Route path="/app/estudos" element={<PrivateRoute><Estudos /></PrivateRoute>} />
              <Route path="/app/estudos/novo" element={<PrivateRoute><EstudosForm /></PrivateRoute>} />
              <Route path="/app/estudos/:id" element={<PrivateRoute><EstudosForm /></PrivateRoute>} />
              <Route path="/app/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
              <Route path="/app/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
              <Route path="/consent" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
              <Route path="/app/configuracoes" element={<PrivateRoute><Configuracoes /></PrivateRoute>} />
              <Route path="/configuracoes/llm" element={<PrivateRoute><ConfiguracoesLLM /></PrivateRoute>} />
              <Route path="/app/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />
              <Route path="/app/admin" element={<PrivateRoute adminOnly><AdminLayout /></PrivateRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="corpus" element={<AdminCorpus />} />
                <Route path="llm" element={<AdminLLMConfig />} />
                <Route path="agents" element={<AdminAgents />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="stats" element={<AdminStats />} />
              </Route>
              <Route path="*" element={<NotFoundRedirectInner />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      <Toaster />
      <InstallPWA />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/app/*" element={<AppShell />} />
          <Route path="*" element={<NotFoundRedirect />} />
        </Routes>
      </AuthProvider>
    </QueryClientProvider>
  );
}
