/**
 * Página CRUD genérica para coleções simples.
 * Use para: Forca, Mobilidade, Cardio, Agua, Suplementos, Medidas, Estudos, Metas.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'time' | 'datetime-local' | 'textarea' | 'select' | 'range';
  required?: boolean;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: any;
}

export interface GenericCRUDPageProps {
  titulo: string;
  icone: string;
  colecao: string;
  campos: FieldDef[];
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  renderItem?: (item: any) => React.ReactNode;
  validateForm?: (form: any) => string | null;
}

export function GenericCRUDPage({
  titulo,
  icone,
  colecao,
  campos,
  orderByField = 'data',
  orderDirection = 'desc',
  renderItem,
  validateForm,
}: GenericCRUDPageProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const initialForm: any = {};
  campos.forEach((c) => {
    initialForm[c.name] = c.type === 'date' || c.type === 'datetime-local'
      ? new Date().toISOString().slice(0, c.type === 'date' ? 10 : 16)
      : c.defaultValue ?? (c.type === 'number' || c.type === 'range' ? 0 : '');
  });
  const [form, setForm] = useState(initialForm);

  const { data, isLoading } = useQuery({
    queryKey: [colecao, user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(collection(db, 'users', user.uid, colecao), orderBy(orderByField, orderDirection));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
    enabled: !!user,
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (validateForm) {
        const err = validateForm(form);
        if (err) throw new Error(err);
      }
      const payload: any = { ...form, createdAt: serverTimestamp() };
      // converte data string para ISO
      campos.forEach((c) => {
        if (c.type === 'date' || c.type === 'datetime-local') {
          payload[c.name] = form[c.name] ? new Date(form[c.name]).toISOString() : null;
        }
        if (c.type === 'number' || c.type === 'range') {
          payload[c.name] = Number(form[c.name]);
        }
      });
      await addDoc(collection(db, 'users', user.uid, colecao), payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [colecao] });
      setOpen(false);
      setForm(initialForm);
      toast({ title: 'Registrado!', variant: 'success' });
    },
    onError: (e: any) => {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{icone} {titulo}</h1>
        <Button onClick={() => setOpen(!open)}>
          <Plus className="h-4 w-4" /> {open ? 'Cancelar' : 'Novo registro'}
        </Button>
      </div>

      {open && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            {campos.map((c) => (
              <div key={c.name}>
                <Label>{c.label}{c.required && ' *'}</Label>
                {c.type === 'textarea' ? (
                  <Textarea
                    value={form[c.name]}
                    onChange={(e) => setForm({ ...form, [c.name]: e.target.value })}
                  />
                ) : c.type === 'select' ? (
                  <select
                    value={form[c.name]}
                    onChange={(e) => setForm({ ...form, [c.name]: e.target.value })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {c.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : c.type === 'range' ? (
                  <>
                    <input
                      type="range"
                      min={c.min}
                      max={c.max}
                      step={c.step}
                      value={form[c.name]}
                      onChange={(e) => setForm({ ...form, [c.name]: Number(e.target.value) })}
                      className="w-full"
                    />
                    <div className="text-xs text-muted-foreground">Valor: {form[c.name]}</div>
                  </>
                ) : (
                  <Input
                    type={c.type}
                    min={c.min}
                    max={c.max}
                    step={c.step}
                    required={c.required}
                    value={form[c.name]}
                    onChange={(e) => setForm({ ...form, [c.name]: e.target.value })}
                  />
                )}
              </div>
            ))}
            <Button onClick={() => add.mutate()} disabled={add.isPending} className="w-full">
              {add.isPending ? 'Salvando...' : 'Registrar'}
            </Button>
          </CardContent>
        </Card>
      )}

      {data && data.length === 0 ? (
        <EmptyState icone={icone} titulo={`Nenhum registro de ${titulo.toLowerCase()}`} />
      ) : (
        <div className="space-y-2">
          {data?.map((item: any) => (
            <Card key={item.id}>
              <CardContent className="pt-6">
                {renderItem ? renderItem(item) : (
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {item[orderByField] ? formatDate(item[orderByField]) : ''}
                    </div>
                    <pre className="text-xs mt-2 overflow-x-auto">
                      {JSON.stringify(item, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
