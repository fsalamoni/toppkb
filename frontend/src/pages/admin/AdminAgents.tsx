import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function AdminAgents() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração dos Agentes</CardTitle>
        <CardDescription>
          Edite skills, habilite/desabilite agentes e configure modelo LLM por agente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Para configurar agentes, use a função <code>adminSaveAgentsConfig</code> via API ou
          o console do Firestore (collection <code>admin-config/agents</code>).
          A UI completa de edição está em desenvolvimento.
        </p>
      </CardContent>
    </Card>
  );
}
