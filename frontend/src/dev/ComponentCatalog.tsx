/**
 * ComponentCatalog — catálogo visual de componentes
 *
 * Página standalone que renderiza todos os componentes com exemplos.
 * Útil para:
 * - Designer/Product Owner revisar visualmente
 * - QA verificar estado dos componentes
 * - Dev documentar uso
 *
 * USO:
 *   http://localhost:5173/__catalog
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SkeletonCard, SkeletonList, SkeletonTable } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SkipLink, VisuallyHidden, Heading, LiveRegion } from '@/components/a11y/AccessibleHeading';
import { KPICard, QuickAction } from '@/pages/dashboard/DashboardKPIs';
import { Activity, Trophy, Heart, AlertCircle, Info } from 'lucide-react';

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 mb-12 p-6 rounded-lg border border-border bg-card">
      <header>
        <Heading level={2}>{title}</Heading>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Demo({ title, code, children }: { title: string; code?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {code && <code className="text-xs text-muted-foreground">{code}</code>}
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

export function ComponentCatalog() {
  const [inputValue, setInputValue] = useState('');
  return (
    <div className="min-h-screen bg-background p-6 max-w-6xl mx-auto">
      <SkipLink targetId="catalog-main" />
      <header className="mb-8">
        <Heading level={1}>📚 Catálogo de Componentes</Heading>
        <p className="text-sm text-muted-foreground mt-2">
          Documentação visual dos componentes do Top Pickleball 50+
        </p>
      </header>

      <main id="catalog-main" tabIndex={-1} className="focus:outline-none">

        {/* UI Primitivos */}
        <Section title="UI Primitivos" description="Componentes base (shadcn-style)">
          <Demo title="Button" code="<Button variant='default'>Click me</Button>">
            <div className="flex flex-wrap gap-2">
              <Button>Default</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="secondary">Secondary</Button>
              <Button disabled>Disabled</Button>
            </div>
          </Demo>

          <Demo title="Badge" code="<Badge>Pickleball</Badge>">
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                Verde (success)
              </Badge>
            </div>
          </Demo>

          <Demo title="Input + Label" code="<Input />">
            <div className="space-y-2 max-w-md">
              <Label htmlFor="demo-input">Nome do treino</Label>
              <Input
                id="demo-input"
                placeholder="Ex: Treino de quadra"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Você digitou: {inputValue || '(nada)'}
              </p>
            </div>
          </Demo>

          <Demo title="Card" code="<Card>...</Card>">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card description</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Conteúdo do card aqui.</p>
              </CardContent>
            </Card>
          </Demo>
        </Section>

        {/* Loading */}
        <Section title="Loading States" description="Skeleton components para diferentes contextos">
          <Demo title="SkeletonCard">
            <SkeletonCard />
          </Demo>
          <Demo title="SkeletonList">
            <SkeletonList count={3} />
          </Demo>
          <Demo title="SkeletonTable (5 rows × 4 cols)">
            <SkeletonTable rows={5} cols={4} />
          </Demo>
        </Section>

        {/* Empty States */}
        <Section title="Empty States" description="Estados vazios com ilustração SVG e CTA opcional">
          <div className="grid md:grid-cols-2 gap-4">
            <EmptyState
              illustration="training"
              title="Nenhum treino"
              description="Registre seu primeiro treino."
              action={<Button>Adicionar treino</Button>}
            />
            <EmptyState
              illustration="match"
              title="Nenhuma partida"
              description="Registre sua primeira partida."
            />
            <EmptyState
              illustration="sleep"
              title="Sem registros de sono"
              description="Acompanhe seu sono para melhor performance."
            />
            <EmptyState
              illustration="trophy"
              title="Nenhum torneio"
              description="Cadastre seus torneios."
            />
          </div>
        </Section>

        {/* Navigation */}
        <Section title="Navegação" description="Componentes de navegação hierárquica">
          <Demo title="Breadcrumbs (gera automático da URL)">
            <div className="border rounded p-4 bg-background">
              <Breadcrumbs />
            </div>
            <p className="text-xs text-muted-foreground">
              Acesse /app/treinamento/sessoes em produção para ver em ação.
            </p>
          </Demo>
        </Section>

        {/* A11y */}
        <Section title="Acessibilidade (A11y)" description="Helpers de WCAG 2.1">
          <Demo title="SkipLink" code="<SkipLink targetId='main' />">
            <p className="text-sm text-muted-foreground">
              ⌨️ Pressione Tab no início da página para ver o link "Pular para o conteúdo" aparecer.
            </p>
          </Demo>

          <Demo title="VisuallyHidden" code="<VisuallyHidden>Descrição para screen reader</VisuallyHidden>">
            <p className="text-sm">
              Visível:{' '}
              <span>Você pode me ver</span>
              <VisuallyHidden> + (Conteúdo oculto acessível apenas a screen readers)</VisuallyHidden>
            </p>
          </Demo>

          <Demo title="Heading levels" code="<Heading level={1-6}>Título</Heading>">
            <div className="space-y-2">
              <Heading level={1}>H1 - Título principal</Heading>
              <Heading level={2}>H2 - Subtítulo</Heading>
              <Heading level={3}>H3 - Seção</Heading>
              <Heading level={4}>H4 - Sub-seção</Heading>
              <Heading level={5}>H5 - Label</Heading>
              <Heading level={6}>H6 - Pequeno label</Heading>
            </div>
          </Demo>

          <Demo title="LiveRegion" code="<LiveRegion message='Salvo!' />">
            <LiveRegion message="Toast announcer: Esta mensagem é anunciada para screen readers quando atualizada" />
            <p className="text-sm text-muted-foreground">
              (verifique com screen reader — botão vai dizer "Toast announcer: ...")
            </p>
          </Demo>
        </Section>

        {/* Dashboard KPIs */}
        <Section title="Dashboard KPIs" description="Componentes do Dashboard principal">
          <Demo title="KPICard (vários states)">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KPICard label="Treinos (7d)" value="4" icon={Activity} color="emerald" link="/app/treinos" />
              <KPICard label="Partidas" value="12" icon={Trophy} color="amber" link="/app/partidas" />
              <KPICard label="Sono" value="7.5h" icon={Heart} color="rose" />
              <KPICard label="Alerta" value="2" icon={AlertCircle} color="amber" />
            </div>
          </Demo>

          <Demo title="QuickAction" code="<QuickAction href='...' icon={X} label='...' color='...' />">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl">
              <QuickAction href="#" icon={Activity} label="Treino" color="emerald" />
              <QuickAction href="#" icon={Trophy} label="Partida" color="amber" />
              <QuickAction href="#" icon={Heart} label="Sono" color="rose" />
              <QuickAction href="#" icon={Info} label="Info" color="blue" />
            </div>
          </Demo>
        </Section>

        {/* Ícones */}
        <Section title="Ícones (lucide-react)" description="Mais de 100 ícones usados no app">
          <Demo title="Ícones comuns">
            <div className="flex flex-wrap gap-4">
              {[
                { Icon: Activity, name: 'Activity' },
                { Icon: Trophy, name: 'Trophy' },
                { Icon: Heart, name: 'Heart' },
                { Icon: AlertCircle, name: 'AlertCircle' },
                { Icon: Info, name: 'Info' },
              ].map(({ Icon, name }) => (
                <div key={name} className="flex flex-col items-center gap-1">
                  <Icon className="h-6 w-6" />
                  <span className="text-xs">{name}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Veja <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" className="underline">lucide.dev</a> para a lista completa.
            </p>
          </Demo>
        </Section>

        {/* Tipografia */}
        <Section title="Tipografia" description="Sistema de tipografia para 50+ (font-size 16.5px base)">
          <Demo title="Hierarquia">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">text-4xl — Headline principal</h1>
              <h2 className="text-2xl font-bold">text-2xl — Subtítulo</h2>
              <h3 className="text-xl font-semibold">text-xl — Seção</h3>
              <p className="text-base">text-base — Corpo (16.5px)</p>
              <p className="text-sm text-muted-foreground">text-sm — Caption</p>
              <p className="text-xs text-muted-foreground">text-xs — Helper text</p>
            </div>
          </Demo>
        </Section>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground py-8">
          <p>📚 Catálogo de Componentes · Top Pickleball 50+</p>
          <p className="text-xs mt-1">
            Sprint 12 · Para abrir: <code>http://localhost:5173/__catalog</code>
          </p>
        </footer>
      </main>
    </div>
  );
}

export default ComponentCatalog;
