import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrganizationForm } from "@/components/portal/crm/CrmForms";
import { getDictionary } from "@/i18n/dictionaries";
import { isOverseer } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";

export const metadata: Metadata = { title: "Nova organização" };

export default async function NewOrganizationPage() {
  const dict = getDictionary("pt").portal;
  const { profile } = await requireActiveProfile();
  if (!isOverseer(profile.global_role)) notFound();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <h1 className="text-3xl font-black">{dict.crm.newOrganization}</h1>
      <div className="rounded-xl border border-line bg-surface p-6">
        <OrganizationForm dict={dict} cancelHref="/portal/empresas" />
      </div>
    </div>
  );
}
