import type { Metadata } from "next";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button, type ButtonVariant } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { LinkButton } from "@/components/ui/LinkButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { DialogDemo } from "./DialogDemo";

export const metadata: Metadata = {
  title: "Catálogo de componentes",
  description: "Tokens e primitivos de interface nos temas claro e escuro.",
  robots: { index: false, follow: false },
};

const VARIANTS: ButtonVariant[] = ["primary", "secondary", "ghost", "danger"];
const TONES: BadgeTone[] = ["neutral", "success", "warning", "danger", "info"];
const TOKENS = [
  ["canvas", "bg-canvas"],
  ["surface", "bg-surface"],
  ["surface-2", "bg-surface-2"],
  ["action", "bg-action"],
  ["accent", "bg-accent"],
  ["focus", "bg-focus"],
  ["success", "bg-success"],
  ["warning", "bg-warning"],
  ["danger", "bg-danger"],
  ["info", "bg-info"],
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">{title}</h3>
      {children}
    </section>
  );
}

/** Todos os primitivos e estados, renderizados uma vez por tema. */
function Showcase({ theme }: { theme: "light" | "dark" }) {
  return (
    <div
      data-theme={theme}
      className="flex flex-col gap-10 rounded-2xl border border-line bg-canvas p-6 text-fg sm:p-8"
    >
      <h2 className="text-2xl font-black">Tema {theme === "light" ? "claro" : "escuro"}</h2>

      <Section title="Tokens de cor">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {TOKENS.map(([name, cls]) => (
            <li key={name} className="flex flex-col gap-1 text-xs">
              <span className={`h-10 rounded-md border border-line ${cls}`} aria-hidden="true" />
              <code>{name}</code>
            </li>
          ))}
        </ul>
        <p className="text-fg-muted">Texto secundário sobre canvas.</p>
        <p className="text-2xl font-black text-accent">
          Acento só em texto grande (≥ 3:1) e detalhes decorativos; nunca em corpo (3,78:1 no claro).
        </p>
      </Section>

      <Section title="Botões">
        <div className="flex flex-wrap items-center gap-3">
          {VARIANTS.map((variant) => (
            <Button key={variant} variant={variant}>
              {variant}
            </Button>
          ))}
          <Button loading>Salvando</Button>
          <Button disabled>Desabilitado</Button>
          <Button size="sm">Pequeno</Button>
          <Button size="lg">Grande</Button>
          <LinkButton href="/design-system#conteudo" variant="secondary">
            LinkButton
          </LinkButton>
        </div>
      </Section>

      <Section title="Badges (ícone + rótulo, nunca só cor)">
        <div className="flex flex-wrap gap-2">
          {TONES.map((tone) => (
            <Badge key={tone} tone={tone}>
              {tone}
            </Badge>
          ))}
        </div>
      </Section>

      <Section title="Campos">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Padrão" placeholder="Digite algo" help="Texto de ajuda." />
          <Input label="Obrigatório" required defaultValue="valor" />
          <Input label="Com erro" defaultValue="abc" error="Informe um e-mail válido." />
          <Input label="Desabilitado" disabled defaultValue="indisponível" />
        </div>
      </Section>

      <Section title="Diálogo">
        <DialogDemo />
      </Section>

      <Section title="Carregando e vazio">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2" role="status" aria-label="Carregando exemplo">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <EmptyState
            title="Nenhum item ainda"
            description="Explique por que está vazio e ofereça a próxima ação permitida."
            action={<Button variant="secondary">Criar o primeiro</Button>}
          />
        </div>
      </Section>

      <Section title="Marca oficial (sempre sobre superfície clara)">
        <div className="flex flex-wrap items-end gap-6">
          <BrandLogo width={200} />
          <BrandLogo width={140} />
          <BrandLogo width={56} className="p-1" />
        </div>
      </Section>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-black">Catálogo de componentes</h1>
        <p className="max-w-prose text-fg-muted">
          Tokens semânticos e primitivos de <code>components/ui</code> em todos os estados, nos dois temas.
          Ferramenta de desenvolvimento: não indexada e fora da navegação.
        </p>
      </header>
      <div className="grid gap-8 xl:grid-cols-2">
        <Showcase theme="light" />
        <Showcase theme="dark" />
      </div>
    </div>
  );
}
