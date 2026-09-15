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
}

export const IDLE: ActionState = {};

/** Traduz erro do Postgres/PostgREST em ActionError legível (mensagens de guard viram `db:<mensagem>`). */
export function dbError(error: { code?: string; message: string } | null): ActionError {
  if (!error) return "server";
  if (error.code === "42501" || /row-level security/.test(error.message)) return "forbidden";
  if (error.code === "23505") return "db:já existe um registro com esse identificador";
  if (error.code === "23514" || /transição|reatribua|responsável precisa|não pode mudar/.test(error.message)) return `db:${error.message}`;
  return `db:${error.message}`;
}
