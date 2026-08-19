import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Toaster } from './components/ui/toaster';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { Login } from './pages/Login';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Treinos } from './pages/Treinos';
import { TreinoForm } from './pages/TreinoForm';
import { Partidas } from './pages/Partidas';
import { PartidaForm } from './pages/PartidaForm';
import { Preparacao } from './pages/Preparacao';
import { PreparacaoForm } from './pages/PreparacaoForm';
import { Nutricao } from './pages/Nutricao';
import { NutricaoForm } from './pages/NutricaoForm';
import { Sono } from './pages/Sono';
import { SonoForm } from './pages/SonoForm';
import { Peso } from './pages/Peso';
import { PesoForm } from './pages/PesoForm';
import { Dores } from './pages/Dores';
import { DoresForm } from './pages/DoresForm';
import { Torneios } from './pages/Torneios';
import { TorneiosForm } from './pages/TorneiosForm';
import { Metas } from './pages/Metas';
import { MetasForm } from './pages/MetasForm';
import { Estudos, EstudosForm } from './pages/Estudos';
import { Medidas } from './pages/Medidas';
import { MedidasForm } from './pages/MedidasForm';
import { Lesoes } from './pages/Lesoes';
import { LesoesForm } from './pages/LesoesForm';
import { Suplementos } from './pages/Suplementos';
import { SuplementosForm } from './pages/SuplementosForm';
import { Hidratacao } from './pages/Hidratacao';
import { HidratacaoForm } from './pages/HidratacaoForm';
import { Onboarding } from './pages/Onboarding';
import { Configuracoes } from './pages/Configuracoes';
import { Perfil } from './pages/Perfil';
import { ConfiguracoesLLM } from './pages/ConfiguracoesLLM';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminCorpus } from './pages/admin/AdminCorpus';
import { AdminLLMConfig } from './pages/admin/AdminLLMConfig';
import { AdminAgents } from './pages/admin/AdminAgents';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminStats } from './pages/admin/AdminStats';
import ChatPage from './pages/ChatPage';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60 * 1000, refetchOnWindowFocus: false } },
});

function PrivateRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, claims, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
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
          <Routes>
            <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
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
            <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
          </Routes>
        </main>
      </div>
      <Toaster />
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
          <Route path="*" element={<Navigate to="/app/" replace />} />
        </Routes>
      </AuthProvider>
    </QueryClientProvider>
  );
}
