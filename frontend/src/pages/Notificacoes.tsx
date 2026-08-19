/**
 * Notificacoes — Config de Push Notifications
 *
 * - Pede permissão de notificação
 * - Subscreve o user (com VAPID key)
 * - Salva subscription via Cloud Function `savePushSubscription`
 * - Permite configurar 5 tipos de lembrete:
 *   1) Hidratação (diário, hora específica)
 *   2) Treino (dias da semana + hora)
 *   3) Sono (lembrete de deitar)
 *   4) Torneio (D-N)
 *   5) Check-in semanal de dor
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/usePWA';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import {
  Bell, Droplet, Activity, Moon, Trophy, AlertCircle,
  Check, X, Smartphone, Shield, Clock,
} from 'lucide-react';

interface PushConfig {
  hidratacao?: { enabled: boolean; hora: string };
  treino?: { enabled: boolean; hora: string; diasSemana: number[] };
  sono?: { enabled: boolean; hora: string };
  torneio?: { enabled: boolean; antecedenciaDias: number };
  dorCheck?: { enabled: boolean; diaSemana: number };
  enabled?: boolean;
}

const DEFAULT_CONFIG: PushConfig = {
  hidratacao: { enabled: true, hora: '10:00' },
  treino: { enabled: true, hora: '18:00', diasSemana: [1, 3, 5] },
  sono: { enabled: true, hora: '22:30' },
  torneio: { enabled: true, antecedenciaDias: 1 },
  dorCheck: { enabled: true, diaSemana: 1 },
  enabled: true,
};

const DIAS_SEMANA = [
  { value: 0, label: 'Dom', full: 'Domingo' },
  { value: 1, label: 'Seg', full: 'Segunda' },
  { value: 2, label: 'Ter', full: 'Terça' },
  { value: 3, label: 'Qua', full: 'Quarta' },
  { value: 4, label: 'Qui', full: 'Quinta' },
  { value: 5, label: 'Sex', full: 'Sexta' },
  { value: 6, label: 'Sáb', full: 'Sábado' },
];

export function Notificacoes() {
  const { user } = useAuth();
  const { permission, requestPermission } = useNotifications();
  const [config, setConfig] = useState<PushConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const perm: NotificationPermission | 'unsupported' = (permission as any) || 'default';

  // Carrega config atual
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const get = httpsCallable(functions, 'getPushConfig');
        const r = await get();
        const cfg = (r.data as any)?.config || DEFAULT_CONFIG;
        setConfig({ ...DEFAULT_CONFIG, ...cfg });
      } catch (e: any) {
        console.warn('[notif] getPushConfig falhou:', e?.message);
        // Mantém defaults se função não existir (deploy pendente)
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Salva config
  const save = async (newConfig: PushConfig) => {
    setSaving(true);
    setConfig(newConfig);
    try {
      const set = httpsCallable(functions, 'setPushConfig');
      await set({ config: newConfig });
      toast({ title: 'Config salva', variant: 'success' });
    } catch (e: any) {
      console.warn('[notif] setPushConfig falhou:', e?.message);
      toast({
        title: 'Erro ao salvar',
        description: 'As alterações ficam salvas localmente. A sincronização pode falhar se a Cloud Function não estiver deployada.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Ativa push (pede permissão + subscreve)
  const enablePush = async () => {
    if (permission === 'granted') return;
    const result = await requestPermission();
    if (result === 'granted') {
      // Pega subscription e salva via CF
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          const save = httpsCallable(functions, 'savePushSubscription');
          await save({ subscription: sub.toJSON(), userAgent: navigator.userAgent });
          toast({ title: 'Notificações ativadas!', variant: 'success' });
        }
      } catch (e: any) {
        console.warn('[notif] savePushSubscription falhou:', e?.message);
        toast({ title: 'Permissão concedida, mas sync falhou', variant: 'destructive' });
      }
    } else {
      toast({ title: 'Permissão negada', description: 'Habilite nas configurações do browser', variant: 'destructive' });
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <p className="text-muted-foreground text-center">Faça login para configurar notificações.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const cfg = config;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Bell className="h-7 w-7" /> Notificações
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure lembretes que vão te ajudar a manter a rotina até 2032
        </p>
      </div>

      {/* Status atual */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Status do navegador
              </CardTitle>
              <CardDescription className="mt-1">Permissão atual de notificações</CardDescription>
            </div>
            <PermissionBadge permission={perm} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {perm === 'default' && (
            <Button onClick={enablePush} className="w-full">
              <Bell className="mr-2 h-4 w-4" />
              Ativar notificações
            </Button>
          )}
          {perm === 'granted' && (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <Check className="h-4 w-4" />
              Você receberá lembretes no seu dispositivo.
            </div>
          )}
          {perm === 'denied' && (
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-center gap-2 text-amber-600">
                <Shield className="h-4 w-4" />
                Permissão bloqueada. Habilite manualmente:
              </div>
              <ul className="text-xs space-y-1 pl-6 list-disc">
                <li>Chrome: Configurações → Privacidade → Notificações</li>
                <li>Safari: Preferências → Sites → Notificações</li>
                <li>Firefox: Preferências → Privacidade → Permissões</li>
              </ul>
            </div>
          )}
          {perm === 'unsupported' && (
            <div className="text-sm text-muted-foreground">
              Seu navegador não suporta notificações push.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidratação */}
      <ReminderCard
        icon={Droplet}
        iconColor="text-cyan-500"
        title="Hidratação"
        description="Lembrete para beber água ao longo do dia"
        enabled={cfg.hidratacao?.enabled || false}
        onToggle={(v) => save({ ...cfg, hidratacao: { ...cfg.hidratacao!, enabled: v } })}
        rightSlot={
          cfg.hidratacao?.enabled && (
            <TimeInput
              value={cfg.hidratacao?.hora || '10:00'}
              onChange={(hora) => save({ ...cfg, hidratacao: { ...cfg.hidratacao!, hora, enabled: true } })}
            />
          )
        }
      />

      {/* Treino */}
      <ReminderCard
        icon={Activity}
        iconColor="text-emerald-500"
        title="Treino"
        description="Lembrete nos dias de treino para não esquecer"
        enabled={cfg.treino?.enabled || false}
        onToggle={(v) => save({ ...cfg, treino: { ...cfg.treino!, enabled: v } })}
        rightSlot={
          cfg.treino?.enabled && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {DIAS_SEMANA.map((d) => {
                  const selected = cfg.treino?.diasSemana?.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      onClick={() => {
                        const dias = cfg.treino?.diasSemana || [];
                        const next = selected ? dias.filter((x) => x !== d.value) : [...dias, d.value].sort();
                        save({ ...cfg, treino: { ...cfg.treino!, diasSemana: next, enabled: true } });
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-medium border transition ${
                        selected
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-muted/50 text-muted-foreground border-border hover:border-emerald-500/50'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
              <TimeInput
                value={cfg.treino?.hora || '18:00'}
                onChange={(hora) => save({ ...cfg, treino: { ...cfg.treino!, hora, enabled: true } })}
                label="Horário"
              />
            </div>
          )
        }
      />

      {/* Sono */}
      <ReminderCard
        icon={Moon}
        iconColor="text-purple-500"
        title="Sono"
        description="Lembrete para começar a desacelerar antes de dormir"
        enabled={cfg.sono?.enabled || false}
        onToggle={(v) => save({ ...cfg, sono: { ...cfg.sono!, enabled: v } })}
        rightSlot={
          cfg.sono?.enabled && (
            <TimeInput
              value={cfg.sono?.hora || '22:30'}
              onChange={(hora) => save({ ...cfg, sono: { ...cfg.sono!, hora, enabled: true } })}
            />
          )
        }
      />

      {/* Torneio */}
      <ReminderCard
        icon={Trophy}
        iconColor="text-amber-500"
        title="Torneio"
        description="Lembrete antes de cada torneio agendado"
        enabled={cfg.torneio?.enabled || false}
        onToggle={(v) => save({ ...cfg, torneio: { ...cfg.torneio!, enabled: v } })}
        rightSlot={
          cfg.torneio?.enabled && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Lembrar com</span>
              <select
                value={cfg.torneio?.antecedenciaDias || 1}
                onChange={(e) => save({ ...cfg, torneio: { ...cfg.torneio!, antecedenciaDias: parseInt(e.target.value), enabled: true } })}
                className="bg-muted/50 border border-border rounded px-2 py-1 text-sm"
              >
                <option value="1">1 dia</option>
                <option value="3">3 dias</option>
                <option value="7">7 dias</option>
              </select>
              <span className="text-muted-foreground">de antecedência</span>
            </div>
          )
        }
      />

      {/* Dor check-in */}
      <ReminderCard
        icon={AlertCircle}
        iconColor="text-amber-500"
        title="Check-in semanal de dor"
        description="Lembrete semanal para registrar como estão suas dores"
        enabled={cfg.dorCheck?.enabled || false}
        onToggle={(v) => save({ ...cfg, dorCheck: { ...cfg.dorCheck!, enabled: v } })}
        rightSlot={
          cfg.dorCheck?.enabled && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Toda</span>
              <select
                value={cfg.dorCheck?.diaSemana || 1}
                onChange={(e) => save({ ...cfg, dorCheck: { ...cfg.dorCheck!, diaSemana: parseInt(e.target.value), enabled: true } })}
                className="bg-muted/50 border border-border rounded px-2 py-1 text-sm"
              >
                {DIAS_SEMANA.map((d) => (
                  <option key={d.value} value={d.value}>{d.full}</option>
                ))}
              </select>
              <span className="text-muted-foreground">às 9h</span>
            </div>
          )
        }
      />

      {saving && (
        <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg shadow-lg px-3 py-2 flex items-center gap-2 text-sm">
          <Spinner size="sm" />
          <span>Salvando...</span>
        </div>
      )}
    </div>
  );
}

function PermissionBadge({ permission }: { permission: NotificationPermission | 'unsupported' }) {
  if (permission === 'granted') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium">
        <Check className="h-3 w-3" />
        Ativado
      </span>
    );
  }
  if (permission === 'denied') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-600 text-xs font-medium">
        <X className="h-3 w-3" />
        Bloqueado
      </span>
    );
  }
  if (permission === 'unsupported') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
        Indisponível
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-medium">
      Pendente
    </span>
  );
}

function ReminderCard({
  icon: Icon, iconColor, title, description, enabled, onToggle, rightSlot,
}: {
  icon: any;
  iconColor: string;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  rightSlot?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-medium text-sm">{title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={enabled}
                  onChange={(e) => onToggle(e.target.checked)}
                />
                <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-emerald-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-4" />
              </label>
            </div>
            {rightSlot && <div className="mt-3 pt-3 border-t border-border">{rightSlot}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TimeInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {label && <span className="text-muted-foreground">{label}</span>}
      <Clock className="h-4 w-4 text-muted-foreground" />
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-muted/50 border border-border rounded px-2 py-1 text-sm"
      />
    </div>
  );
}

export default Notificacoes;
