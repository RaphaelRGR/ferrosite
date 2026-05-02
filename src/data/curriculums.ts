export interface Subject {
  id: string;
  cat: string;
  name: string;
  hours: number;
  pre?: string[];
  ementa?: string;
  ext?: boolean;
}

export interface Phase {
  phase: number;
  subjects: Subject[];
}

export interface CurriculumData {
  id: string;
  year: number;
  name: string;
  phases: Phase[];
  optativas: Subject[];
}

export const CURRICULO_2025: Phase[] = [
  { phase: 1, subjects: [
    { id: "EMB5001", cat: "math", name: "Cálculo Diferencial e Integral I", hours: 72, ementa: "Noções sobre funções de uma variável real. Limite e continuidade. Derivada. Aplicações de Derivada. Integral definida e indefinida." },
    { id: "EMB5005", cat: "math", name: "Geometria Analítica", hours: 72, ementa: "Matrizes. Determinantes. Sistemas lineares. Álgebra vetorial. Estudo da reta e do plano." },
    { id: "EMB5036", cat: "material", name: "Química para Engenharia", hours: 72, ementa: "Átomos e moléculas. Ligações químicas. Estequiometria. Termoquímica. Siderurgia e polímeros." },
    { id: "EMB5055", cat: "design", name: "Representação Gráfica", hours: 54, ementa: "Desenho projetivo. Normas ABNT. Cotagem. Perspectiva Isométrica. Projeções no 1º e 3º diedros." },
    { id: "EMB5062", cat: "human", name: "Comunicação e Expressão", hours: 36, ementa: "Leitura e interpretação de textos técnicos. Normas da ABNT. Linguagem técnica." },
    { id: "EMB5540", cat: "railway", name: "Intro. Eng. Ferroviária", hours: 72, ext: true, ementa: "História das ferrovias. Locomotivas, vagões e sinalização. Atividades de extensão." },
    { id: "EMB5648", cat: "comp", name: "Programação I", hours: 72, ementa: "Lógica de programação. Pseudocódigo e fluxograma. Vetores, matrizes e funções." }
  ]},
  { phase: 2, subjects: [
    { id: "EMB5029", cat: "math", name: "Cálculo Diferencial e Integral II", hours: 72, pre: ["EMB5001"] },
    { id: "EMB5007", cat: "math", name: "Álgebra Linear", hours: 72, pre: ["EMB5005"] },
    { id: "EMB5048", cat: "physics", name: "Física I", hours: 72, ementa: "Cinemática. Leis de Newton. Trabalho e energia. Conservação do momento." },
    { id: "EMB5012", cat: "design", name: "Desenho e Modelagem", hours: 54, pre: ["EMB5005"] },
    { id: "EMB5022", cat: "material", name: "Ciência dos Materiais", hours: 72, pre: ["EMB5001", "EMB5036"] },
    { id: "EMB5063", cat: "human", name: "Ciência, Tecnologia e Sociedade", hours: 36 },
    { id: "EMB5972", cat: "mgmt", name: "Impactos Ambientais Transp.", hours: 36 }
  ]},
  { phase: 3, subjects: [
    { id: "EMB5030", cat: "math", name: "Cálculo Vetorial", hours: 72, pre: ["EMB5005", "EMB5029"] },
    { id: "EMB5039", cat: "physics", name: "Física II", hours: 72, pre: ["EMB5001", "EMB5048"] },
    { id: "EMB5016", cat: "math", name: "Cálculo Numérico", hours: 72, pre: ["EMB5001", "EMB5005", "EMB5648"] },
    { id: "EMB5011", cat: "mech", name: "Estática", hours: 72, pre: ["EMB5048"] },
    { id: "EMB5057", cat: "math", name: "Estatística I", hours: 72, pre: ["EMB5001"] },
    { id: "EMB5059", cat: "project", name: "Metodologia de Projeto", hours: 72, ext: true }
  ]},
  { phase: 4, subjects: [
    { id: "EMB5014", cat: "math", name: "Séries e Equações Diferenciais", hours: 72, pre: ["EMB5007", "EMB5029"] },
    { id: "EMB5009", cat: "fluid", name: "Termodinâmica", hours: 72, pre: ["EMB5029", "EMB5039"] },
    { id: "EMB5043", cat: "physics", name: "Física III", hours: 72, pre: ["EMB5030", "EMB5039"] },
    { id: "EMB5021", cat: "mech", name: "Mecânica dos Sólidos I", hours: 72, pre: ["EMB5011"] },
    { id: "EMB5041", cat: "mech", name: "Dinâmica", hours: 54, pre: ["EMB5011"] },
    { id: "EMB5102", cat: "material", name: "Processo de Fabricação", hours: 72, pre: ["EMB5022"] }
  ]},
  { phase: 5, subjects: [
    { id: "EMB5017", cat: "fluid", name: "Mecânica dos Fluidos", hours: 72, pre: ["EMB5009", "EMB5030"] },
    { id: "EMB5061", cat: "math", name: "Metrologia", hours: 54, pre: ["EMB5057"] },
    { id: "EMB5101", cat: "mech", name: "Mecanismos", hours: 36, pre: ["EMB5041"] },
    { id: "EMB5104", cat: "mech", name: "Mecânica dos Sólidos II", hours: 72, pre: ["EMB5021"] },
    { id: "EMB5108", cat: "elec", name: "Circuitos Elétricos", hours: 72, pre: ["EMB5005", "EMB5029"] },
    { id: "EMB5115", cat: "mech", name: "Vibrações", hours: 72, pre: ["EMB5014", "EMB5041"] },
    { id: "EMB5535", cat: "railway", name: "Via Permanente", hours: 72, pre: ["EMB5011", "EMB5012"] , ementa: "A infraestrutura é o chão que sustenta a operação ferroviária. Nesta disciplina, você aprende a projetar e dimensionar trilhos, dormentes, lastro e sublastro para suportar composições de milhares de toneladas a altas velocidades. Essencial para garantir a segurança e a eficiência logística do país." }
  ]},
  { phase: 6, subjects: [
    { id: "EMB5116", cat: "elec", name: "Eletrônica Analógica", hours: 72, pre: ["EMB5108"] },
    { id: "EMB5119", cat: "mech", name: "Elementos de Máquinas", hours: 72, pre: ["EMB5101", "EMB5104"] },
    { id: "EMB5120", cat: "mgmt", name: "Gestão e Organização", hours: 72 },
    { id: "EMB5123", cat: "fluid", name: "Transferência de Calor", hours: 72, pre: ["EMB5017"] },
    { id: "EMB5542", cat: "railway", name: "Locomotivas", hours: 72, pre: ["EMB5535"] , ementa: "O coração pulsante de qualquer composição. Estudo profundo sobre o funcionamento, dimensionamento e manutenção de locomotivas diesel-elétricas e puramente elétricas. Você entenderá as curvas de esforço trator e como especificar a máquina ideal para o perfil da malha." },
    { id: "EMB5543", cat: "railway", name: "Vagões e Carros", hours: 72, pre: ["EMB5102"] , ementa: "Do design estrutural à aerodinâmica. Projetar vagões eficientes significa reduzir o peso morto e maximizar a carga útil. Você aplicará conceitos de mecânica dos sólidos e elementos de máquinas para projetar rodeiros, truques e caixas de alta performance." }
  ]},
  { phase: 7, subjects: [
    { id: "EMB5544", cat: "railway", name: "Dinâmica Ferroviária", hours: 72, pre: ["EMB5041", "EMB5535", "EMB5542", "EMB5543"] , ementa: "A disciplina mais complexa e exclusiva do curso. Como milhares de toneladas interagem a 80km/h com trilhos de milímetros de contato? Você estudará a interação Roda-Trilho, estabilidade do veículo, desgaste lateral e descarrilamento usando simulações dinâmicas avançadas." },
    { id: "EMB5545", cat: "railway", name: "Roda e Suspensão", hours: 72, pre: ["EMB5115"] },
    { id: "EMB5546", cat: "elec", name: "Comunicação e Sinalização", hours: 72, pre: ["EMB5108"] },
    { id: "EMB5549", cat: "mgmt", name: "Operação Ferroviária", hours: 36, pre: ["EMB5120"] },
    { id: "EMB5554", cat: "project", name: "Projeto Integrador I", hours: 72, ext: true, pre: ["EMB5102", "EMB5535"] },
    { id: "EMB5653", cat: "elec", name: "Conversão de Energia", hours: 72, pre: ["EMB5043", "EMB5108"] },
    { id: "EMB5961", cat: "mgmt", name: "Engenharia Econômica", hours: 54, pre: ["EMB5057"] }
  ]},
  { phase: 8, subjects: [
    { id: "EMB5320", cat: "mgmt", name: "Empreendedorismo", hours: 36, pre: ["EMB5059", "EMB5120", "EMB5961"] },
    { id: "EMB5547", cat: "railway", name: "Manutenção Ferroviária I", hours: 72, pre: ["EMB5022", "EMB5542", "EMB5543"] },
    { id: "EMB5550", cat: "railway", name: "Material Rodante", hours: 36, pre: ["EMB5544", "EMB5545"] },
    { id: "EMB5551", cat: "elec", name: "Tração Elétrica", hours: 72, pre: ["EMB5549"] },
    { id: "EMB5553", cat: "material", name: "Soldagem Ferroviária", hours: 72, pre: ["EMB5022", "EMB5108"] },
    { id: "EMB5555", cat: "project", name: "Projeto Integrador II", hours: 72, ext: true, pre: ["EMB5554"] },
    { id: "EMB5557", cat: "project", name: "Planejamento PFC", hours: 36 }
  ]},
  { phase: 9, subjects: [
    { id: "EMB5100", cat: "mgmt", name: "Projeto Empreender", hours: 72, ext: true, pre: ["EMB5320"] },
    { id: "EMB5065", cat: "fluid", name: "Sistemas Hidro-Pneu", hours: 72, pre: ["EMB5017"] },
    { id: "EMB5548", cat: "railway", name: "Manutenção Ferroviária II", hours: 72, pre: ["EMB5547"] },
    { id: "EMB5552", cat: "railway", name: "Prev. Acidentes", hours: 72, pre: ["EMB5550"] },
    { id: "EMB5556", cat: "project", name: "Projeto Integrador III", hours: 72, ext: true, pre: ["EMB5555"] },
    { id: "EMB5558", cat: "project", name: "TCC / PFC", hours: 36, pre: ["EMB5557"] }
  ]},
  { phase: 10, subjects: [
    { id: "EMB5599", cat: "railway", name: "Estágio Obrigatório", hours: 216, ementa: "Experiência prática em ambiente real. Requisito: 3942h (80%) concluídas." }
  ]}
];
export const OPTATIVAS_2025: Subject[] = [
  { id: "EMB5049", cat: "physics", name: "Física Experimental", hours: 36 },
  { id: "EMB5054", cat: "human", name: "Relações Interpessoais", hours: 36 },
  { id: "EMB5056", cat: "mgmt", name: "Ergonomia e Segurança", hours: 36 },
  { id: "EMB5107", cat: "mgmt", name: "Manutenção e Confiabilidade", hours: 36 },
  { id: "EMB5113", cat: "comp", name: "Modelagem de Sistemas", hours: 72 },
  { id: "EMB5117", cat: "mech", name: "Introdução ao MEF", hours: 72 },
  { id: "EMB5350", cat: "mgmt", name: "Controle da Qualidade", hours: 72 },
  { id: "EMB5352", cat: "mech", name: "Mecânica da Fratura", hours: 36 },
  { id: "EMB5377", cat: "mech", name: "Desgaste e Lubrificação", hours: 54 },
  { id: "EMB5565", cat: "physics", name: "Acústica Ferroviária", hours: 36 },
  { id: "EMB5635", cat: "comp", name: "Informática Industrial", hours: 54 },
  { id: "EMB5652", cat: "elec", name: "Instrumentação", hours: 54 },
  { id: "EMB5655", cat: "elec", name: "Eletrônica de Potência", hours: 72 },
  { id: "EMB5977", cat: "mgmt", name: "Logística I", hours: 36 },
  { id: "LSB7244", cat: "human", name: "Libras I", hours: 72 }
];

