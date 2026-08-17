import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, ChevronDown, ChevronUp, BookOpen, Brain, Heart, Dumbbell, Apple, Compass, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ChatMessage as ChatMessageType, ChatAgent } from '@/lib/chat-api';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AGENTE_ICONS: Record<ChatAgent, React.ReactNode> = {
  treinador: <Dumbbell className="h-4 w-4" />,
  preparador: <Heart className="h-4 w-4" />,
  nutricionista: <Apple className="h-4 w-4" />,
  estrategista: <Compass className="h-4 w-4" />,
  general: <Brain className="h-4 w-4" />,
};

const AGENTE_CORES: Record<ChatAgent, string> = {
  treinador: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  preparador: 'bg-red-500/10 text-red-500 border-red-500/30',
  nutricionista: 'bg-green-500/10 text-green-500 border-green-500/30',
  estrategista: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
  general: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
};

interface ChatMessageProps {
  message: ChatMessageType;
  isUser: boolean;
  onFeedback?: (positivo: boolean) => void;
}

export function ChatMessageComponent({ message, isUser, onFeedback }: ChatMessageProps) {
  const agente = (message.metadata?.agente || 'general') as ChatAgent;
  const [showSources, setShowSources] = useState(false);

  if (isUser) {
    return (
      <div className="flex justify-end gap-2">
        <Card className="max-w-[80%] bg-primary text-primary-foreground">
          <CardContent className="p-3">
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            <p className="mt-1 text-xs opacity-70">
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: ptBR })}
            </p>
          </CardContent>
        </Card>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
          <UserIcon className="h-4 w-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
        AGENTE_CORES[agente],
      )}>
        {AGENTE_ICONS[agente]}
      </div>
      <div className="flex-1 max-w-[80%]">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-xs">
            {agente}
          </Badge>
          {message.metadata?.model && (
            <span className="text-xs text-muted-foreground">
              {message.metadata.model}
            </span>
          )}
          {message.metadata?.latenciaMs && (
            <span className="text-xs text-muted-foreground">
              {(message.metadata.latenciaMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>
        <Card>
          <CardContent className="p-3">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
            {message.sources && message.sources.length > 0 && (
              <div className="mt-3 border-t border-border pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSources(!showSources)}
                  className="h-6 px-2 text-xs"
                >
                  <BookOpen className="h-3 w-3 mr-1" />
                  {message.sources.length} {message.sources.length === 1 ? 'fonte' : 'fontes'}
                  {showSources ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                </Button>
                {showSources && (
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {message.sources.map((s, i) => (
                      <div key={i} className="border-l-2 border-border pl-2">
                        {s.content.slice(0, 200)}...
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {onFeedback && (
              <div className="mt-2 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => onFeedback(true)}
                >
                  👍
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => onFeedback(false)}
                >
                  👎
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: ptBR })}
        </p>
      </div>
    </div>
  );
}

interface ChatInputProps {
  onSend: (message: string) => void;
  loading?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, loading, placeholder = 'Pergunte algo aos seus agentes...' }: ChatInputProps) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!value.trim() || loading) return;
    onSend(value);
    setValue('');
    setTimeout(() => ref.current?.focus(), 0);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2">
      <Textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        rows={2}
        className="flex-1 resize-none"
        disabled={loading}
      />
      <Button onClick={handleSend} disabled={!value.trim() || loading} size="icon" className="h-10 w-10">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
    </div>
  );
}

interface ChatMessagesProps {
  messages: ChatMessageType[];
  loading?: boolean;
  onFeedback?: (messageId: string, positivo: boolean) => void;
}

export function ChatMessages({ messages, loading, onFeedback }: ChatMessagesProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto p-2">
      {messages.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Comece uma conversa com os agentes</p>
        </div>
      )}
      {messages.map((m) => (
        <ChatMessageComponent
          key={m.id}
          message={m}
          isUser={m.role === 'user'}
          onFeedback={onFeedback ? (positivo) => onFeedback(m.id, positivo) : undefined}
        />
      ))}
      {loading && (
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-20 flex-1 max-w-[80%]" />
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
