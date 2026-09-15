import { notFound } from "next/navigation";

/** Caminho sem rota dentro do Portal cai na not-found do Portal (dentro do shell). */
export default function PortalCatchAll() {
  notFound();
}
