"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { LinkButton } from "@/components/ui/LinkButton";
import type { Dictionary } from "@/i18n/dictionaries";
import { IDLE, type ActionState } from "@/lib/portal/action-state";
import { createProject, updateProject } from "@/lib/portal/actions/projects";
import { CLASSIFICATIONS, PROJECT_CATEGORIES } from "@/lib/portal/authz";
import type { ProjectRow } from "@/lib/portal/projects";
import { ActionFeedback, fieldError } from "./ActionFeedback";

/** Formulário de projeto (criar/editar). Edição envia `version` para detectar edição concorrente (10). */
export function ProjectForm({ dict, project, cancelHref }: { dict: Dictionary["portal"]; project?: ProjectRow; cancelHref: string }) {
  const [state, formAction, pending] = useActionState(project ? updateProject : createProject, IDLE as ActionState);
  const p = dict.projects;
  const err = (f: string) => fieldError(state, f, dict);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {project && (
        <>
          <input type="hidden" name="id" value={project.id} />
          <input type="hidden" name="version" value={project.version} />
        </>
      )}
      <ActionFeedback state={state} dict={dict} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label={p.name} name="name" required minLength={2} maxLength={160} defaultValue={project?.name} error={err("name")} />
        <Input label={`${p.nameEn} (${dict.common.optional})`} name="name_en" maxLength={160} defaultValue={project?.name_en} />
      </div>
      {!project && <Input label={`${p.slug} (${dict.common.optional})`} name="slug" help={p.slugHelp} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} error={err("slug")} />}
      <Textarea label={p.summary} name="summary" maxLength={2000} defaultValue={project?.summary} />
      <Textarea label={`${p.summaryEn} (${dict.common.optional})`} name="summary_en" maxLength={2000} defaultValue={project?.summary_en} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          label={p.category}
          name="category"
          defaultValue={project?.category ?? "other"}
          options={PROJECT_CATEGORIES.map((c) => ({ value: c, label: dict.projectCategory[c] }))}
          error={err("category")}
        />
        <Select
          label={p.classification}
          name="classification"
          help={p.classificationHelp}
          defaultValue={project?.classification ?? "internal"}
          options={CLASSIFICATIONS.map((c) => ({ value: c, label: dict.classification[c] }))}
          error={err("classification")}
        />
        <Input label={p.startsOn} name="starts_on" type="date" defaultValue={project?.starts_on ?? ""} />
        <Input label={p.endsOn} name="ends_on" type="date" defaultValue={project?.ends_on ?? ""} error={err("ends_on")} />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={pending}>
          {project ? dict.common.save : dict.common.create}
        </Button>
        <LinkButton href={cancelHref} variant="secondary">
          {dict.common.cancel}
        </LinkButton>
      </div>
    </form>
  );
}
