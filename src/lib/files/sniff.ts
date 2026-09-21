/**
 * Detecção de tipo por magic bytes (DRIVE-003, doc 21): o tipo declarado pelo
 * navegador não conta — só o que os bytes provam. Cobre a allowlist de upload:
 * imagens, PDF, CAD (STL/DXF/DWG/SLDPRT) e Office (docx/xlsx/pptx). Qualquer
 * outra coisa (executáveis, scripts, ZIP genérico, vídeo) devolve `null`.
 */
export type SniffedMime =
  | "image/jpeg" | "image/png" | "image/webp" | "application/pdf"
  | "model/stl" | "application/dxf" | "image/vnd.dwg" | "application/sldworks"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  | "application/vnd.openxmlformats-officedocument.presentationml.presentation";

const ascii = (b: Uint8Array, start: number, len: number) => Buffer.from(b.subarray(start, start + len)).toString("latin1");
const startsWith = (b: Uint8Array, sig: number[]) => sig.every((v, i) => b[i] === v);

function sniffOffice(b: Uint8Array): SniffedMime | null {
  // OOXML = ZIP com [Content_Types].xml e uma raiz word/ | xl/ | ppt/. Lemos os nomes das entradas locais
  // (assinatura PK\x03\x04) em vez de confiar em qualquer string solta dentro do arquivo.
  let pos = 0;
  let sawContentTypes = false;
  let root: SniffedMime | null = null;
  for (let i = 0; i < 64 && pos + 30 <= b.length; i += 1) {
    if (!(b[pos] === 0x50 && b[pos + 1] === 0x4b && b[pos + 2] === 0x03 && b[pos + 3] === 0x04)) break;
    const flags = b[pos + 6] | (b[pos + 7] << 8);
    const compressed = b[pos + 18] | (b[pos + 19] << 8) | (b[pos + 20] << 16) | (b[pos + 21] << 24);
    const nameLen = b[pos + 26] | (b[pos + 27] << 8);
    const extraLen = b[pos + 28] | (b[pos + 29] << 8);
    const name = ascii(b, pos + 30, nameLen);
    if (name === "[Content_Types].xml") sawContentTypes = true;
    if (name.startsWith("word/")) root = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (name.startsWith("xl/")) root = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    else if (name.startsWith("ppt/")) root = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    if (sawContentTypes && root) return root;
    // com data descriptor (bit 3) o tamanho comprimido vem depois: não dá para saltar com segurança
    if (flags & 0x8 || compressed < 0) break;
    pos += 30 + nameLen + extraLen + compressed;
  }
  return null;
}

function looksBinaryStl(b: Uint8Array): boolean {
  if (b.length < 84) return false;
  const triangles = b[80] | (b[81] << 8) | (b[82] << 16) | (b[83] << 24);
  return triangles >= 0 && 84 + triangles * 50 === b.length;
}

export function sniffMime(bytes: Uint8Array, totalLength = bytes.length): SniffedMime | null {
  const b = bytes;
  if (b.length < 8) return null;
  if (startsWith(b, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP") return "image/webp";
  if (ascii(b, 0, 5) === "%PDF-") return "application/pdf";
  if (startsWith(b, [0x50, 0x4b, 0x03, 0x04])) return sniffOffice(b);
  // SolidWorks = Compound File Binary (mesmo contêiner de .doc antigo); aceitamos só com extensão .sldprt/.sldasm na camada de cima.
  if (startsWith(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return "application/sldworks";
  const head = ascii(b, 0, Math.min(b.length, 256));
  if (/^AC10\d\d/.test(head)) return "image/vnd.dwg";
  if (/^\s*0\r?\n\s*SECTION/.test(head) || /^999\r?\n/.test(head)) return "application/dxf";
  if (/^solid[\s\r\n]/i.test(head) && /facet|endsolid/i.test(ascii(b, 0, Math.min(b.length, 4096)))) return "model/stl";
  if (totalLength === b.length && looksBinaryStl(b)) return "model/stl";
  return null;
}

/** Extensão coerente com o tipo detectado (defesa extra contra `foto.exe` renomeado). */
export const EXTENSION_BY_MIME: Record<SniffedMime, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "application/pdf": ["pdf"],
  "model/stl": ["stl"],
  "application/dxf": ["dxf"],
  "image/vnd.dwg": ["dwg"],
  "application/sldworks": ["sldprt", "sldasm", "slddrw"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ["pptx"],
};

export function extensionOf(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]{1,8})$/);
  return m ? m[1] : "";
}

/** Nome seguro e estável para o Drive: sem caminhos/controle, sem espaços duplos, extensão canônica do tipo. */
export function safeFileName(original: string, mime: SniffedMime, stamp: Date = new Date()): string {
  const base = original.replace(/\.[a-z0-9]{1,8}$/i, "").normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^\w.\- ]+/g, " ").replace(/\.{2,}/g, ".").replace(/\s+/g, " ").replace(/^[.\s-]+/, "").trim().slice(0, 80) || "arquivo";
  const ext = EXTENSION_BY_MIME[mime][0];
  const date = stamp.toISOString().slice(0, 10);
  return `${date} ${base}.${ext}`;
}
