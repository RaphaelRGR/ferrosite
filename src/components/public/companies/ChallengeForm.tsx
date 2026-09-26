"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { localizePath, type Locale } from "@/i18n/config";
import { Textarea } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { LinkButton } from "@/components/ui/LinkButton";
import { CAPABILITY_IDS } from "@/content/capabilities";
import type { Dictionary } from "@/i18n/dictionaries";
import { submitChallenge, type ChallengeSubmitState } from "@/lib/crm/public-actions";
import type { ChallengeField } from "@/lib/crm/challenge-form";

const INITIAL: ChallengeSubmitState = {};

/**
 * Formulário público "Tenho um desafio" (13/21): campos mínimos, áreas da
 * taxonomia, confidencialidade, consentimento obrigatório, honeypot e tempo
 * mínimo. Confirmação mostra só o protocolo. Funciona sem JS (form nativo).
 */
export function ChallengeForm({ dict, capabilityNames, locale, backHref }: { dict: Dictionary["companies"]["form"]; capabilityNames: Dictionary["capabilities"]; locale: string; backHref: string }) {
  const [state, formAction, pending] = useActionState(submitChallenge, INITIAL);
  // Carimbo de início para o tempo mínimo; estável durante a vida do componente.
  const [startedAt] = useState(() => Date.now());
  const err = (f: ChallengeField) => (state.error === "invalid" && state.fields?.includes(f) ? dict.errorField : undefined);
  // React 19 limpa o form após a action; em erro, repomos o que a pessoa digitou (mesmo navegador, nada persistido).
  const v = state.values;

  if (state.protocol) {
    return (
      <div role="status" className="flex flex-col gap-4 rounded-2xl border border-success bg-surface p-8">
        <h2 className="text-2xl font-black">{dict.successTitle}</h2>
        <p className="text-fg-muted">{dict.successDescription}</p>
        <p className="text-sm font-bold uppercase tracking-widest text-fg-muted">{dict.protocol}</p>
        <p className="font-mono text-2xl font-black" data-testid="protocol">
          {state.protocol}
        </p>
        <div className="flex flex-wrap gap-3">
          <LinkButton href={backHref} variant="secondary">
            {dict.backToCompanies}
          </LinkButton>
        </div>
      </div>
    );
  }

  const topError =
    state.error === "invalid" ? dict.errorInvalid : state.error === "rate" ? dict.errorRate : state.error === "unavailable" ? dict.errorUnavailable : state.error === "server" ? dict.errorServer : null;

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate={false}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="startedAt" value={startedAt} />
      {/* honeypot: invisível e fora da ordem de tabulação; humanos não preenchem */}
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {topError && (
        <p role="alert" className="rounded-lg border border-danger bg-surface px-4 py-3 text-sm font-bold text-danger">
          {topError}
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label={dict.organizationName} name="organizationName" required minLength={2} maxLength={200} autoComplete="organization" defaultValue={v?.organizationName} error={err("organizationName")} />
        <Input label={dict.contactName} name="contactName" required minLength={2} maxLength={160} autoComplete="name" defaultValue={v?.contactName} error={err("contactName")} />
        <Input label={dict.contactEmail} name="contactEmail" type="email" required maxLength={254} autoComplete="email" defaultValue={v?.contactEmail} error={err("contactEmail")} />
        <Input label={dict.contactPhone} name="contactPhone" type="tel" maxLength={20} autoComplete="tel" defaultValue={v?.contactPhone} error={err("contactPhone")} />
      </div>
      <Input label={dict.challengeTitle} name="title" required minLength={5} maxLength={200} help={dict.challengeTitleHelp} defaultValue={v?.title} error={err("title")} />
      <Textarea label={dict.challengeDescription} name="description" required minLength={20} maxLength={6000} rows={7} help={dict.challengeDescriptionHelp} defaultValue={v?.description} error={err("description")} />
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-bold">{dict.capabilities}</legend>
        <p className="text-xs text-fg-muted">{dict.capabilitiesHelp}</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITY_IDS.map((id) => (
            <label key={id} className="flex min-h-10 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm">
              <input type="checkbox" name="capabilityIds" value={id} defaultChecked={v?.capabilityIds.includes(id)} className="size-4 accent-[var(--color-action)]" />
              {capabilityNames[id]}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="confidentiality" defaultChecked={v?.confidentiality} className="mt-1 size-4 accent-[var(--color-action)]" />
        <span>
          {dict.confidentiality}
          <span className="block text-xs text-fg-muted">{dict.confidentialityHelp}</span>
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="consent" required aria-invalid={err("consent") ? true : undefined} className="mt-1 size-4 accent-[var(--color-action)]" />
        <span>
          {dict.consent}
          {err("consent") && (
            <span role="alert" className="block text-xs font-bold text-danger">
              {dict.errorField}
            </span>
          )}
        </span>
      </label>
      <p className="text-xs text-fg-muted">
        {dict.privacy}{" "}
        <Link href={localizePath(locale as Locale, "/privacidade")} className="rounded font-bold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {dict.privacyLink}
        </Link>
      </p>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={pending}>
          {dict.submit}
        </Button>
        <LinkButton href={backHref} variant="secondary">
          {dict.backToCompanies}
        </LinkButton>
      </div>
    </form>
  );
}
