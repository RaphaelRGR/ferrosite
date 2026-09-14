# Arquitetura da informação

## Princípio de navegação

Manter poucos destinos primários e usar hubs, páginas contextuais e busca. “Projetos”, “Experiências” e “Para empresas” são hubs; notícias/laboratórios/projetos têm detalhe. A troca PT/EN preserva rota, filtros e item.

## Site público proposto

Menu: Início; O Curso; Projetos; Experiências; Notícias; Comunidade; Para Empresas; Portal; PT/EN.

Rotas canônicas sugeridas (decisão final na implementação i18n):

```text
/{locale}
/{locale}/curso
/{locale}/projetos
/{locale}/projetos/{slug}
/{locale}/experiencias
/{locale}/experiencias/{slug}
/{locale}/missoes-ferroviarias
/{locale}/eventos
/{locale}/eventos/{slug}
/{locale}/noticias
/{locale}/noticias/{slug}
/{locale}/comunidade
/{locale}/pessoas/{slug}
/{locale}/para-empresas
/{locale}/pesquisa-e-desenvolvimento
/{locale}/laboratorios
/{locale}/laboratorios/{slug}
/{locale}/parceiros
/{locale}/oportunidades
/{locale}/contato
```

Evitar traduzir slugs sem mapa permanente. Guardar `slug_pt`/`slug_en`, redirecionar alterações e emitir `hreflang`/canonical.

## Portal proposto

```text
/login
/portal
/portal/projetos
/portal/projetos/{id}/{visao|missoes|pipeline|equipe|cronograma|arquivos|galeria|...}
/portal/missoes
/portal/pipeline
/portal/experiencias
/portal/parceiros
/portal/pesquisa-desenvolvimento
/portal/oportunidades
/portal/pessoas
/portal/arquivos
/portal/aprovacoes
/portal/calendario
/portal/relatorios
/portal/configuracoes
/portal/auditoria (papéis autorizados)
```

Sidebar varia por permissão e módulos habilitados, não por código duplicado. Busca global respeita autorização e classificação.

## Relações conceituais

```text
Pessoa --membership--> Projeto --contém--> Missão/Atividade/Arquivo/Relatório
Organização --relacionamento--> Projeto/Experiência/Desafio/Oportunidade
Desafio P&D --triagem--> Capacidade --oferecida por--> Laboratório/Pesquisador
Registro interno --revisão/aprovação--> Projeção pública --publicação--> Site
```

## Regras de descoberta

- Home sintetiza; nunca replica hubs completos.
- Curso concentra formação e fluxograma.
- Experiências reúne visitas, viagens, missões técnicas, congressos e competições; tipos são filtros.
- Para Empresas começa pelo problema técnico e aponta a capacidades/labs, não por logos.
- Comunidade é vitrine humana, não gestão de pessoas.
- Portal abre no dashboard específico do perfil.
- Página inexistente não aparece na navegação; feature flags devem ser server-side e coerentes com permissão.

## Estados obrigatórios por rota

Loading/skeleton, vazio com próxima ação, erro recuperável, sem resultado, sem permissão, arquivado, offline/degradação quando relevante e sucesso. Nunca usar área vazia ou botão sem comportamento.
