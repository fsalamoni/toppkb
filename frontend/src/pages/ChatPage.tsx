import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChatMessages, ChatInput } from '@/components/chat/ChatMessage';
import { sendMessage, listMensagens, listConversas, saveFeedback, ChatAgent } from '@/lib/chat-api';
import { useChatStore } from '@/stores/chatStore';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import { Brain, Dumbbell, Heart, Apple, Compass, Sparkles, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AGENTES: Array<{ id: ChatAgent; label: string; icon: React.ReactNode; cor: string; descricao: string }> = [
  { id: 'treinador', label: 'Treinador', icon: <Dumbbell className="h-4 w-4" />, cor: 'bg-blue-500/10 border-blue-500/30 text-blue-500', descricao: 'Técnica, tática, fundamentos' },
  { id: 'preparador', label: 'Preparador', icon: <Heart className="h-4 w-4" />, cor: 'bg-red-500/10 border-red-500/30 text-red-500', descricao: 'Físico, lesão, periodização' },
  { id: 'nutricionista', label: 'Nutricionista', icon: <Apple className="h-4 w-4" />, cor: 'bg-green-500/10 border-green-500/30 text-green-500', descricao: 'Dieta, suplementação, composição' },
  { id: 'estrategista', label: 'Estrategista', icon: <Compass className="h-4 w-4" />, cor: 'bg-purple-500/10 border-purple-500/30 text-purple-500', descricao: 'Metas, torneios, calendário' },
  { id: 'general', label: 'Geral', icon: <Brain className="h-4 w-4" />, cor: 'bg-gray-500/10 border-gray-500/30 text-gray-400', descricao: 'Qualquer dúvida' },
];

export function ChatPage() {
  const { user } = useAuth();
  const { conversaIdAtual, setConversaId, messages, setMessages, addMessage, agentePreferido, setAgentePreferido } = useChatStore();
  const addToast = useUIStore((s) => s.addToast);
  const [loading, setLoading] = useState(false);
  const [conversas, setConversas] = useState<Array<{ id: string; titulo: string; updatedAt: string }>>([]);
  const [showHistorico, setShowHistorico] = useState(false);

  // Carrega lista de conversas
  useEffect(() => {
    listConversas().then(setConversas).catch(() => {});
  }, [messages.length]);

  // Carrega mensagens da conversa atual
  useEffect(() => {
    if (!conversaIdAtual) return;
    listMensagens(conversaIdAtual).then(setMessages).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversaIdAtual]);

  const handleSend = async (text: string) => {
    if (!user) return;
    setLoading(true);

    // Otimistic add user msg
    const userMsg = {
      id: `temp-${Date.now()}`,
      role: 'user' as const,
      content: text,
      createdAt: new Date().toISOString(),
    };
    addMessage(userMsg);

    try {
      const response = await sendMessage({
        message: text,
        conversaId: conversaIdAtual || undefined,
        agente: agentePreferido,
      });
      // Adiciona resposta
      addMessage({
        id: response.messageId,
        role: 'assistant',
        content: response.text,
        createdAt: new Date().toISOString(),
        metadata: {
          agente: response.agenteUsado,
          model: response.model,
          provider: response.provider,
          latenciaMs: response.latenciaMs,
          piiRemoved: response.piiRemoved,
        },
        sources: response.sources,
      });
      setConversaId(response.conversaId);
    } catch (e: any) {
      addToast({ type: 'error', message: 'Erro ao enviar mensagem: ' + (e.message || '') });
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, positivo: boolean) => {
    if (!conversaIdAtual) return;
    try {
      await saveFeedback(messageId, conversaIdAtual, positivo);
      // Update local
      useChatStore.getState().updateMessage(messageId, {
        metadata: { ...messages.find((m) => m.id === messageId)?.metadata, feedbackPositivo: positivo },
      });
      addToast({ type: 'success', message: 'Obrigado pelo feedback!' });
    } catch {
      addToast({ type: 'error', message: 'Erro ao salvar feedback' });
    }
  };

  const handleNovaConversa = () => {
    setConversaId(null);
    setMessages([]);
  };

  const handleSelecionarConversa = (id: string) => {
    setConversaId(id);
    setShowHistorico(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chat com Agentes</h1>
          <p className="text-sm text-muted-foreground">Converse com a equipe técnica, escolha um agente ou deixe o sistema decidir.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowHistorico(!showHistorico)}>
            <History className="h-4 w-4 mr-2" />
            Histórico
          </Button>
          <Button onClick={handleNovaConversa}>
            <Sparkles className="h-4 w-4 mr-2" />
            Nova conversa
          </Button>
        </div>
      </div>

      {/* Seletor de agente */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground mr-1">Agente:</span>
            <Button
              variant={agentePreferido === 'auto' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAgentePreferido('auto')}
              className="text-xs"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Auto
            </Button>
            {AGENTES.map((a) => (
              <Button
                key={a.id}
                variant={agentePreferido === a.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAgentePreferido(a.id)}
                className="text-xs"
              >
                {a.icon}
                <span className="ml-1">{a.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-4 gap-4">
        {showHistorico && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Conversas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
              {conversas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma conversa</p>
              ) : (
                conversas.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelecionarConversa(c.id)}
                    className={cn(
                      'w-full text-left p-2 rounded border border-border hover:bg-accent transition-colors',
                      conversaIdAtual === c.id && 'bg-accent',
                    )}
                  >
                    <p className="text-sm font-medium truncate">{c.titulo || 'Sem título'}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(c.updatedAt), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                    </p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        )}

        <Card className={cn('lg:col-span-3', !showHistorico && 'lg:col-span-4')}>
          <CardContent className="p-4">
            <ChatMessages
              messages={messages}
              loading={loading}
              onFeedback={handleFeedback}
            />
            <div className="mt-4 border-t border-border pt-4">
              <ChatInput onSend={handleSend} loading={loading} />
              {loading && (
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <span>Processando com {agentePreferido === 'auto' ? 'agente automático' : agentePreferido}...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ChatPage;
