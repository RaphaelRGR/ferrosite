import { getDriveClient } from "./drive-connection";

/** Há alguma credencial do Drive utilizável (OAuth conectado ou conta de serviço)? Sem chamadas ao Google. */
export async function isDriveAvailable(): Promise<boolean> {
  return (await getDriveClient()) !== null;
}
