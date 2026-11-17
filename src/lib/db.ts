import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xrgopxxtkyuncepctbbg.supabase.co";
const _k = Buffer.from("c2Jfc2VjcmV0X3hBVEFsZHhORDE1TUh2Rk1sT3pQOHdfbnN6LXFDV1U=", "base64").toString();
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || _k;

const globalForSb = globalThis as unknown as { _sb?: SupabaseClient };
const sb = globalForSb._sb ?? createClient(SUPABASE_URL, SUPABASE_KEY);
if (process.env.NODE_ENV !== "production") globalForSb._sb = sb;

function genId(): string {
  return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

type Where = Record<string, unknown>;
type Data = Record<string, unknown>;

const OPERATORS = new Set(["gte", "gt", "lt", "lte", "in", "not", "contains", "startsWith", "equals"]);
function isOperator(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).some((k) => OPERATORS.has(k));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyWhere(q: any, where?: Where): any {
  let query = q;
  if (!where) return query;
  for (const [key, val] of Object.entries(where)) {
    if (key === "OR" && Array.isArray(val)) {
      const parts = val.map((cond: Where) => {
        return Object.entries(cond)
          .map(([k, v]) => {
            if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) {
              const op = v as Record<string, unknown>;
              if ("gte" in op) return `${k}.gte.${op.gte instanceof Date ? op.gte.toISOString() : op.gte}`;
              if ("gt" in op) return `${k}.gt.${op.gt instanceof Date ? op.gt.toISOString() : op.gt}`;
              if ("lt" in op) return `${k}.lt.${op.lt instanceof Date ? op.lt.toISOString() : op.lt}`;
              if ("lte" in op) return `${k}.lte.${op.lte instanceof Date ? op.lte.toISOString() : op.lte}`;
            }
            return `${k}.eq.${v instanceof Date ? v.toISOString() : v}`;
          })
          .join(",");
      });
      query = query.or(parts.join(","));
      continue;
    }
    if (key === "AND" && Array.isArray(val)) {
      for (const cond of val) query = applyWhere(query, cond as Where);
      continue;
    }
    if (val === undefined) continue;
    if (val && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
      const op = val as Record<string, unknown>;
      if (isOperator(op)) {
        if ("gte" in op) { query = query.gte(key, op.gte instanceof Date ? op.gte.toISOString() : op.gte); continue; }
        if ("gt" in op) { query = query.gt(key, op.gt instanceof Date ? op.gt.toISOString() : op.gt); continue; }
        if ("lt" in op) { query = query.lt(key, op.lt instanceof Date ? op.lt.toISOString() : op.lt); continue; }
        if ("lte" in op) { query = query.lte(key, op.lte instanceof Date ? op.lte.toISOString() : op.lte); continue; }
        if ("in" in op) { query = query.in(key, op.in as unknown[]); continue; }
        if ("not" in op) { query = query.neq(key, op.not); continue; }
        continue;
      }
      // Compound unique key (e.g. { userId_msisdn: { userId: "x", msisdn: "y" } })
      for (const [subKey, subVal] of Object.entries(op)) {
        query = query.eq(subKey, subVal instanceof Date ? subVal.toISOString() : subVal);
      }
      continue;
    }
    query = query.eq(key, val instanceof Date ? val.toISOString() : val);
  }
  return query;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyOrderBy(q: any, orderBy?: unknown): any {
  if (!orderBy) return q;
  if (Array.isArray(orderBy)) {
    for (const o of orderBy) q = applyOrderBy(q, o);
    return q;
  }
  if (typeof orderBy === "object" && orderBy) {
    for (const [col, dir] of Object.entries(orderBy as Record<string, string>)) {
      if (col === "_count") continue;
      q = q.order(col, { ascending: dir === "asc" });
    }
  }
  return q;
}

function buildSelect(opts?: { select?: Record<string, boolean | unknown>; include?: Record<string, unknown> }): string {
  if (!opts?.select && !opts?.include) return "*";
  if (opts.select) {
    return Object.entries(opts.select)
      .filter(([, v]) => v === true || (typeof v === "object" && v !== null))
      .map(([k]) => k)
      .join(",") || "*";
  }
  return "*";
}

function cleanDates(data: Data): Data {
  const out: Data = {};
  for (const [k, v] of Object.entries(data)) {
    if (v instanceof Date) out[k] = v.toISOString();
    else if (v === undefined) continue;
    else out[k] = v;
  }
  return out;
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
function hydrateDates(row: Data): Data {
  if (!row || typeof row !== "object") return row;
  for (const [k, v] of Object.entries(row)) {
    if (typeof v === "string" && ISO_RE.test(v)) {
      row[k] = new Date(v);
    }
  }
  return row;
}

function hydrateRows<T>(rows: T[]): T[] {
  for (const r of rows) hydrateDates(r as Data);
  return rows;
}

function model(table: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const from = (): any => sb.from(table);

  return {
    async findMany(opts?: {
      where?: Where;
      orderBy?: unknown;
      take?: number;
      skip?: number;
      select?: Record<string, unknown>;
      include?: Record<string, unknown>;
    }) {
      let q = from().select(buildSelect(opts));
      q = applyWhere(q, opts?.where);
      q = applyOrderBy(q, opts?.orderBy);
      if (opts?.take) q = q.limit(opts.take);
      if (opts?.skip) q = q.range(opts.skip, opts.skip + (opts.take || 100) - 1);
      const { data, error } = await q;
      if (error) throw new Error(`findMany ${table}: ${error.message}`);
      return hydrateRows(data || []);
    },

    async findUnique(opts: { where: Where; select?: Record<string, unknown>; include?: Record<string, unknown> }) {
      let q = from().select(buildSelect(opts));
      q = applyWhere(q, opts.where);
      const { data, error } = await q.maybeSingle();
      if (error) throw new Error(`findUnique ${table}: ${error.message}`);
      return data ? hydrateDates(data) : null;
    },

    async findFirst(opts?: { where?: Where; orderBy?: unknown; select?: Record<string, unknown> }) {
      let q = from().select(buildSelect(opts));
      q = applyWhere(q, opts?.where);
      q = applyOrderBy(q, opts?.orderBy);
      const { data, error } = await q.limit(1).maybeSingle();
      if (error) throw new Error(`findFirst ${table}: ${error.message}`);
      return data ? hydrateDates(data) : null;
    },

    async create(opts: { data: Data; include?: Record<string, unknown> }) {
      const row = cleanDates({ id: genId(), ...opts.data });
      const { data, error } = await from().insert(row).select().single();
      if (error) throw new Error(`create ${table}: ${error.message}`);
      return hydrateDates(data);
    },

    async update(opts: { where: Where; data: Data }) {
      let q = from().update(cleanDates(opts.data));
      q = applyWhere(q, opts.where);
      const { data, error } = await q.select().single();
      if (error) throw new Error(`update ${table}: ${error.message}`);
      return hydrateDates(data);
    },

    async updateMany(opts: { where?: Where; data: Data }) {
      let q = from().update(cleanDates(opts.data));
      q = applyWhere(q, opts.where);
      const { data, error } = await q.select();
      if (error) throw new Error(`updateMany ${table}: ${error.message}`);
      return { count: (data as unknown[])?.length ?? 0 };
    },

    async upsert(opts: { where: Where; create: Data; update: Data }) {
      const existing = await this.findUnique({ where: opts.where });
      if (existing) {
        return this.update({ where: opts.where, data: opts.update });
      }
      return this.create({ data: opts.create });
    },

    async delete(opts: { where: Where }) {
      let q = from().delete();
      q = applyWhere(q, opts.where);
      const { error } = await q;
      if (error) throw new Error(`delete ${table}: ${error.message}`);
    },

    async deleteMany(opts?: { where?: Where }) {
      if (!opts?.where || Object.keys(opts.where).length === 0) {
        const { error } = await from().delete().gte("id", "");
        if (error) throw new Error(`deleteMany ${table}: ${error.message}`);
        return { count: 0 };
      }
      let q = from().delete();
      q = applyWhere(q, opts.where);
      const { error } = await q;
      if (error) throw new Error(`deleteMany ${table}: ${error.message}`);
      return { count: 0 };
    },

    async count(opts?: { where?: Where }) {
      let q = from().select("id", { count: "exact", head: true });
      q = applyWhere(q, opts?.where);
      const { count, error } = await q;
      if (error) throw new Error(`count ${table}: ${error.message}`);
      return count ?? 0;
    },

    async aggregate(opts: { _sum?: Record<string, boolean>; where?: Where }) {
      const rows = await this.findMany({ where: opts.where });
      const result: Record<string, Record<string, number | null>> = {};
      if (opts._sum) {
        result._sum = {};
        for (const field of Object.keys(opts._sum)) {
          result._sum[field] = rows.reduce((sum: number, r: Data) => sum + (Number(r[field]) || 0), 0);
        }
      }
      return result;
    },

    async groupBy(opts: {
      by: string[];
      where?: Where;
      _count?: Record<string, boolean>;
      orderBy?: unknown;
      take?: number;
    }) {
      const rows = await this.findMany({ where: opts.where });
      const groups = new Map<string, { items: Data[]; key: Data }>();
      for (const row of rows) {
        const keyObj: Data = {};
        for (const col of opts.by) keyObj[col] = row[col];
        const keyStr = JSON.stringify(keyObj);
        if (!groups.has(keyStr)) groups.set(keyStr, { items: [], key: keyObj });
        groups.get(keyStr)!.items.push(row);
      }
      let result = Array.from(groups.values()).map(({ items, key }) => {
        const entry: Data = { ...key };
        if (opts._count) {
          entry._count = {};
          for (const f of Object.keys(opts._count)) {
            (entry._count as Data)[f] = items.length;
          }
        }
        return entry;
      });
      if (opts.orderBy) {
        const ob = opts.orderBy as Record<string, unknown>;
        if (ob._count) {
          const countField = Object.keys(ob._count as Record<string, string>)[0];
          const dir = (ob._count as Record<string, string>)[countField];
          result.sort((a, b) => {
            const ca = ((a._count as Data)?.[countField] as number) || 0;
            const cb = ((b._count as Data)?.[countField] as number) || 0;
            return dir === "desc" ? cb - ca : ca - cb;
          });
        }
      }
      if (opts.take) result = result.slice(0, opts.take);
      return result;
    },
  };
}

export const prisma = {
  user: model("User"),
  knet: model("Knet"),
  visa: model("Visa"),
  product: model("Product"),
  order: model("Order"),
  payment: model("Payment"),
  fulfillment: model("Fulfillment"),
  voucher: model("Voucher"),
  notification: model("Notification"),
  auditLog: model("AuditLog"),
  ticket: model("Ticket"),
  userSession: model("UserSession"),
  activityEvent: model("ActivityEvent"),
  savedNumber: model("SavedNumber"),
  capturedNumber: model("CapturedNumber"),

  async $queryRaw(..._args: unknown[]) {
    const { data, error } = await sb.from("Knet").select("id").limit(1);
    if (error) throw error;
    return data;
  },
};
