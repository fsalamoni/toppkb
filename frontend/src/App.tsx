import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Toaster } from './components/ui/toaster';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Treinos } from './pages/Treinos';
import { Partidas } from './pages/Partidas';
import { Fisio } from './pages/Fisio';
import { Nutricao } from './pages/Nutricao';
import { Sono } from './pages/Sono';
import { Peso } from './pages/Peso';
import { Dores } from './pages/Dores';
import { Torneios } from './pages/Torneios';
import { Metas } from './pages/Metas';
import { Estudos } from './pages/Estudos';
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
  if (adminOnly && !claims?.admin) return <Navigate to="/dashboard" replace />;
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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/treinos" element={<PrivateRoute><Treinos /></PrivateRoute>} />
            <Route path="/partidas" element={<PrivateRoute><Partidas /></PrivateRoute>} />
            <Route path="/fisio" element={<PrivateRoute><Fisio /></PrivateRoute>} />
            <Route path="/nutricao" element={<PrivateRoute><Nutricao /></PrivateRoute>} />
            <Route path="/sono" element={<PrivateRoute><Sono /></PrivateRoute>} />
            <Route path="/peso" element={<PrivateRoute><Peso /></PrivateRoute>} />
            <Route path="/dores" element={<PrivateRoute><Dores /></PrivateRoute>} />
            <Route path="/torneios" element={<PrivateRoute><Torneios /></PrivateRoute>} />
            <Route path="/metas" element={<PrivateRoute><Metas /></PrivateRoute>} />
            <Route path="/estudos" element={<PrivateRoute><Estudos /></PrivateRoute>} />
            <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
            <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
            <Route path="/configuracoes" element={<PrivateRoute><Configuracoes /></PrivateRoute>} />
            <Route path="/configuracoes/llm" element={<PrivateRoute><ConfiguracoesLLM /></PrivateRoute>} />
            <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />
            <Route path="/admin" element={<PrivateRoute adminOnly><AdminLayout /></PrivateRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="corpus" element={<AdminCorpus />} />
              <Route path="llm" element={<AdminLLMConfig />} />
              <Route path="agents" element={<AdminAgents />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="stats" element={<AdminStats />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<AppShell />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
