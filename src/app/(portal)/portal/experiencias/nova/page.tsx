import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExperienceForm } from "@/components/portal/experiences/ExperienceForm";
import { getDictionary } from "@/i18n/dictionaries";
import { isOverseer } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";
import { listProjectOptions } from "@/lib/portal/queries/content";

export const metadata: Metadata = { title: "Nova experiência" };

export default async function NewExperiencePage() {
  const dict = getDictionary("pt").portal;
  const { profile } = await requireActiveProfile();
  if (!isOverseer(profile.global_role)) notFound();
  const projects = await listProjectOptions();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <h1 className="text-3xl font-black">{dict.experiences.formTitleNew}</h1>
      <div className="rounded-xl border border-line bg-surface p-6">
        <ExperienceForm dict={dict} projects={projects} cancelHref="/portal/experiencias" />
      </div>
    </div>
  );
}
