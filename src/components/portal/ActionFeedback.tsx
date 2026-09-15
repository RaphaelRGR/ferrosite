import type { ActionState } from "@/lib/portal/action-state";
import type { Dictionary } from "@/i18n/dictionaries";

/** Mensagem de erro/sucesso de uma Server Action, textual e anunciada (07/23). */
export function ActionFeedback({ state, dict }: { state: ActionState; dict: Dictionary["portal"] }) {
  if (state.error) {
    const text = state.error.startsWith("db:") ? state.error.slice(3) : dict.errors[state.error as keyof Dictionary["portal"]["errors"]];
    return (
      <p role="alert" className="rounded-lg border border-danger bg-surface px-4 py-3 text-sm font-bold text-danger">
        {text}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p role="status" className="rounded-lg border border-success bg-surface px-4 py-3 text-sm font-bold text-success">
        {dict.common.saved}
      </p>
    );
  }
  return null;
}

export function fieldError(state: ActionState, field: string, dict: Dictionary["portal"]): string | undefined {
  return state.error === "invalid" && state.field === field ? dict.errors.invalid : state.error === "not_found" && state.field === field ? dict.errors.not_found : undefined;
}
