import type { Metadata } from "next";
import { DEFAULT_LOCALE, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";
import { HomeContent } from "./HomeContent";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const dict = getDictionary(l);
  return { ...publicPageMetadata(l, "/", { title: dict.site.name }), title: { absolute: dict.site.name } };
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const dict = getDictionary(l);
  return <HomeContent locale={l} dict={dict} showEditorial={l === "pt"} />;
}
