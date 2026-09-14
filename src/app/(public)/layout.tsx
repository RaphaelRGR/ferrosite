import { PublicShell } from "@/components/layout/PublicShell";

/**
 * Layout do site público. As URLs não mudam: o route group só agrupa
 * as páginas que compartilham Navbar, <main> e footer públicos.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell>{children}</PublicShell>;
}
