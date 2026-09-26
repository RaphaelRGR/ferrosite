import { LABS, type Lab } from "./labs";

/**
 * Taxonomia de capacidades de P&D (14) e relação capacidade ↔ laboratório.
 *
 * A relação é ADMINISTRADA, não busca por texto livre (14 "Triagem P&D"): cada
 * vínculo abaixo foi derivado das seções "Aplicações no setor ferroviário" do
 * portfólio e leva o nível declarado pelo próprio PDF:
 * - offered: o laboratório descreve o serviço/ensaio como capacidade atual;
 * - prospective: o PDF usa linguagem de potencial ("podem ser adaptadas…");
 * - pending: só o nome do laboratório indica a área (sem página detalhada).
 * Nada aqui é promessa de contratação; tudo passa pela quarentena até validação
 * institucional (owner do portfólio) e pela triagem da coordenação (CRM-001).
 */
export const CAPABILITY_IDS = [
  "material-rodante", "via-permanente", "estruturas", "geotecnia", "materiais", "soldagem", "ruido", "vibracoes",
  "aerodinamica", "simulacao", "otimizacao", "ia", "dados", "automacao", "controle", "sistemas", "inspecao",
  "manutencao", "operacao", "logistica",
] as const;
export type CapabilityId = (typeof CAPABILITY_IDS)[number];

export type CapabilityLevel = "offered" | "prospective" | "pending";

export interface CapabilityLink {
  labId: string;
  capability: CapabilityId;
  level: CapabilityLevel;
}

const L = (labId: string, level: CapabilityLevel, ...caps: CapabilityId[]): CapabilityLink[] =>
  caps.map((capability) => ({ labId, capability, level }));

/** Vínculos derivados do portfólio (página do PDF entre parênteses). */
export const CAPABILITY_LINKS: CapabilityLink[] = [
  // LMSE (p.3): fadiga em trilhos/rodas/eixos/bogies, materiais de via e material rodante, análise modal, integridade estrutural.
  ...L("lmse", "offered", "estruturas", "materiais", "vibracoes", "material-rodante", "via-permanente"),
  // LMS (p.4): subleito, lastro/sublastro, plataformas, fundações.
  ...L("lms", "offered", "geotecnia", "via-permanente", "estruturas"),
  // LabDSE (p.5): MBSE para veículos/infraestrutura/inspeção, metrologia, validação de sensores/controle, sistemas autônomos para inspeção e manutenção.
  ...L("labdse", "offered", "sistemas", "inspecao", "controle", "automacao", "manutencao", "material-rodante"),
  // Robótica Avançada (p.6): corpo do PDF idêntico ao LabDSE — sem vínculo até validar o diferencial (14).
  // NSO (p.7): simulação estrutural de vagões/bogies/CCT, otimização com HPC, VR para operação, IA para fadiga.
  ...L("nso", "offered", "simulacao", "otimizacao", "ia", "material-rodante", "estruturas", "operacao"),
  // LaCMa (p.8): metalografia de trilhos/rodas/eixos, dormentes poliméricos, revestimentos, homologação de materiais.
  ...L("lacma", "offered", "materiais", "via-permanente", "material-rodante"),
  // LIFE (p.9): dinâmica de bogies, ruído roda-trilho, cargas aerodinâmicas, pontes.
  ...L("life", "offered", "vibracoes", "ruido", "aerodinamica", "estruturas", "material-rodante"),
  // Aeolus (p.10): aerodinâmica de material rodante, túneis, carenagens, esforços em estruturas; validação de CFD.
  ...L("aeolus", "offered", "aerodinamica", "simulacao", "material-rodante", "estruturas"),
  // LTS (p.11): revestimentos contra desgaste, procedimentos de soldagem, treinamentos.
  ...L("lts", "offered", "soldagem", "materiais", "manutencao"),
  // LAV (p.12): ruído roda-trilho, revestimento acústico de trilhos, vibrações em material rodante/infraestrutura, conformidade acústica.
  ...L("lav", "offered", "ruido", "vibracoes", "material-rodante", "via-permanente"),
  // LDTPav (p.13): caracterização de materiais é capacidade atual; lastro/via permanente é "potencial de aplicação".
  ...L("ldtpav", "offered", "materiais"),
  ...L("ldtpav", "prospective", "via-permanente", "geotecnia"),
  // Só índice (p.2): área inferida do nome, sem página detalhada.
  ...L("lasc", "pending", "automacao", "controle"),
  ...L("idalab", "pending", "dados", "ia"),
];

export function isCapabilityId(value: unknown): value is CapabilityId {
  return typeof value === "string" && (CAPABILITY_IDS as readonly string[]).includes(value);
}

export function capabilitiesOf(labId: string): CapabilityLink[] {
  return CAPABILITY_LINKS.filter((link) => link.labId === labId);
}

export function labsWithCapability(capability: CapabilityId): Array<{ lab: Lab; level: CapabilityLevel }> {
  return CAPABILITY_LINKS.filter((link) => link.capability === capability)
    .map((link) => ({ lab: LABS.find((l) => l.id === link.labId)!, level: link.level }))
    .filter((x) => x.lab);
}
