import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/toaster';
import { doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Check } from 'lucide-react';

export function Consent() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAccept = async () => {
    if (!user || !accepted) return;
    setSaving(true);
    try {
      await doc(db, 'toppkb_users', user.uid, 'profile', 'main'); // ensure exists
      // update via set with merge
      const { setDoc } = await import('firebase/firestore');
      await setDoc(
        doc(db, 'toppkb_users', user.uid, 'profile', 'main'),
        {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Atleta',
          consent: {
            acceptedAt: serverTimestamp(),
            version: '1.0',
            ip: '', // backend pode preencher
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          onboardingComplete: false,
          preferences: { theme: 'dark', language: 'pt-BR', units: 'metric' },
        },
        { merge: true },
      );
      toast({ title: 'Consentimento aceito!', variant: 'success' });
      navigate('/app/onboarding');
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>📋 Termo de Consentimento</CardTitle>
          <CardDescription>Seus dados são seus. Sempre.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Este app coleta e processa, com seu consentimento:</p>

          <ul className="space-y-2 text-sm">
            <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5" /> Dados de identificação (e-mail, nome)</li>
            <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5" /> Dados esportivos (treinos, partidas, peso, dores, sono)</li>
            <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5" /> Conversas com a IA (5 agentes especializados)</li>
            <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5" /> Localização aproximada (cidade/estado)</li>
          </ul>

          <div className="bg-muted p-3 rounded-md text-sm">
            <strong>NÃO coletamos:</strong> CPF, RG, endereço completo, dados de pagamento, geolocalização em tempo real, dados biométricos.
            <br /><br />
            <strong>Você pode:</strong>
            <ul className="mt-1 space-y-1">
              <li>📥 Exportar todos os seus dados a qualquer momento</li>
              <li>🗑️ Deletar sua conta e todos os dados relacionados</li>
              <li>📋 Revisar este termo a qualquer momento</li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            Os dados ficam armazenados no Firebase (Google Cloud), em região sul-americana, com criptografia em trânsito (HTTPS) e em repouso.
          </p>

          <label className="flex items-start gap-2 p-3 border border-border rounded-md cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm">
              Li e aceito os termos. Entendo que posso exportar e deletar meus dados a qualquer momento.
            </span>
          </label>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => signOut().then(() => navigate('/app/'))}>
              Sair
            </Button>
            <Button onClick={handleAccept} disabled={!accepted || saving} className="flex-1">
              {saving ? 'Salvando...' : 'Aceitar e continuar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
