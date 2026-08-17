import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import {
  LLM_PROVIDERS,
  getLLMConfig,
  setLLMConfig,
  deleteLLMConfig,
  listLLMModels,
  type LLMProvider,
  type LLMConfigClient,
  type LLMConfigInput,
  type ModelInfo,
} from '@/lib/llm-api';
import { Sparkles, Trash2, Key, RefreshCw, ExternalLink } from 'lucide-react';

export function LLMConfig() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState<LLMConfigClient | null>(null);
  const [form, setForm] = useState<LLMConfigInput>({
    provider: 'openai',
    model: '',
    apiKey: '',
    baseUrl: '',
    temperature: 0.4,
    maxTokens: 1500,
  });
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getLLMConfig();
      const cfg = res.data;
      setCurrent(cfg);
      if (cfg) {
        setForm({
          provider: cfg.provider,
          model: cfg.model,
          apiKey: '', // nunca pré-popular
          baseUrl: cfg.baseUrl || '',
          temperature: cfg.temperature ?? 0.4,
          maxTokens: cfg.maxTokens ?? 1500,
        });
      }
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const onProviderChange = (provider: LLMProvider) => {
    const preset = LLM_PROVIDERS.find((p) => p.id === provider);
    setForm({
      ...form,
      provider,
      baseUrl: preset?.defaultBaseUrl || '',
      model: '', // reset
    });
    setModels([]);
  };

  const onApiKeyChange = async (apiKey: string) => {
    setForm({ ...form, apiKey });
    // Auto-busca modelos quando digita uma API key completa
    if (apiKey.length >= 20) {
      await loadModels(apiKey, form.baseUrl);
    }
  };

  const loadModels = async (apiKey: string, baseUrl?: string) => {
    if (!form.provider) return;
    setLoadingModels(true);
    try {
      const res = await listLLMModels({ provider: form.provider, apiKey, baseUrl });
      setModels(res.data);
      if (res.data.length > 0 && !form.model) {
        setForm((f) => ({ ...f, model: res.data[0].id }));
      }
    } catch (e: any) {
      console.warn('Falha ao listar modelos:', e.message);
    } finally {
      setLoadingModels(false);
    }
  };

  const onSave = async () => {
    if (!form.provider || !form.model) {
      toast({ title: 'Preencha provider e model', variant: 'destructive' });
      return;
    }
    if (!form.apiKey && !current?.hasApiKey) {
      toast({ title: 'API key obrigatória', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      // Se apiKey vazio, mantém a existente (não envia)
      const payload: LLMConfigInput = {
        provider: form.provider,
        model: form.model,
        apiKey: form.apiKey || '', // server vai preservar se vazio
        baseUrl: form.baseUrl || undefined,
        temperature: form.temperature,
        maxTokens: form.maxTokens,
      };
      await setLLMConfig(payload);
      toast({ title: 'Configuração salva!', variant: 'success' });
      await load();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!confirm('Remover sua configuração pessoal de LLM? Você voltará a usar o LLM global do admin.')) return;
    setSaving(true);
    try {
      await deleteLLMConfig();
      toast({ title: 'Configuração removida', variant: 'success' });
      await load();
      setForm({ provider: 'openai', model: '', apiKey: '', baseUrl: '', temperature: 0.4, maxTokens: 1500 });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🤖 Meu LLM Pessoal</h1>
        <Button variant="ghost" onClick={() => navigate('/configuracoes')}>← Voltar</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Configuração Pessoal
          </CardTitle>
          <CardDescription>
            Configure qual provedor de LLM você quer usar (17 opções: OpenAI, Anthropic, Google AI, etc).
            Sua chave fica armazenada de forma segura no Firestore (o admin master não tem acesso).
            Se você não configurar nada, o sistema usa o LLM global do admin master.
            Se NINGUÉM configurar, os agentes exibem uma mensagem pedindo setup — o sistema é provider-agnostic.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {current && current.hasApiKey && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-md p-3 text-sm">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-green-500" />
                <span>Configuração ativa: <strong className="capitalize">{current.provider}</strong> / <code>{current.model}</code></span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                API key: <code>{current.apiKeyMasked}</code>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Provedor</Label>
              <select
                value={form.provider}
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
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name || m.id}</option>
                  ))}
                </select>
              ) : (
                <Input
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="ex: gpt-4o-mini, claude-3-5-haiku, gemini-2.5-flash"
                />
              )}
            </div>
          </div>

          <div>
            <Label>API Key</Label>
            <Input
              type="password"
              value={form.apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder={LLM_PROVIDERS.find((p) => p.id === form.provider)?.placeholder || 'sk-...'}
            />
            {current?.hasApiKey && !form.apiKey && (
              <div className="text-xs text-muted-foreground mt-1">
                Deixou em branco? Mantém a chave atual ({current.apiKeyMasked}).
              </div>
            )}
            {loadingModels && (
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" /> Listando modelos disponíveis...
              </div>
            )}
            {models.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => form.apiKey && loadModels(form.apiKey, form.baseUrl)}
                className="mt-1"
              >
                <RefreshCw className="h-3 w-3" /> Atualizar lista
              </Button>
            )}
          </div>

          {form.provider === 'custom' && (
            <div>
              <Label>Base URL (custom)</Label>
              <Input
                value={form.baseUrl}
                onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                placeholder="https://api.exemplo.com/v1"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Temperatura ({form.temperature})</Label>
              <input
                type="range" min="0" max="2" step="0.1"
                value={form.temperature}
                onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <Label>Max tokens</Label>
              <Input
                type="number"
                value={form.maxTokens}
                onChange={(e) => setForm({ ...form, maxTokens: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={onSave} disabled={saving} className="flex-1">
              {saving ? 'Salvando...' : 'Salvar configuração'}
            </Button>
            {current && current.hasApiKey && (
              <Button onClick={onDelete} disabled={saving} variant="destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📚 Como conseguir a API key</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <ProviderHelp provider={form.provider} />
        </CardContent>
      </Card>
    </div>
  );
}

function ProviderHelp({ provider }: { provider: LLMProvider }) {
  const links: Record<LLMProvider, { url: string; texto: string }> = {
    google: { url: 'https://aistudio.google.com/app/apikey', texto: 'Google AI Studio' },
    openai: { url: 'https://platform.openai.com/api-keys', texto: 'OpenAI Dashboard' },
    anthropic: { url: 'https://console.anthropic.com/settings/keys', texto: 'Anthropic Console' },
    openrouter: { url: 'https://openrouter.ai/keys', texto: 'OpenRouter' },
    deepseek: { url: 'https://platform.deepseek.com/api_keys', texto: 'DeepSeek' },
    kimi: { url: 'https://platform.moonshot.cn/console/api-keys', texto: 'Moonshot' },
    qwen: { url: 'https://dashscope.console.aliyun.com/apiKey', texto: 'Aliyun DashScope' },
    groq: { url: 'https://console.groq.com/keys', texto: 'Groq Console' },
    nvidia: { url: 'https://build.nvidia.com/explore/discover', texto: 'NVIDIA NIM' },
    mistral: { url: 'https://console.mistral.ai/api-keys', texto: 'Mistral' },
    xai: { url: 'https://console.x.ai/', texto: 'xAI Console' },
    cohere: { url: 'https://dashboard.cohere.com/api-keys', texto: 'Cohere' },
    together: { url: 'https://api.together.xyz/settings/api-keys', texto: 'Together AI' },
    fireworks: { url: 'https://fireworks.ai/account/api-keys', texto: 'Fireworks' },
    perplexity: { url: 'https://www.perplexity.ai/settings/api', texto: 'Perplexity' },
    ollama: { url: 'https://ollama.com/', texto: 'Ollama (local)' },
    custom: { url: '#', texto: 'Custom' },
  };
  const { url, texto } = links[provider];
  if (provider === 'ollama') {
    return (
      <div>
        <p>Ollama roda localmente. Instale via <code>curl https://ollama.ai/install.sh | sh</code>.</p>
        <p>Depois: <code>ollama pull llama3</code> e use <code>http://localhost:11434/v1</code> como base URL.</p>
        <p>API key: deixe em branco (não é necessária).</p>
      </div>
    );
  }
  return (
    <div>
      Pegue sua API key em <a href={url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">{texto} <ExternalLink className="h-3 w-3" /></a>.
      <br />
      <span className="text-xs text-muted-foreground">
        Sua chave fica armazenada de forma segura. Você pode removê-la a qualquer momento.
      </span>
    </div>
  );
}
