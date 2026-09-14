# Pessoas, permissões e papéis

## Modelo

Separar identidade de autenticação, perfil e autorização. Papéis globais: Administrador, Coordenação, Professor/Orientador, Líder, Membro/Aluno, Colaborador Externo e Visualizador. Líder/Membro/Visualizador devem ser principalmente papéis por projeto; uma pessoa pode variar por projeto.

Autorização efetiva = papel global + membership ativo + ação + classificação do recurso + grant excepcional. Negação explícita e menor privilégio prevalecem; decisão final sempre no servidor/RLS.

## Matriz inicial (validar institucionalmente)

| Ação | Admin | Coordenação | Orientador | Líder | Membro | Externo | Visualizador |
|---|---:|---:|---:|---:|---:|---:|---:|
| configurar sistema | sim | não | não | não | não | não | não |
| ver todos os projetos | sim | sim | não | não | não | não | não |
| gerir projeto vinculado | sim | sim | validar | sim | limitado | grant | não |
| criar missão | sim | sim | conforme projeto | sim | conforme permissão | não padrão | não |
| aprovar publicação | sim | sim | se delegado | não padrão | não | não | não |
| ver restrito | por função | por função | vinculado | vinculado | vinculado | grant explícito | não |
| exportar relatório | por permissão | sim | vinculado | vinculado | limitado | não padrão | leitura permitida |

## Ciclo de acesso

Convite com expiração → aceite → provisionamento → associação → revisão periódica → desativação. Domínio UFSC não concede acesso automático a todos os dados. Externo deve expirar por padrão. Último administrador não pode ser removido sem sucessor.

## Testes obrigatórios

Matriz positiva e negativa; tentativa cross-project; ID alterado; API direta; busca/exportação; usuário desativado; convite expirado/reutilizado; mudança de papel; remoção de membership; grant externo expirado. Todas as mudanças de permissão geram auditoria.
