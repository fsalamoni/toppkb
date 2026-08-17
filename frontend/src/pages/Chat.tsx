import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { Send, MessageCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const AGENTES = {
  treinador: { nome: 'Coach Bruno', cor: 'text-emerald-500', bg: 'bg-emerald-500/10', icone: '🏓' },
  preparador: { nome: 'Prof. Marcos', cor: 'text-blue-500', bg: 'bg-blue-500/10', icone: '💪' },
  nutricionista: { nome: 'Dra. Ana', cor: 'text-orange-500', bg: 'bg-orange-500/10', icone: '🥗' },
  estrategista: { nome: 'Coach Carla', cor: 'text-purple-500', bg: 'bg-purple-500/10', icone: '🧠' },
  general: { nome: 'Assistente', cor: 'text-gray-500', bg: 'bg-gray-500/10', icone: '🤖' },
} as const;

type Agente = keyof typeof AGENTES;

export function Chat() {
  const { user } = useAuth();
  const { conversaId } = useParams();
  const qc = useQueryClient();
  const [input, setInput] = useState('');
  const [conversaAtiva, setConversaAtiva] = useState<string | null>(conversaId || null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Lista de conversas
  const { data: conversas } = useQuery({
    queryKey: ['conversas', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(collection(db, 'users', user.uid, 'conversas'), orderBy('updatedAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
    enabled: !!user,
  });

  // Mensagens da conversa ativa
  const { data: mensagens, isLoading: loadingMsgs } = useQuery({
    queryKey: ['mensagens', user?.uid, conversaAtiva],
    queryFn: async () => {
      if (!user || !conversaAtiva) return [];
      const q = query(
        collection(db, 'users', user.uid, 'conversas', conversaAtiva, 'messages'),
        orderBy('createdAt', 'asc'),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
    enabled: !!user && !!conversaAtiva,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [mensagens]);

  const send = useMutation({
    mutationFn: async (msg: string) => {
      if (!user) throw new Error('Não autenticado');

      let convId = conversaAtiva;
      if (!convId) {
        const convRef = await addDoc(collection(db, 'users', user.uid, 'conversas'), {
          titulo: msg.slice(0, 50),
          agente: 'general',
          topico: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          messageCount: 0,
          ativo: true,
        });
        convId = convRef.id;
        setConversaAtiva(convId);
      }

      // Salva msg do user
      await addDoc(collection(db, 'users', user.uid, 'conversas', convId, 'messages'), {
        role: 'user',
        content: msg,
        createdAt: serverTimestamp(),
      });

      // Chama API
      const { enviarMensagemChat } = await import('@/lib/api');
      const res = await enviarMensagemChat({ conversaId: convId, agente: 'auto', mensagem: msg });

      // Salva resposta
      await addDoc(collection(db, 'users', user.uid, 'conversas', convId, 'messages'), {
        role: 'assistant',
        content: res.resposta,
        agente: res.agenteUsado,
        metadata: res.metadata,
        createdAt: serverTimestamp(),
      });

      // Atualiza conversa
      await setDoc(
        doc(db, 'users', user.uid, 'conversas', convId),
        {
          agente: res.agenteUsado,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversas'] });
      qc.invalidateQueries({ queryKey: ['mensagens'] });
    },
    onError: (e: any) => {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || send.isPending) return;
    send.mutate(input);
    setInput('');
  };

  const novaConversa = () => {
    setConversaAtiva(null);
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-7rem)]">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
        {/* Sidebar de conversas */}
        <Card className="md:col-span-1 flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-medium">Conversas</h3>
            <Button size="sm" variant="ghost" onClick={novaConversa}>
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            {conversas && conversas.length > 0 ? (
              conversas.map((c: any) => {
                const ag = AGENTES[c.agente as Agente] || AGENTES.general;
                return (
                  <button
                    key={c.id}
                    onClick={() => setConversaAtiva(c.id)}
                    className={cn(
                      'w-full text-left p-2 rounded-md hover:bg-accent transition-colors mb-1',
                      conversaAtiva === c.id && 'bg-accent',
                    )}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span>{ag.icone}</span>
                      <span className="truncate">{c.titulo}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {c.messageCount} mensagens
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4">
                Nenhuma conversa
              </div>
            )}
          </div>
        </Card>

        {/* Chat */}
        <Card className="md:col-span-3 flex flex-col">
          {!conversaAtiva ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <Sparkles className="h-12 w-12 text-primary mb-4" />
              <h2 className="text-xl font-semibold mb-2">Olá! Sou sua equipe de IA 🏓</h2>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Tenho 5 especialistas: <strong>treinador</strong>, <strong>preparador físico</strong>,{' '}
                <strong>nutricionista</strong>, <strong>estrategista</strong>. Você escolhe ou eu detecto
                automaticamente pelo tema da mensagem.
              </p>
              <div className="grid grid-cols-2 gap-2 max-w-lg">
                <Button variant="outline" onClick={() => setInput('Como melhorar meu dink?')}>
                  🏓 Dicas de dink
                </Button>
                <Button variant="outline" onClick={() => setInput('Tô com dor no joelho, o que fazer?')}>
                  💪 Dor no joelho
                </Button>
                <Button variant="outline" onClick={() => setInput('O que comer pós-treino?')}>
                  🥗 Nutrição pós-treino
                </Button>
                <Button variant="outline" onClick={() => setInput('Como escolher o próximo torneio?')}>
                  🧠 Estratégia
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {loadingMsgs ? (
                  <div className="flex justify-center"><Spinner /></div>
                ) : mensagens && mensagens.length > 0 ? (
                  mensagens.map((m: any) => {
                    if (m.role === 'user') {
                      return (
                        <div key={m.id} className="flex justify-end">
                          <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2">
                            <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                          </div>
                        </div>
                      );
                    } else {
                      const ag = AGENTES[m.agente as Agente] || AGENTES.general;
                      return (
                        <div key={m.id} className="flex justify-start gap-2">
                          <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-lg flex-shrink-0', ag.bg)}>
                            {ag.icone}
                          </div>
                          <div className="max-w-[80%]">
                            <div className={cn('text-xs font-medium mb-1', ag.cor)}>{ag.nome}</div>
                            <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-2">
                              <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                              {m.metadata && (
                                <div className="text-xs text-muted-foreground mt-2">
                                  {m.metadata.tokensUsados} tokens • {m.metadata.latenciaMs}ms
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })
                ) : (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    Comece a conversa digitando abaixo 👇
                  </div>
                )}
                {send.isPending && (
                  <div className="flex justify-start gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Spinner size="sm" />
                    </div>
                    <div className="bg-card border border-border rounded-2xl px-4 py-2">
                      <p className="text-sm text-muted-foreground">Pensando...</p>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={onSubmit} className="border-t border-border p-4 flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pergunte algo à sua equipe..."
                  className="min-h-[44px] max-h-32 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onSubmit(e);
                    }
                  }}
                />
                <Button type="submit" disabled={!input.trim() || send.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
