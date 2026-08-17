import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppShell } from '@/components/layout/AppShell';
import { Login } from '@/pages/Login';
import { Consent } from '@/pages/Consent';
import { Onboarding } from '@/pages/Onboarding';
import { Dashboard } from '@/pages/Dashboard';
import { TreinosList } from '@/pages/TreinosList';
import { TreinoForm } from '@/pages/TreinoForm';
import { PartidasList } from '@/pages/PartidasList';
import { PartidaForm } from '@/pages/PartidaForm';
import { PesoList } from '@/pages/PesoList';
import { DoresList } from '@/pages/DoresList';
import { RefeicoesList } from '@/pages/RefeicoesList';
import { SonoList } from '@/pages/SonoList';
import { TorneiosList } from '@/pages/TorneiosList';
import { Metricas } from '@/pages/Metricas';
import { AvaliacaoForm } from '@/pages/AvaliacaoForm';
import { Chat } from '@/pages/Chat';
import { Configuracoes } from '@/pages/Configuracoes';
import { PerfilEdit } from '@/pages/PerfilEdit';
import { LLMConfig } from '@/pages/LLMConfig';
import { AdminLLMConfig } from '@/pages/AdminLLMConfig';
import { Fisio } from '@/pages/Fisio';
import { Forca } from '@/pages/Forca';
import { Mobilidade } from '@/pages/Mobilidade';
import { Cardio } from '@/pages/Cardio';
import { Suplementos } from '@/pages/Suplementos';
import { Agua } from '@/pages/Agua';
import { Medidas } from '@/pages/Medidas';
import { Estudos } from '@/pages/Estudos';
import { Metas } from '@/pages/Metas';
import { NotFound } from '@/pages/NotFound';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { Toaster } from '@/components/ui/toaster';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const { userDoc, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!userDoc) return <Navigate to="/login" replace />;
  if (!userDoc.consent) return <Navigate to="/consent" replace />;
  if (!userDoc.onboardingComplete) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/auth/verify" element={<Login />} />

        {/* Onboarding (com auth, sem onboarding completo) */}
        <Route
          path="/consent"
          element={
            <RequireAuth>
              <Consent />
            </RequireAuth>
          }
        />
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <Onboarding />
            </RequireAuth>
          }
        />

        {/* Privadas (com auth + consent + onboarding) */}
        <Route
          element={
            <RequireAuth>
              <RequireOnboarding>
                <AppShell />
              </RequireOnboarding>
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />

          {/* 🏓 Pickleball */}
          <Route path="/treinos" element={<TreinosList />} />
          <Route path="/treinos/novo" element={<TreinoForm />} />
          <Route path="/partidas" element={<PartidasList />} />
          <Route path="/partidas/nova" element={<PartidaForm />} />
          <Route path="/estudos" element={<Estudos />} />

          {/* 💪 Preparação Física */}
          <Route path="/fisico/fisio" element={<Fisio />} />
          <Route path="/fisico/forca" element={<Forca />} />
          <Route path="/fisico/mobilidade" element={<Mobilidade />} />
          <Route path="/fisico/cardio" element={<Cardio />} />

          {/* 🥗 Alimentação */}
          <Route path="/alimentacao/refeicoes" element={<RefeicoesList />} />
          <Route path="/alimentacao/agua" element={<Agua />} />
          <Route path="/alimentacao/suplementos" element={<Suplementos />} />

          {/* 🩹 Saúde */}
          <Route path="/saude/peso" element={<PesoList />} />
          <Route path="/saude/medidas" element={<Medidas />} />
          <Route path="/saude/sono" element={<SonoList />} />
          <Route path="/saude/dores" element={<DoresList />} />

          {/* 🏆 Competição */}
          <Route path="/torneios" element={<TorneiosList />} />

          {/* 📊 Métricas */}
          <Route path="/metricas" element={<Metricas />} />
          <Route path="/metricas/avaliacoes/nova" element={<AvaliacaoForm />} />
          <Route path="/metricas/metas" element={<Metas />} />

          {/* 🤖 Chat IA */}
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:conversaId" element={<Chat />} />

          {/* ⚙️ Configurações */}
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/configuracoes/perfil" element={<PerfilEdit />} />
          <Route path="/configuracoes/llm" element={<LLMConfig />} />
          <Route path="/admin/llm" element={<AdminLLMConfig />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>

      <Toaster />
    </>
  );
}
