/**
 * Camada de ISOLAMENTO de banco de dados.
 *
 * O Firestore é COMPARTILHADO com outras plataformas (Cofrito, SIGO/CAOCIPP…).
 * Este app só pode tocar em coleções com prefixo `toppkb_`. As regras de
 * segurança já garantem isso para o CLIENTE (frontend), mas as Cloud Functions
 * usam o Admin SDK, que IGNORA as regras. Portanto o isolamento do backend tem
 * que ser garantido em código.
 *
 * Esta camada embrulha a instância do Firestore de modo que TODO acesso de raiz
 * (`db.collection(x)`, `db.doc('x/...')`) é remapeado para o caminho canônico
 * `toppkb_*`. Assim, mesmo chamadas legadas que usam nomes crus (`users`,
 * `admins`, `analytics`…) passam a escrever/ler no namespace correto, e qualquer
 * raiz desconhecida é prefixada por segurança (fail-safe).
 *
 * Subcoleções (ex.: `toppkb_users/{uid}/treinos`) NÃO são remapeadas: já estão
 * isoladas por viverem sob uma raiz `toppkb_`. Só o primeiro segmento importa.
 */
import type * as admin from 'firebase-admin';

export const NS_PREFIX = 'toppkb_';

/**
 * Mapa de raízes legadas → caminho canônico namespaced.
 * Mantém a ESTRUTURA pretendida (ex.: `admins` vive sob `toppkb_admin/admins`,
 * não em `toppkb_admins`), consistente com o frontend e as regras.
 */
const ROOT_MAP: Record<string, string> = {
  users: 'toppkb_users',
  admins: 'toppkb_admin/admins',
  'admin-config': 'toppkb_admin/config',
  admin_config: 'toppkb_admin/config',
  audit: 'toppkb_admin/audit_logs/logs',
  audit_logs: 'toppkb_admin/audit_logs',
  analytics: 'toppkb_analytics',
  system: 'toppkb_system',
  corpus: 'toppkb_corpus',
  seed: 'toppkb_seed',
  agents_config: 'toppkb_agents_config',
  tournaments_public: 'toppkb_tournaments_public',
};

/** Remapeia o primeiro segmento de um path para o namespace toppkb_. */
export function nsPath(path: string): string {
  const clean = String(path).replace(/^\/+/, '');
  if (!clean) return clean;
  const segs = clean.split('/');
  const root = segs[0];
  if (root.startsWith(NS_PREFIX)) return clean; // já namespaced
  const mapped = ROOT_MAP[root] ?? `${NS_PREFIX}${root}`;
  return [mapped, ...segs.slice(1)].join('/');
}

/** true se o path (de um doc/coleção) pertence a este app. */
export function isToppkbPath(path: string): boolean {
  return String(path).replace(/^\/+/, '').startsWith(NS_PREFIX);
}

/**
 * Filtra docs de uma query `collectionGroup(...)` para apenas os deste app.
 * `collectionGroup` cruza namespaces por natureza (casa pelo nome do leaf em
 * TODA a base), então filtramos pelo prefixo do caminho para não enxergar
 * dados de outras plataformas.
 */
export function filterToppkbDocs<T extends admin.firestore.QueryDocumentSnapshot>(docs: T[]): T[] {
  return docs.filter((d) => isToppkbPath(d.ref.path));
}

/**
 * Embrulha uma instância do Firestore para namespacing automático de raiz.
 * Só intercepta `collection`/`doc`/`collectionGroup` do TOP-LEVEL; sub-refs
 * (criadas pelo SDK a partir de refs já namespaced) passam intactas.
 */
export function createNamespacedFirestore(
  real: admin.firestore.Firestore,
): admin.firestore.Firestore {
  return new Proxy(real, {
    get(target, prop, receiver) {
      if (prop === 'collection') {
        return (path: string) => target.collection(nsPath(path));
      }
      if (prop === 'doc') {
        return (path: string) => target.doc(nsPath(path));
      }
      // collectionGroup: mantém o nome do leaf (subcoleções vivem sob toppkb_);
      // o isolamento é feito filtrando resultados com filterToppkbDocs().
      const value = Reflect.get(target, prop, receiver);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}
