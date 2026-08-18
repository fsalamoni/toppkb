import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import {
  LLM_PROVIDERS,
  AGENTES,
  adminGetGlobalLLM,
  adminSetGlobalLLM,
  listLLMModels,
  adminGetAgentsConfig,
  adminSaveAgentsConfig,
  type LLMProvider,
  type GlobalLLMClient,
  type GlobalLLMInput,
  type ModelInfo,
  type AgentConfigClient,
  type AgentConfigInput,
  type AgenteId,
  type AgentModelClient,
  type AgentModelInput,
  type AgentSkillClient,
} from '@/lib/llm-api';
import { Sparkles, Key, RefreshCw, ExternalLink, Save, Trash2 } from 'lucide-react';

type Tab = 'global' | 'agentes';

export function AdminLLMConfig() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('global');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      await Promise.all([loadGlobal(), loadAgents()]);
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const [global, setGlobal] = useState<GlobalLLMClient | null>(null);
  const [globalForm, setGlobalForm] = useState<GlobalLLMInput>({
    provider: 'openai',
    model: '',
    apiKey: '',
    baseUrl: '',
    temperature: 0.4,
    maxTokens: 1500,
  });
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [savingGlobal, setSavingGlobal] = useState(false);

  const [agents, setAgents] = useState<Record<AgenteId, AgentConfigClient> | null>(null);
  const [savingAgent, setSavingAgent] = useState<AgenteId | null>(null);

  const loadGlobal = async () => {
    const res = await adminGetGlobalLLM();
    const cfg = res.data;
    setGlobal(cfg);
    if (cfg) {
      setGlobalForm({
        provider: cfg.provider,
        model: cfg.model,
        apiKey: '',
        baseUrl: cfg.baseUrl || '',
        temperature: cfg.temperature ?? 0.4,
        maxTokens: cfg.maxTokens ?? 1500,
      });
    }
  };

  const loadAgents = async () => {
    const res = await adminGetAgentsConfig();
    setAgents(res.data.agents);
  };

  const onProviderChange = (provider: LLMProvider) => {
    const preset = LLM_PROVIDERS.find((p) => p.id === provider);
    setGlobalForm({ ...globalForm, provider, baseUrl: preset?.defaultBaseUrl || '', model: '' });
    setModels([]);
  };

  const loadModels = async (apiKey: string, baseUrl?: string) => {
    setLoadingModels(true);
    try {
      const res = await listLLMModels({ provider: globalForm.provider, apiKey, baseUrl });
      setModels(res.data);
      if (res.data.length > 0 && !globalForm.model) {
        setGlobalForm((f) => ({ ...f, model: res.data[0].id }));
      }
    } catch (e: any) {
      console.warn('Falha:', e.message);
    } finally {
      setLoadingModels(false);
    }
  };

  const onSaveGlobal = async () => {
    if (!globalForm.provider || !globalForm.model) {
      toast({ title: 'Preencha provider e model', variant: 'destructive' });
      return;
    }
    if (!globalForm.apiKey && !global?.hasApiKey) {
      toast({ title: 'API key obrigatória para o LLM global', variant: 'destructive' });
      return;
    }
    setSavingGlobal(true);
    try {
      await adminSetGlobalLLM(globalForm);
      toast({ title: 'LLM global salvo!', variant: 'success' });
      await loadGlobal();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setSavingGlobal(false);
    }
  };

  const onDeleteGlobal = async () => {
    if (!confirm('Remover LLM global? Todos os usuários cairão em fallback ou precisam de config pessoal.')) return;
    setSavingGlobal(true);
    try {
      await adminSetGlobalLLM(null);
      toast({ title: 'LLM global removido', variant: 'success' });
      await loadGlobal();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setSavingGlobal(false);
    }
  };

  const updateAgent = (id: AgenteId, patch: Partial<AgentConfigClient>) => {
    if (!agents) return;
    setAgents({ ...agents, [id]: { ...agents[id], ...patch } });
  };

  const updateAgentModel = (id: AgenteId, patch: Partial<AgentModelClient>) => {
    if (!agents) return;
    setAgents({
      ...agents,
      [id]: { ...agents[id], model: { ...agents[id].model, ...patch } },
    });
  };

  const updateAgentSkill = (id: AgenteId, skillId: string, patch: Partial<AgentSkillClient>) => {
    if (!agents) return;
    const skills = agents[id].skills.map((s) => (s.id === skillId ? { ...s, ...patch } : s));
    setAgents({ ...agents, [id]: { ...agents[id], skills } });
  };

  const onSaveAgent = async (id: AgenteId) => {
    if (!agents) return;
    setSavingAgent(id);
    try {
      const input: { agents: Record<AgenteId, AgentConfigInput> } = {
        agents: {} as any,
      };
      // Serializa — converte AgentConfigClient → AgentConfigInput
      // Remove campos client-only (hasApiKey, apiKeyMasked) e mantém apiKey cru (se houver)
      for (const [aid, a] of Object.entries(agents)) {
        input.agents[aid as AgenteId] = {
          id: a.id,
          label: a.label,
          enabled: a.enabled,
          model: {
            mode: a.model.mode,
            provider: a.model.provider,
            model: a.model.model,
            // Envia apiKey APENAS se for um valor novo (não mascara)
            apiKey: a.model.apiKey && !a.model.apiKey.includes('•') ? a.model.apiKey : '',
            baseUrl: a.model.baseUrl,
            temperature: a.model.temperature,
            maxTokens: a.model.maxTokens,
          } as AgentModelInput,
          skills: a.skills.map((s) => ({ id: s.id, name: s.name, description: s.description, prompt: s.prompt, enabled: s.enabled })),
        };
      }
      const res = await adminSaveAgentsConfig(input);
      setAgents(res.data.agents);
      toast({ title: `Agente "${id}" salvo!`, variant: 'success' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setSavingAgent(null);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">👑 Config de IA (Admin Master)</h1>
        <Button variant="ghost" onClick={() => navigate('/app/configuracoes')}>← Voltar</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setTab('global')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            tab === 'global' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          🌐 LLM Global
        </button>
        <button
          onClick={() => setTab('agentes')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            tab === 'agentes' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          🤖 Agentes ({AGENTES.length})
        </button>
      </div>

      {tab === 'global' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" /> LLM Global da Plataforma
            </CardTitle>
            <CardDescription>
              Define o LLM padrão para todos os usuários que NÃO configuraram um LLM pessoal.
              A apiKey fica num doc secreto (somente master pode ler).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {global && global.active && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-md p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-green-500" />
                  <span>LLM global ativo: <strong className="capitalize">{global.provider}</strong> / <code>{global.model}</code></span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  API key: <code>{global.apiKeyMasked}</code>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Provedor</Label>
                <select
                  value={globalForm.provider}
                  onChange={(e) => onProviderChange(e.target.value as LLMProvider)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {LLM_PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Modelo</Label>
                {models.length > 0 ? (
                  <select
                    value={globalForm.model}
                    onChange={(e) => setGlobalForm({ ...globalForm, model: e.target.value })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>{m.name || m.id}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={globalForm.model}
                    onChange={(e) => setGlobalForm({ ...globalForm, model: e.target.value })}
                    placeholder="ex: gpt-4o-mini, claude-3-5-haiku, gemini-2.5-flash"
                  />
                )}
              </div>
            </div>

            <div>
              <Label>API Key</Label>
              <Input
                type="password"
                value={globalForm.apiKey}
                onChange={(e) => {
                  setGlobalForm({ ...globalForm, apiKey: e.target.value });
                  if (e.target.value.length >= 20) loadModels(e.target.value, globalForm.baseUrl);
                }}
                placeholder={LLM_PROVIDERS.find((p) => p.id === globalForm.provider)?.placeholder || 'sk-...'}
              />
              {global?.hasApiKey && !globalForm.apiKey && (
                <div className="text-xs text-muted-foreground mt-1">
                  Em branco? Mantém a chave atual ({global.apiKeyMasked}).
                </div>
              )}
              {loadingModels && (
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Listando modelos...
                </div>
              )}
            </div>

            {globalForm.provider === 'custom' && (
              <div>
                <Label>Base URL</Label>
                <Input
                  value={globalForm.baseUrl}
                  onChange={(e) => setGlobalForm({ ...globalForm, baseUrl: e.target.value })}
                  placeholder="https://api.exemplo.com/v1"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Temperatura ({globalForm.temperature})</Label>
                <input
                  type="range" min="0" max="2" step="0.1"
                  value={globalForm.temperature}
                  onChange={(e) => setGlobalForm({ ...globalForm, temperature: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <Label>Max tokens</Label>
                <Input
                  type="number"
                  value={globalForm.maxTokens}
                  onChange={(e) => setGlobalForm({ ...globalForm, maxTokens: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={onSaveGlobal} disabled={savingGlobal} className="flex-1">
                <Save className="h-4 w-4" /> {savingGlobal ? 'Salvando...' : 'Salvar LLM global'}
              </Button>
              {global && global.active && (
                <Button onClick={onDeleteGlobal} disabled={savingGlobal} variant="destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'agentes' && agents && (
        <div className="space-y-3">
          {AGENTES.map((a) => {
            const cfg = agents[a.id];
            if (!cfg) return null;
            return (
              <Card key={a.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{a.icone}</span>
                      {cfg.label}
                    </CardTitle>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={cfg.enabled}
                        onChange={(e) => updateAgent(a.id, { enabled: e.target.checked })}
                      />
                      Ativo
                    </label>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Model config */}
                  <div className="bg-muted/50 p-3 rounded-md space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      Modelo LLM
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Modo</Label>
                        <select
                          value={cfg.model.mode}
                          onChange={(e) => updateAgentModel(a.id, { mode: e.target.value as 'global' | 'custom' })}
                          className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                        >
                          <option value="global">Global (do admin)</option>
                          <option value="custom">Custom (próprio)</option>
                        </select>
                      </div>
                      {cfg.model.mode === 'custom' && (
                        <>
                          <div>
                            <Label className="text-xs">Provider</Label>
                            <select
                              value={cfg.model.provider || ''}
                              onChange={(e) => updateAgentModel(a.id, { provider: e.target.value as LLMProvider })}
                              className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                            >
                              <option value="">—</option>
                              {LLM_PROVIDERS.map((p) => (
                                <option key={p.id} value={p.id}>{p.nome}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label className="text-xs">Modelo</Label>
                            <Input
                              value={cfg.model.model || ''}
                              onChange={(e) => updateAgentModel(a.id, { model: e.target.value })}
                              placeholder="ex: gpt-4o"
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">API Key</Label>
                            <Input
                              type="password"
                              value={cfg.model.apiKey || ''}
                              onChange={(e) => updateAgentModel(a.id, { apiKey: e.target.value })}
                              placeholder={cfg.model.hasApiKey ? cfg.model.apiKeyMasked : 'sk-...'}
                              className="h-9"
                            />
                          </div>
                        </>
                      )}
                    </div>
                    {cfg.model.hasApiKey && (
                      <div className="text-xs text-muted-foreground">
                        API key atual: <code>{cfg.model.apiKeyMasked}</code>
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  <div>
                    <div className="text-sm font-medium mb-2">Skills / Instruções customizadas</div>
                    <div className="space-y-2">
                      {cfg.skills.map((s) => (
                        <div key={s.id} className="border border-border rounded-md p-3">
                          <div className="flex items-center justify-between mb-1">
                            <Input
                              value={s.name}
                              onChange={(e) => updateAgentSkill(a.id, s.id, { name: e.target.value })}
                              className="h-8 text-sm font-medium max-w-md"
                            />
                            <label className="flex items-center gap-1 text-xs">
                              <input
                                type="checkbox"
                                checked={s.enabled}
                                onChange={(e) => updateAgentSkill(a.id, s.id, { enabled: e.target.checked })}
                              />
                              Ativa
                            </label>
                          </div>
                          <Textarea
                            value={s.prompt}
                            onChange={(e) => updateAgentSkill(a.id, s.id, { prompt: e.target.value })}
                            className="text-xs min-h-[60px]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={() => onSaveAgent(a.id)} disabled={savingAgent === a.id} size="sm">
                    <Save className="h-3 w-3" /> {savingAgent === a.id ? 'Salvando...' : `Salvar ${a.nome}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Helper Textarea (precisa importar)
import { Textarea } from '@/components/ui/textarea';
