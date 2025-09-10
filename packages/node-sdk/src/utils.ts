import { safeatob } from "@web3auth/auth";

export function parseToken<T>(token: string): { header: { alg: string; typ: string; kid?: string }; payload: T } {
  try {
    const [header, payload] = token.split(".");
    return {
      header: JSON.parse(safeatob(header)),
      payload: JSON.parse(safeatob(payload)) as T,
    };
  } catch {
    return null;
  }
}
