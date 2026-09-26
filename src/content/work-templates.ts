/**
 * Modelos de processo das Ações (ACT-004): etapas e ações que um processo gera
 * de uma vez. Prazos relativos à data do evento (negativo = antes). Um modelo
 * novo entra aqui (e aparece em /portal/acoes/processos). Previstos: FerroCard,
 * Evento, Projeto de extensão, Projeto de P&D, Missão internacional, Edital,
 * Documento da coordenação, Portfólio de laboratório.
 */
export interface WorkTemplateItem {
  title: string;
  /** Dias em relação à data do evento; `null` = sem prazo. */
  offsetDays: number | null;
  /** Aprovação pelo aprovador escolhido ao criar o processo. */
  approval?: boolean;
  priority?: "low" | "medium" | "high";
  checklist?: string[];
}

export interface WorkTemplatePhase {
  key: string;
  label: string;
  items: WorkTemplateItem[];
}

export interface WorkTemplate {
  /** Identificador gravado no banco. */
  key: string;
  /** Pedaço da URL (?modelo=). */
  slug: string;
  name: string;
  description: string;
  /** Rótulo da data que ancora os prazos. */
  eventLabel: string;
  titlePlaceholder: string;
  phases: WorkTemplatePhase[];
}

export const TECHNICAL_VISIT: WorkTemplate = {
  key: "technical_visit",
  slug: "visita-tecnica",
  name: "Visita técnica",
  description: "Do contato com a empresa ao relatório aprovado e às fotos publicadas: planejamento, participantes, segurança, logística, execução e pós-visita.",
  eventLabel: "Data da visita",
  titlePlaceholder: "Ex.: Visita técnica Rumo Curitiba",
  phases: [
    {
      key: "planejamento",
      label: "Planejamento",
      items: [
        { title: "Definir empresa e contato", offsetDays: -45 },
        { title: "Definir data com a empresa", offsetDays: -40, priority: "high" },
        { title: "Confirmar capacidade (número de vagas)", offsetDays: -35 },
      ],
    },
    {
      key: "participantes",
      label: "Participantes",
      items: [
        { title: "Abrir inscrições", offsetDays: -30 },
        { title: "Homologar participantes", offsetDays: -20 },
        { title: "Confirmar desistências", offsetDays: -10 },
        { title: "Fechar lista final", offsetDays: -7, priority: "high" },
      ],
    },
    {
      key: "seguranca",
      label: "Segurança",
      items: [{ title: "Verificar EPI dos participantes", offsetDays: -7, checklist: ["Botas", "Óculos", "Colete"] }],
    },
    {
      key: "logistica",
      label: "Logística",
      items: [
        { title: "Contratar transporte", offsetDays: -14, priority: "high" },
        { title: "Definir horário e ponto de encontro", offsetDays: -7 },
        { title: "Organizar alimentação", offsetDays: -7 },
      ],
    },
    {
      key: "empresa",
      label: "Empresa",
      items: [
        { title: "Enviar relação de participantes à empresa", offsetDays: -5, priority: "high" },
        { title: "Confirmar recebimento da relação", offsetDays: -3 },
        { title: "Confirmar roteiro da visita", offsetDays: -3 },
      ],
    },
    {
      key: "execucao",
      label: "Execução",
      items: [
        { title: "Registrar presença", offsetDays: 0 },
        { title: "Fazer fotos", offsetDays: 0 },
        { title: "Fazer registro técnico", offsetDays: 0 },
      ],
    },
    {
      key: "pos_visita",
      label: "Pós-visita",
      items: [
        { title: "Relatório da visita", offsetDays: 7, approval: true, priority: "high" },
        { title: "Selecionar fotos", offsetDays: 5 },
        { title: "Editar vídeo", offsetDays: 10 },
        { title: "Postagem nas redes", offsetDays: 10 },
        { title: "Publicar no site (Conteúdos)", offsetDays: 14 },
      ],
    },
    {
      key: "encerramento",
      label: "Encerramento",
      items: [
        { title: "Organizar a pasta no Drive", offsetDays: 20 },
        { title: "Contabilizar nos indicadores", offsetDays: 20 },
      ],
    },
  ],
};

export const WORK_TEMPLATES: WorkTemplate[] = [TECHNICAL_VISIT];

export const findTemplate = (slugOrKey: string) => WORK_TEMPLATES.find((t) => t.slug === slugOrKey || t.key === slugOrKey);
