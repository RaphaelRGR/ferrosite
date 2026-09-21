import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startHarness, type Harness } from "./harness";

/**
 * DRIVE-002: a linha da conexão institucional só existe para o service role;
 * admin/coordenação leem o estado por função que nunca devolve tokens; membros
 * e anônimos não veem nada. Linha única garantida pelo banco.
 */
let h: Harness;
const ids: Record<string, string> = {};

const rows = async (userId: string | null, sql: string, params: unknown[] = []) =>
  h.as(userId, async (c) => (await c.query(sql, params)).rows);
const fails = async (userId: string | null, sql: string, params: unknown[] = []) => {
  try {
    await h.as(userId, (c) => c.query(sql, params));
    return null;
  } catch (e) {
    return (e as Error).message;
  }
};

beforeAll(async () => {
  h = await startHarness();
  for (const [key, role] of [["admin", "admin"], ["coord", "coordination"], ["member", "member"]] as const) {
    ids[key] = await h.createUser(`${key}@test.invalid`, key);
    await h.admin.query("update public.profile set global_role = $2, status = 'active' where id = $1", [ids[key], role]);
  }
}, 120_000);

afterAll(async () => {
  await h?.stop();
});

describe("drive_integration", () => {
  it("nasce com uma linha desconectada e não aceita segunda linha", async () => {
    const all = (await h.admin.query("select status, singleton from public.drive_integration")).rows;
    expect(all).toEqual([{ status: "disconnected", singleton: true }]);
    await expect(h.admin.query("insert into public.drive_integration (singleton) values (false)")).rejects.toThrow(/check/);
    await expect(h.admin.query("insert into public.drive_integration (singleton) values (true)")).rejects.toThrow(/duplicate key/);
  });

  it("ninguém autenticado nem anônimo lê ou escreve a tabela; service role sim", async () => {
    for (const who of [ids.admin, ids.coord, ids.member, null]) {
      expect(await fails(who, "select * from public.drive_integration")).toMatch(/permission denied/);
      expect(await fails(who, "update public.drive_integration set status = 'connected'")).toMatch(/permission denied/);
    }
    await h.asService((c) =>
      c.query("update public.drive_integration set status = 'connected', provider_account_email = 'conta@exemplo.invalid', scope = 'drive.readonly', access_token_enc = 'v1.x.y.z', refresh_token_enc = 'v1.a.b.c', root_folder_id = 'pasta123', root_folder_name = 'Engenharia Ferroviária' where singleton"),
    );
  });

  it("estado por função: admin e coordenação veem conta/pasta/escopo mas nunca token; membro e anônimo não veem", async () => {
    for (const who of [ids.admin, ids.coord]) {
      const [s] = await rows(who, "select * from public.drive_integration_status()");
      expect(s).toMatchObject({ status: "connected", provider_account_email: "conta@exemplo.invalid", root_folder_id: "pasta123", root_folder_name: "Engenharia Ferroviária", has_refresh_token: true });
      expect(JSON.stringify(s)).not.toMatch(/v1\.|token_enc/);
    }
    expect(await rows(ids.member, "select * from public.drive_integration_status()")).toHaveLength(0);
    expect(await fails(null, "select * from public.drive_integration_status()")).toMatch(/permission denied/);
  });
});
