import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProcessForm } from "@/components/portal/work-items/ProcessForm";
import { findTemplate } from "@/content/work-templates";
import { getDictionary } from "@/i18n/dictionaries";
import { isOverseer } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";
import { listAssignablePeople, quickCreateOptions } from "@/lib/portal/queries/work-items";
import { offsetLabel } from "@/lib/portal/work-items";

export const metadata: Metadata = { title: "Novo processo" };

/** Criar processo: formulário curto + prévia das ações que o modelo vai gerar, etapa por etapa. */
export default async function NewProcessPage({ searchParams }: PageProps<"/portal/acoes/processos/novo">) {
  const dict = getDictionary("pt").portal;
  const p = dict.workItems.processes;
  const { profile, userId } = await requireActiveProfile();
  if (!isOverseer(profile.global_role)) notFound();
  const sp = await searchParams;
  const template = findTemplate(String(sp.modelo ?? ""));
  if (!template) notFound();
  const [options, people] = await Promise.all([quickCreateOptions(userId, dict.roles), listAssignablePeople()]);
  const needsApprover = template.phases.some((ph) => ph.items.some((i) => i.approval));
  // aprovador sugerido: alguém da coordenação que não seja quem está criando
  const defaultApprover = people.find((x) => x.global_role === "coordination" && x.id !== userId)?.id;
  const offsetText = (d: number | null) => {
    const o = offsetLabel(d);
    return p.form.offset[o.key].replace("{days}", String(o.days));
  };

  return (
    <div className="flex flex-col gap-8">
      <header>
        <Link href="/portal/acoes/processos" className="text-xs font-bold uppercase tracking-[0.2em] text-fg-muted underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {p.title}
        </Link>
        <h1 className="mt-1 text-3xl font-black">{template.name}</h1>
        <p className="mt-1 max-w-3xl text-sm text-fg-muted">{template.description}</p>
      </header>

      <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
        <ProcessForm dict={dict} templateKey={template.key} eventLabel={template.eventLabel} titlePlaceholder={template.titlePlaceholder} needsApprover={needsApprover} options={options} defaultApprover={defaultApprover} />
      </section>

      <section aria-labelledby="previa">
        <h2 id="previa" className="text-lg font-bold">{p.form.preview}</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {template.phases.map((ph) => (
            <div key={ph.key} className="rounded-xl border border-line bg-surface p-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-fg-muted">{ph.label}</h3>
              <ul className="mt-2 flex flex-col gap-1.5 text-sm">
                {ph.items.map((i) => (
                  <li key={i.title} className="flex flex-wrap items-baseline justify-between gap-2">
                    <span>
                      {i.title}
                      {i.approval && <span className="ml-1 text-xs font-bold text-info">({p.form.approvalTag})</span>}
                      {i.checklist && <span className="block text-xs text-fg-muted">{i.checklist.join(" · ")}</span>}
                    </span>
                    <span className="text-xs text-fg-muted">{offsetText(i.offsetDays)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
