import labsJson from "../../content/labs.json";

/**
 * Laboratórios (LAB-001). Fonte: content/labs.json, gerado de
 * referencias_ferro/Portfolio_Laboratorios_EFM_UFSC.pdf por scripts/labs_from_pdf.py.
 * Não editar o JSON à mão: regenerar. O portfólio é fonte local ainda sujeita a
 * validação institucional (14): tudo é exibido sob quarentena (BASE-002).
 *
 * O gerador NÃO copia e-mails, telefones, salas nem links do PDF (14/21).
 */
export interface LabApplication {
  text: string;
  /** Frase prospectiva no PDF ("potencial", "podem ser adaptadas"): não é serviço oferecido. */
  prospective: boolean;
}

export interface Lab {
  id: string;
  acronym: string;
  name: string;
  /** Responsável como informado no portfólio (nome + titulação); vazio se não consta. */
  responsible: string;
  /** Página do PDF de origem (2 = só no índice). */
  page: number;
  /** Rótulo da seção de aplicações no PDF ("… SETOR FERROVIÁRIO" ou "… METROFERROVIÁRIO"). */
  applicationsLabel: string;
  about: string[];
  history: string[];
  applications: LabApplication[];
  /** O corpo da página no PDF é idêntico ao de outro laboratório (defeito de origem). */
  duplicateOf?: string;
}

export const LABS_SOURCE = labsJson.source;
export const LABS: Lab[] = labsJson.labs as Lab[];

const BY_ID = new Map(LABS.map((lab) => [lab.id, lab]));

export function getLab(id: string): Lab | undefined {
  return BY_ID.get(id);
}

/** Tem página própria com conteúdo no portfólio (não é só índice nem duplicata). */
export function hasDetail(lab: Lab): boolean {
  return lab.about.length > 0 && !lab.duplicateOf;
}
