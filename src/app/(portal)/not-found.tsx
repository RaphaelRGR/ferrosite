import { LinkButton } from "@/components/ui/LinkButton";
import { getDictionary } from "@/i18n/dictionaries";

export default function PortalNotFound() {
  const dict = getDictionary("pt").portal.notFound;
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-black">{dict.title}</h1>
      <p className="text-fg-muted">{dict.description}</p>
      <LinkButton href="/portal" variant="secondary">
        {dict.back}
      </LinkButton>
    </div>
  );
}
