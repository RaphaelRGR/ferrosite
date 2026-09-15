import { notFound } from "next/navigation";

/** Qualquer caminho sem rota dentro do locale cai na not-found localizada. */
export default function CatchAll() {
  notFound();
}
