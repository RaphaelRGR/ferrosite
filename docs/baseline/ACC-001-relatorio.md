# ACC-001: excluir contas do Portal

Data: 2026-10-17 · Pedido: "quero poder apagar contas, pois elas estão apenas como desativadas e continuam lá".

## Decisão do usuário

Excluir **sempre apaga o login e o e-mail**:
- conta sem histórico sai por completo;
- conta com histórico (autoria, aprovações, auditoria) vira **"Conta excluída"**, e os registros antigos continuam íntegros.

A auditoria continua só aceitando acréscimos.

## Por que não é um simples DELETE

52 colunas em 30 tabelas apontam para `profile`, quase todas com a regra padrão: o banco bloqueia a exclusão enquanto houver registro ligado. Entre elas está `audit_event.actor_id`, que não pode ser alterado.

## Entregue

- **Migration `20261017000100_account_erasure.sql`:**
  - `profile.deleted_at`;
  - o perfil deixou de depender de `auth.users` (sem a FK em cascata), para poder ficar como autoria depois que o login for apagado;
  - `erase_profile(p_target)` (security definer), que exige: só admin, nunca a própria conta, conta já desativada;
  - os avisos ainda não enviados para a conta são cancelados;
  - a função tenta apagar o perfil; se uma FK impede, anonimiza (nome "Conta excluída", e-mail vazio, papel "viewer", `deleted_at`) e tira os vínculos de projeto, de missão e as preferências;
  - a exclusão é registrada como `profile.erased`, com o modo, sem dados pessoais;
  - a chamada é idempotente.
- **`guard_profile_privileges`:**
  - `deleted_at` só muda pela função;
  - conta excluída não pode ser alterada nem reativada;
  - a exceção da anonimização vale só com o flag da transação, um admin chamando, outra conta e exatamente a forma da exclusão: o flag não serve para ninguém se promover.
- **Servidor (`eraseProfileAccount`):**
  - confere a sessão de admin e o e-mail digitado;
  - chama `erase_profile`;
  - depois apaga o login no Supabase Auth com a service role, que só existe no servidor;
  - se o login falhar depois do perfil, a mensagem pede para tentar de novo, e a repetição completa o trabalho.
- **Portal / Pessoas:**
  - "Excluir conta" só aparece em conta desativada que não seja a sua;
  - a janela explica as consequências e só libera "Excluir de vez" com o e-mail da conta digitado;
  - contas anonimizadas saem da lista.
- **Regra espelhada:** `canEraseAccount` em `lib/portal/authz.ts`.

## Testes

- **RLS (`tests/rls/account-erasure.test.ts`, 5):**
  - permissões: coordenação e membro não excluem; ninguém exclui a própria conta; conta ativa precisa ser desativada antes;
  - remoção completa auditada;
  - anonimização com o histórico preservado e o aviso pendente cancelado;
  - conta excluída não volta;
  - o flag não permite escalada nem marcação manual.
- **Suítes:** RLS inteira 110/110 e unit (`canEraseAccount`).
