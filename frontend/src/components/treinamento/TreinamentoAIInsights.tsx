/**
 * 🏋️ AI Insights — Card com análise inteligente do treino recente
 *
 * Pega as últimas 10 sessões e pede ao agente Preparador (Gemini)
 * uma análise curta + recomendação.
 *
 * Usa a mesma Cloud Function do chat (api/chat/message) mas com prompt
 * especializado em insights rápidos.
 */

import { treinoCol } from '@/lib/firestorePaths';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, Brain, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { sendMessage } from '@/lib/chat-api';
import { formatDate } from '@/lib/utils';

interface Sessao {
  id: string;
  data: string;
  tipo: string;
  duracaoMin?: number;
  rpeMedio?: number;
  volumeTotal?: number;
  exercicios?: any[];
}

export function TreinamentoAIInsights() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: sessoes } = useQuery({
    queryKey: ['treinamento-ai-insights', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        treinoCol(db, user.uid, 'sessoes'),
        orderBy('data', 'desc'),
        limit(10),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Sessao));
    },
    enabled: !!user,
  });

  async function gerarInsight() {
    if (!user || !sessoes || sessoes.length === 0) {
      setError('Sem sessões registradas ainda.');
      return;
    }
    setLoading(true);
    setError(null);

    // Monta resumo das últimas sessões
    const resumo = sessoes.slice(0, 10).map((s) => {
      const data = formatDate(s.data);
      const tipo = s.tipo || 'sessão';
      const dur = s.duracaoMin ? `${s.duracaoMin}min` : '';
      const rpe = s.rpeMedio ? `RPE ${s.rpeMedio}` : '';
      const vol = s.volumeTotal ? `${s.volumeTotal.toLocaleString('pt-BR')}kg` : '';
      const exCount = (s.exercicios || []).length;
      return `- ${data}: ${tipo} (${dur} ${rpe} ${vol}, ${exCount} exercícios)`;
    }).join('\n');

    const prompt = `Você é um preparador físico experiente. Analise as últimas ${sessoes.length} sessões de treino do atleta e gere um insight curto (máximo 200 palavras) com:

1. 📊 Padrão observado (volume, frequência, RPE)
2. ✅ Ponto positivo
3. ⚠️ Ponto de atenção (se houver)
4. 🎯 Recomendação prática para a próxima sessão

Últimas sessões:
${resumo}

Responda em português do Brasil, tom direto e motivador. Use emojis.`;

    try {
      const resp = await sendMessage({
        message: prompt,
        agente: 'preparador',
      });
      setInsight(resp.text);
      setLastUpdate(new Date());
    } catch (e: any) {
      setError(e.message || 'Erro ao gerar insight');
    } finally {
      setLoading(false);
    }
  }

  // Auto-gera no primeiro mount (se houver sessões)
  useEffect(() => {
    if (user && sessoes && sessoes.length > 0 && !insight && !loading && !error) {
      gerarInsight();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sessoes?.length]);

  return (
    <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-transparent">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-5 w-5 text-purple-400" />
            AI Insight
          </CardTitle>
          <CardDescription>
            Análise inteligente do seu treino recente (Gemini · agente Preparador)
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={gerarInsight}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 animate-pulse text-purple-400" />
            Analisando suas últimas sessões...
          </div>
        )}
        {error && (
          <div className="text-sm text-rose-400">
            ⚠️ {error}
            <Button size="sm" variant="link" onClick={gerarInsight}>
              Tentar novamente
            </Button>
          </div>
        )}
        {insight && !loading && (
          <div className="text-sm whitespace-pre-wrap prose prose-invert max-w-none">
            {insight}
          </div>
        )}
        {lastUpdate && (
          <div className="text-xs text-muted-foreground mt-3 flex items-center justify-between">
            <span>Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}</span>
            <Button asChild variant="link" size="sm" className="text-xs">
              <Link to="/app/chat">
                <MessageCircle className="h-3 w-3 mr-1" />
                Conversar com Preparador
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
