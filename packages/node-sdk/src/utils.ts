import { base64toJSON } from "@web3auth/auth";

export function parseToken<T>(token: string): { header: { alg: string; typ: string; kid?: string }; payload: T } | null {
  try {
    const [header, payload] = token.split(".");
    return {
      header: base64toJSON(header),
      payload: base64toJSON(payload) as T,
    };
  } catch {
    return null;
  }
}
