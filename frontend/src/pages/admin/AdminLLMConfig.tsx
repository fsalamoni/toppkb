import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function AdminLLMConfig() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>LLM Global (Admin)</CardTitle>
        <CardDescription>
          Configure o provedor de LLM padrão para todos os usuários. Eles ainda podem
          sobrescrever com sua própria chave em Configurações → Meu LLM Pessoal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Use a página de Agentes para configurar o LLM por agente.
          Esta página é placeholder — configuração real está em <strong>Admin → Agentes</strong>.
        </p>
      </CardContent>
    </Card>
  );
}
