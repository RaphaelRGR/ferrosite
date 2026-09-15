import { redirect } from "next/navigation";

/** Rota legada do protótipo: o acervo virou Arquivos (FILE-001). Redirect preserva links antigos (28). */
export default function PortalAcervoPage() {
  redirect("/portal/arquivos");
}