export const CURRICULO_2016: Phase[] = [
  { phase: 1, subjects: [
    { id: "EMB5001", cat: "math", name: "Cálculo Diferencial e Integral I", hours: 72, ementa: "Noções sobre funções de uma variável real. Limite e continuidade. Derivada. Aplicações de Derivada. Integral definida e indefinida." },
    { id: "EMB5005", cat: "math", name: "Geometria Analítica", hours: 72, ementa: "Matrizes. Determinantes. Sistemas lineares. Algebra vetorial. Estudo da reta e do plano. Curvas planas." },
    { id: "EMB5034", cat: "physics", name: "Física I", hours: 72, ementa: "Unidades de medida e vetores. Cinemática. Leis de Newton e aplicações. Trabalho e energia potencial." },
    { id: "EMB5035", cat: "design", name: "Representação Gráfica", hours: 54, ementa: "Noções fundamentais para elaboração e interpretação de esboços e desenhos técnicos." },
    { id: "EMB5037", cat: "human", name: "Comunicação e Expressão", hours: 36, ementa: "Componentes da linguagem científica e elementos para pesquisa bibliográfica. Normas ABNT." },
    { id: "EMB5038", cat: "human", name: "Ciência, Tecnologia e Sociedade", hours: 36, ementa: "Definições de ciência, tecnologia e técnica. Desenvolvimento tecnológico e social. Ética profissional." },
    { id: "EMB5526", cat: "railway", name: "Intro. Eng. Ferroviária e Metroviária", hours: 36, ementa: "História das ferrovias. Mercado ferroviário. Via permanente. Locomotivas, Vagões e Sinalização." }
  ]},
  { phase: 2, subjects: [
    { id: "EMB5006", cat: "material", name: "Química Tecnológica", hours: 72, ementa: "Estrutura Atômica. Ligações Químicas. Estequiometria. Siderurgia e Corrosão." },
    { id: "EMB5007", cat: "math", name: "Algebra Linear", hours: 72, pre: ["EMB5005"], ementa: "Espaços vetoriais. Transformações lineares. Autovalores e autovetores." },
    { id: "EMB5012", cat: "design", name: "Desenho e Modelagem Geométrica", hours: 54, pre: ["EMB5035"], ementa: "Sistemas CAD, metodologia para modelamento de produtos tridimensionais." },
    { id: "EMB5029", cat: "math", name: "Cálculo Diferencial e Integral II", hours: 72, pre: ["EMB5001"], ementa: "Funções de várias variáveis. Derivadas parciais. Integração múltipla." },
    { id: "EMB5039", cat: "physics", name: "Física II", hours: 72, pre: ["EMB5001", "EMB5034"], ementa: "Estática e dinâmica de fluidos. Oscilações. Ondas mecânicas. Termodinâmica." },
    { id: "EMB5600", cat: "comp", name: "Programação I", hours: 72, ementa: "Lógica de programação. Algoritmos, pseudocódigo e fluxogramas. Linguagem de alto nível." }
  ]},
  { phase: 3, subjects: [
    { id: "EMB5009", cat: "fluid", name: "Termodinâmica", hours: 72, pre: ["EMB5029", "EMB5039"] },
    { id: "EMB5010", cat: "math", name: "Estatística e Probabilidade", hours: 72 },
    { id: "EMB5011", cat: "mech", name: "Estática", hours: 72, pre: ["EMB5034"] },
    { id: "EMB5016", cat: "math", name: "Cálculo Numérico", hours: 72, pre: ["EMB5001", "EMB5005", "EMB5600"] },
    { id: "EMB5022", cat: "material", name: "Ciência dos Materiais", hours: 72, pre: ["EMB5001", "EMB5006"] },
    { id: "EMB5030", cat: "math", name: "Cálculo Vetorial", hours: 72, pre: ["EMB5005", "EMB5029"] }
  ]},
  { phase: 4, subjects: [
    { id: "EMB5014", cat: "math", name: "Séries e Equações Diferenciais", hours: 72, pre: ["EMB5007", "EMB5029"] },
    { id: "EMB5017", cat: "fluid", name: "Mecânica dos Fluidos", hours: 72, pre: ["EMB5009", "EMB5030"] },
    { id: "EMB5021", cat: "mech", name: "Mecânica dos Sólidos I", hours: 72, pre: ["EMB5011", "EMB5022"] },
    { id: "EMB5041", cat: "mech", name: "Dinâmica", hours: 54, pre: ["EMB5011"] },
    { id: "EMB5043", cat: "physics", name: "Física III", hours: 72, pre: ["EMB5030", "EMB5039"] },
    { id: "EMB5102", cat: "material", name: "Processo de Fabricação", hours: 72, pre: ["EMB5022"] }
  ]},
  { phase: 5, subjects: [
    { id: "EMB5033", cat: "math", name: "Metrologia", hours: 54, pre: ["EMB5010"] },
    { id: "EMB5042", cat: "project", name: "Metodologia de Projeto", hours: 54 },
    { id: "EMB5103", cat: "fluid", name: "Transmissão de Calor I", hours: 72, pre: ["EMB5014", "EMB5017"] },
    { id: "EMB5104", cat: "mech", name: "Mecânica dos Sólidos II", hours: 72, pre: ["EMB5021"] },
    { id: "EMB5105", cat: "mech", name: "Mecanismos", hours: 36, pre: ["EMB5041"] },
    { id: "EMB5108", cat: "elec", name: "Circuitos Elétricos", hours: 72, pre: ["EMB5005", "EMB5029"] },
    { id: "EMB5535", cat: "railway", name: "Via Permanente", hours: 72, pre: ["EMB5011", "EMB5012"] , ementa: "A infraestrutura é o chão que sustenta a operação ferroviária. Nesta disciplina, você aprende a projetar e dimensionar trilhos, dormentes, lastro e sublastro para suportar composições de milhares de toneladas a altas velocidades. Essencial para garantir a segurança e a eficiência logística do país." }
  ]},
  { phase: 6, subjects: [
    { id: "EMB5110", cat: "mech", name: "Elementos de Máquinas", hours: 72, pre: ["EMB5104", "EMB5105"] },
    { id: "EMB5115", cat: "mech", name: "Vibrações", hours: 72, pre: ["EMB5014", "EMB5041"] },
    { id: "EMB5116", cat: "elec", name: "Eletrônica Analógica", hours: 72, pre: ["EMB5108"] },
    { id: "EMB5529", cat: "railway", name: "Locomotivas", hours: 72, pre: ["EMB5105"] },
    { id: "EMB5536", cat: "railway", name: "Dinâmica Ferroviária e Metroviária", hours: 72, pre: ["EMB5041", "EMB5535"] },
    { id: "EMB5538", cat: "material", name: "Processos de Soldagem EFM", hours: 72, pre: ["EMB5022", "EMB5108"] }
  ]},
  { phase: 7, subjects: [
    { id: "EMB5111", cat: "comp", name: "Introdução ao Controle", hours: 72, pre: ["EMB5014"] },
    { id: "EMB5120", cat: "mgmt", name: "Gestão e Organização", hours: 72 },
    { id: "EMB5510", cat: "railway", name: "Vagões e Carros Metroviários", hours: 72, pre: ["EMB5021", "EMB5102"] },
    { id: "EMB5527", cat: "elec", name: "Máquinas Elétricas", hours: 72, pre: ["EMB5108"] },
    { id: "EMB5530", cat: "railway", name: "Roda e Suspensão Ferroviária", hours: 72, pre: ["EMB5115", "EMB5536"] },
    { id: "EMB5532", cat: "railway", name: "Comunicação e Sinalização", hours: 72, pre: ["EMB5108"] }
  ]},
  { phase: 8, subjects: [
    { id: "EMB5044", cat: "project", name: "Planejamento do TCC", hours: 36, ementa: "Proposta do projeto de conclusão de curso. Metodologia e cronograma." },
    { id: "EMB5047", cat: "fluid", name: "Sistemas Hidráulicos e Pneumáticos", hours: 72, pre: ["EMB5017", "EMB5111"] },
    { id: "EMB5512", cat: "railway", name: "Manutenção Ferroviária I", hours: 72, pre: ["EMB5022", "EMB5510", "EMB5529"] },
    { id: "EMB5528", cat: "elec", name: "Tração Elétrica em Sistemas", hours: 72, pre: ["EMB5527"] },
    { id: "EMB5537", cat: "railway", name: "Operação Ferroviária e Metroviária", hours: 36, pre: ["EMB5120"] },
    { id: "EMB5961", cat: "mgmt", name: "Engenharia Econômica", hours: 54, pre: ["EMB5010"] },
    { id: "OPT-1", cat: "mgmt", name: "Optativa Obrigatória I", hours: 54 }
  ]},
  { phase: 9, subjects: [
    { id: "EMB5045", cat: "project", name: "Trabalho de Conclusão de Curso (TCC)", hours: 72, pre: ["EMB5044"] },
    { id: "EMB5517", cat: "railway", name: "Manutenção Ferroviária II", hours: 72, pre: ["EMB5512"] },
    { id: "EMB5519", cat: "mgmt", name: "Gestão de Empreendimentos", hours: 36, pre: ["EMB5120"] },
    { id: "EMB5531", cat: "railway", name: "Investigação e Prev. Acidentes", hours: 72, pre: ["EMB5510", "EMB5530"] },
    { id: "EMB5937", cat: "human", name: "Impactos Ambientais dos Transp.", hours: 36 },
    { id: "OPT-2", cat: "mgmt", name: "Optativa Obrigatória II", hours: 54 },
    { id: "OPT-3", cat: "mgmt", name: "Optativa Obrigatória III", hours: 54 },
    { id: "OPT-4", cat: "mgmt", name: "Optativa Obrigatória IV", hours: 36 }
  ]},
  { phase: 10, subjects: [
    { id: "EMB5046", cat: "project", name: "Estágio Curricular Obrigatório", hours: 396 },
    { id: "EMB5533", cat: "project", name: "Atividades Complementares", hours: 180 }
  ]}
];
export const OPTATIVAS_2016: Subject[] = [
  { id: "EMB5113", cat: "comp", name: "Modelagem de Sistemas", hours: 72 },
  { id: "EMB5604", cat: "elec", name: "Instrumentação", hours: 72, pre: ["EMB5116"] },
  { id: "EMB5605", cat: "elec", name: "Eletrônica de Potência", hours: 72, pre: ["EMB5116"] },
  { id: "EMB5627", cat: "elec", name: "Sistemas Motrizes I", hours: 72, pre: ["EMB5108"] },
  { id: "EMB5635", cat: "comp", name: "Informática Industrial", hours: 54, pre: ["EMB5113"] },
  { id: "EMB5026", cat: "human", name: "Ergonomia e Segurança", hours: 36 },
  { id: "EMB5107", cat: "mgmt", name: "Manutenção e Confiabilidade", hours: 36, pre: ["EMB5010"] },
  { id: "EMB5301", cat: "physics", name: "Acústica Veicular", hours: 36, pre: ["EMB5014"] },
  { id: "EMB5320", cat: "mgmt", name: "Empreendedorismo e Inovação", hours: 36, pre: ["EMB5120"] },
  { id: "EMB5355", cat: "material", name: "Mat. e Proc. Construção Veicular I", hours: 36, pre: ["EMB5102"] },
  { id: "EMB5385", cat: "mgmt", name: "Controle Estatístico da Qualidade", hours: 54, pre: ["EMB5010"] },
  { id: "EMB5515", cat: "comp", name: "Métodos Computacionais Eng.", hours: 72 },
  { id: "EMB5918", cat: "mgmt", name: "Planejamento Estratégico", hours: 54, pre: ["EMB5120"] },
  { id: "EMB5923", cat: "railway", name: "Projeto e Operação de Terminais", hours: 72 },
  { id: "LSB7244", cat: "human", name: "Libras I", hours: 72 }
];

