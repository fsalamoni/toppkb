import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/toaster';
import { isSignInWithEmailLink } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
});

type FormData = z.infer<typeof schema>;

export function Login() {
  const { sendLink, completeSignIn, user, userDoc, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sending, setSending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Se já está logado, redireciona
  useEffect(() => {
    if (!loading && user) {
      if (!userDoc) navigate('/onboarding');
      else if (!userDoc.consent) navigate('/consent');
      else if (!userDoc.onboardingComplete) navigate('/onboarding');
      else navigate('/');
    }
  }, [user, userDoc, loading, navigate]);

  // Detecta magic link na URL
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Confirme seu e-mail:') || '';
      }
      if (email) {
        completeSignIn(email, window.location.href)
          .then(() => {
            toast({ title: 'Login realizado!', variant: 'success' });
          })
          .catch((e) => {
            toast({ title: 'Erro ao logar', description: e.message, variant: 'destructive' });
          });
      }
    }
  }, [completeSignIn]);

  const onSubmit = async (data: FormData) => {
    setSending(true);
    try {
      await sendLink(data.email);
      setLinkSent(true);
      toast({
        title: 'Link enviado!',
        description: 'Verifique sua caixa de entrada (e o spam).',
        variant: 'success',
      });
    } catch (e: any) {
      toast({
        title: 'Erro ao enviar link',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-5xl mb-2">🏓</div>
          <CardTitle className="text-2xl">Top Pickleball 50+</CardTitle>
          <CardDescription>
            Sua plataforma para ser o melhor 50+ do Brasil em 2032
          </CardDescription>
        </CardHeader>
        <CardContent>
          {linkSent ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">📧</div>
              <p className="text-sm">
                Enviamos um link mágico para <strong>{getValues('email')}</strong>.
              </p>
              <p className="text-xs text-muted-foreground">
                Clique no link para entrar. O link expira em 1 hora.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLinkSent(false)}
              >
                Usar outro e-mail
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...register('email')}
                  autoComplete="email"
                  autoFocus
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? 'Enviando...' : 'Entrar com link mágico'}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Sem senha. Você receberá um link por e-mail para entrar.
                <br />
                Primeira vez? Sua conta será criada automaticamente.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
