import { COURSE_SHORTS } from "@/content/videos";

export interface ShortVideo {
  id: string;
  /** Título real do vídeo (oEmbed do YouTube); vazio se o YouTube não responder. */
  title: string;
  /** Nome do canal (oEmbed); vazio se indisponível. */
  author: string;
  /** Página do vídeo no YouTube (para o link "assistir no YouTube"). */
  url: string;
  /** Miniatura vertical dos Shorts; o navegador cai para hqdefault se não existir. */
  thumb: string;
  thumbFallback: string;
  /** Player sem cookies até o clique (youtube-nocookie). */
  embed: string;
}

const ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Lista os Shorts com título/canal reais via oEmbed (cache de 1 dia por vídeo).
 * Falha de rede não derruba a página: o vídeo entra sem título.
 */
export async function listShorts(): Promise<ShortVideo[]> {
  const ids = COURSE_SHORTS.filter((id) => ID.test(id));
  return Promise.all(
    ids.map(async (id) => {
      const url = `https://www.youtube.com/shorts/${id}`;
      let title = "";
      let author = "";
      try {
        const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, { next: { revalidate: 86_400 } });
        if (res.ok) {
          const data = (await res.json()) as { title?: string; author_name?: string };
          title = data.title?.trim() ?? "";
          author = data.author_name?.trim() ?? "";
        }
      } catch {
        // sem rede no build/render: segue sem título
      }
      return {
        id,
        title,
        author,
        url,
        thumb: `https://i.ytimg.com/vi/${id}/oar2.jpg`,
        thumbFallback: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        embed: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`,
      };
    }),
  );
}