export const CURRICULO_2012: Phase[] = [
  { phase: 1, subjects: [
    { id: "EMB5001", cat: "math", name: "Cálculo Diferencial e Integral I", hours: 72, ementa: "Funções de uma variável real, limites, derivadas e integrais básicas." },
    { id: "EMB5003", cat: "design", name: "Representação Gráfica", hours: 72, ementa: "Desenho técnico manual e computacional, projeções e modelagem básica." },
    { id: "EMB5004", cat: "human", name: "Introdução a Engenharia", hours: 72, ementa: "Contextualização à vida acadêmica e profissional. Ética e responsabilidade social." },
    { id: "EMB5005", cat: "math", name: "Geometria Analítica", hours: 72, ementa: "Matrizes, determinantes, álgebra vetorial e estudo da reta e do plano." },
    { id: "EMB5006", cat: "material", name: "Química Tecnológica", hours: 72, ementa: "Estrutura atômica, ligações, estequiometria e corrosão metálica." },
    { id: "EMB5028", cat: "human", name: "Comunicação e Expressão", hours: 54, ementa: "Construção de textos técnico-científicos e normas ABNT." }
  ]},
  { phase: 2, subjects: [
    { id: "EMB5002", cat: "physics", name: "Física - Introdução à Mecânica", hours: 72, pre: ["EMB5001"] },
    { id: "EMB5007", cat: "math", name: "Álgebra Linear", hours: 72, pre: ["EMB5005"] },
    { id: "EMB5010", cat: "math", name: "Estatística e Probabilidade", hours: 72 },
    { id: "EMB5012", cat: "design", name: "Desenho e Modelagem Geométrica", hours: 54, pre: ["EMB5003"] },
    { id: "EMB5013", cat: "comp", name: "Introdução à Programação", hours: 72, ementa: "Lógica de programação e implementação em linguagem de alto nível." },
    { id: "EMB5029", cat: "math", name: "Cálculo Diferencial e Integral II", hours: 72, pre: ["EMB5001"] }
  ]},
  { phase: 3, subjects: [
    { id: "EMB5009", cat: "fluid", name: "Termodinâmica", hours: 72, pre: ["EMB5029"] },
    { id: "EMB5011", cat: "mech", name: "Estática", hours: 72, pre: ["EMB5002"] },
    { id: "EMB5016", cat: "math", name: "Cálculo Numérico", hours: 72, pre: ["EMB5001", "EMB5013"] },
    { id: "EMB5022", cat: "material", name: "Ciência dos Materiais", hours: 72, pre: ["EMB5001", "EMB5006"] },
    { id: "EMB5026", cat: "human", name: "Ergonomia e Segurança", hours: 36 },
    { id: "EMB5030", cat: "math", name: "Cálculo Vetorial", hours: 72, pre: ["EMB5029"] },
    { id: "EMB5033", cat: "math", name: "Metrologia", hours: 54, pre: ["EMB5010"] }
  ]},
  { phase: 4, subjects: [
    { id: "EMB5014", cat: "math", name: "Séries e Equações Diferenciais", hours: 72, pre: ["EMB5007", "EMB5029"] },
    { id: "EMB5015", cat: "mech", name: "Dinâmica", hours: 72, pre: ["EMB5011"] },
    { id: "EMB5017", cat: "fluid", name: "Mecânica dos Fluidos", hours: 72, pre: ["EMB5009", "EMB5030"] },
    { id: "EMB5021", cat: "mech", name: "Mecânica dos Sólidos I", hours: 72, pre: ["EMB5011", "EMB5022"] },
    { id: "EMB5027", cat: "project", name: "Metodologia de Projeto", hours: 72 },
    { id: "EMB5031", cat: "physics", name: "Eletromagnetismo", hours: 72, pre: ["EMB5030"] }
  ]},
  { phase: 5, subjects: [
    { id: "EMB5102", cat: "material", name: "Processo de Fabricação", hours: 72, pre: ["EMB5022"] },
    { id: "EMB5103", cat: "fluid", name: "Transmissão de Calor I", hours: 72, pre: ["EMB5014", "EMB5017"] },
    { id: "EMB5104", cat: "mech", name: "Mecânica dos Sólidos II", hours: 72, pre: ["EMB5021"] },
    { id: "EMB5105", cat: "mech", name: "Mecanismos", hours: 36, pre: ["EMB5015"] },
    { id: "EMB5108", cat: "elec", name: "Circuitos Elétricos", hours: 72, pre: ["EMB5031"] },
    { id: "EMB5109", cat: "mgmt", name: "Gestão Industrial", hours: 72, ementa: "Estratégia, PCP, gestão de pessoas e economia." },
    { id: "EMB5115", cat: "mech", name: "Vibrações", hours: 72, pre: ["EMB5014", "EMB5015"] }
  ]},
  { phase: 6, subjects: [
    { id: "EMB5024", cat: "fluid", name: "Sistemas Hidro-Pneumáticos", hours: 36, pre: ["EMB5017"] },
    { id: "EMB5106", cat: "fluid", name: "Máquinas de Fluxo e Propulsão", hours: 72, pre: ["EMB5017"] },
    { id: "EMB5110", cat: "mech", name: "Elementos de Máquinas", hours: 72, pre: ["EMB5104", "EMB5105"] },
    { id: "EMB5111", cat: "comp", name: "Introdução ao Controle", hours: 72, pre: ["EMB5014"] },
    { id: "EMB5116", cat: "elec", name: "Eletrônica Analógica", hours: 72, pre: ["EMB5108"] },
    { id: "EMB5502", cat: "material", name: "Ligações Permanentes", hours: 72, pre: ["EMB5102"] },
    { id: "EMB5605", cat: "elec", name: "Eletrônica de Potência", hours: 72, pre: ["EMB5116"] },
    { id: "EMB5627", cat: "elec", name: "Sistemas Motrizes I", hours: 72, pre: ["EMB5108"] }
  ]},
  { phase: 7, subjects: [
    { id: "EMB5503", cat: "elec", name: "Sistemas de Comunicação", hours: 72, pre: ["EMB5116"] },
    { id: "EMB5506", cat: "railway", name: "Dinâmica Ferroviária e Metro.", hours: 54, pre: ["EMB5115"] },
    { id: "EMB5507", cat: "railway", name: "Veículos de Tração I", hours: 72, pre: ["EMB5106"] },
    { id: "EMB5508", cat: "railway", name: "Sistemas Veiculares: Suspensão", hours: 72, pre: ["EMB5110"] },
    { id: "EMB5525", cat: "railway", name: "Eng. Ferroviária: Fundamentos", hours: 54, ementa: "História, mercado e legislação das ferrovias." },
    { id: "EMB5628", cat: "elec", name: "Sistemas Motrizes II", hours: 54, pre: ["EMB5627"] }
  ]},
  { phase: 8, subjects: [
    { id: "EMB5509", cat: "railway", name: "Veículos de Tração II", hours: 72, pre: ["EMB5507", "EMB5605"] },
    { id: "EMB5510", cat: "railway", name: "Vagões e Carros Metroviários", hours: 72, pre: ["EMB5021", "EMB5102"] },
    { id: "EMB5511", cat: "railway", name: "Sinalização e Controle Tráfego", hours: 54, pre: ["EMB5503"] },
    { id: "EMB5512", cat: "railway", name: "Manutenção Ferroviária I", hours: 72, pre: ["EMB5107", "EMB5507"] },
    { id: "EMB5513", cat: "railway", name: "Operação Ferroviária e Metro.", hours: 54, pre: ["EMB5109"] },
    { id: "EMB5515", cat: "comp", name: "Métodos Computacionais Eng.", hours: 72, pre: ["EMB5016"] },
    { id: "EMB5521", cat: "project", name: "Planejamento do TCC", hours: 36, pre: ["EMB5027"] }
  ]},
  { phase: 9, subjects: [
    { id: "EMB5514", cat: "railway", name: "Via Permanente", hours: 54, pre: ["EMB5011", "EMB5012"] },
    { id: "EMB5516", cat: "railway", name: "Planejamento Transp. Público", hours: 72, pre: ["EMB5513"] },
    { id: "EMB5517", cat: "railway", name: "Manutenção Ferroviária II", hours: 72, pre: ["EMB5512"] },
    { id: "EMB5518", cat: "railway", name: "Segurança e Prev. Acidentes", hours: 54, pre: ["EMB5506"] },
    { id: "EMB5519", cat: "mgmt", name: "Gestão de Empreendimentos", hours: 36, pre: ["EMB5109"] },
    { id: "EMB5520", cat: "elec", name: "Transmissão e Distr. Energia", hours: 54, pre: ["EMB5605"] },
    { id: "EMB5522", cat: "project", name: "Trabalho de Conclusão (TCC)", hours: 72, pre: ["EMB5521"] }
  ]},
  { phase: 10, subjects: [
    { id: "EMB5523", cat: "project", name: "Estágio Curricular Obrigatório", hours: 396, ementa: "Vivência prática em indústria ou instituição de pesquisa." }
  ]}
];
export const OPTATIVAS_2012: Subject[] = [
  { id: "EMB5019", cat: "human", name: "Ética e Disciplina Consciente", hours: 36 },
  { id: "EMB5023", cat: "human", name: "Fundamentos Eng. Mobilidade", hours: 36 },
  { id: "EMB5107", cat: "mgmt", name: "Manutenção e Confiabilidade", hours: 36, pre: ["EMB5010"] },
  { id: "EMB5113", cat: "comp", name: "Modelagem de Sistemas", hours: 72 },
  { id: "EMB5032", cat: "human", name: "Avaliação Impactos Ambientais", hours: 36 },
  { id: "LSB7904", cat: "human", name: "Libras I", hours: 72 }
];

export const CURRICULUMS: CurriculumData[] = [
  { id: '2025', year: 2025, name: 'Grade 2025 (Atual)', phases: CURRICULO_2025, optativas: OPTATIVAS_2025 },
  { id: '2016', year: 2016, name: 'Grade 2016', phases: CURRICULO_2016, optativas: OPTATIVAS_2016 },
  { id: '2012', year: 2012, name: 'Grade 2012', phases: CURRICULO_2012, optativas: OPTATIVAS_2012 },
];
