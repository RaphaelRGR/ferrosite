/**
 * Estado devolvido por Server Actions do Portal (React `useActionState`).
 * `error` é uma chave do catálogo (portal.errors) ou uma mensagem do banco
 * (guards/RLS) — nunca expõe detalhes internos além da mensagem da exceção.
 */
export type ActionError = "unauthenticated" | "forbidden" | "invalid" | "conflict" | "not_found" | "server" | `db:${string}`;

export interface ActionState {
  error?: ActionError;
  ok?: boolean;
  /** Campo inválido (para foco/aria) quando `error === "invalid"`. */
  field?: string;
  /** Valores digitados, devolvidos em erro: o React 19 limpa o form após a action e a pessoa não pode perder o texto. */
  values?: Record<string, string>;
  /** Registro criado (quando a ação cria algo e a tela quer oferecer o link). */
  id?: string;
}

const CONTROL_FIELDS = new Set(["id", "version", "from", "to", "slug", "project_id", "profile_id", "item_id", "op", "done", "position", "organization_id", "contact_id"]);

/** Ecoa os campos de texto do formulário (mesmo navegador; nada persistido) para repovoar em erro. */
export function echoValues(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string" && !CONTROL_FIELDS.has(k)) out[k] = v;
  return out;
}

export function fail(fd: FormData, state: ActionState): ActionState {
  return { ...state, values: echoValues(fd) };
}

export const IDLE: ActionState = {};

/** Traduz erro do Postgres/PostgREST em ActionError legível (mensagens de guard viram `db:<mensagem>`). */
export function dbError(error: { code?: string; message: string } | null): ActionError {
  if (!error) return "server";
  if (/row-level security|permission denied/.test(error.message)) return "forbidden";
  // 42501 vindo de um guard nosso traz a razão em português (ex.: "autor não aprova o próprio conteúdo"): mostrar.
  if (error.code === "42501") return `db:${error.message}`;
  if (error.code === "23505") return "db:já existe um registro com esse identificador";
  if (error.code === "23514" || /transição|reatribua|responsável precisa|não pode mudar/.test(error.message)) return `db:${error.message}`;
  return `db:${error.message}`;
}
