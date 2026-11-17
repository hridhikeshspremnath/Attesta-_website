// Server-only client for the Attesta gateway (mTLS with this workload's SPIFFE SVID).
// Never import from a client component: it reads the private key from disk.
import { readFileSync } from "node:fs";
import https from "node:https";
import { join } from "node:path";

// Files as written by `spire-agent api fetch x509 -write <dir>`; re-read per request
// because SVIDs rotate.
function svid(dir: string) {
  return {
    cert: readFileSync(join(dir, "svid.0.pem")),
    key: readFileSync(join(dir, "svid.0.key")),
    ca: readFileSync(join(dir, "bundle.0.pem")),
  };
}

/** `nextCursor` is the gateway's X-Next-Cursor header ("" when there are no more pages). */
export function gatewayGet<T>(path: string): Promise<{ status: number; body: T; nextCursor: string }> {
  const base = process.env.ATTESTA_GATEWAY_URL;
  const dir = process.env.ATTESTA_SVID_DIR;
  const gatewayId = process.env.ATTESTA_GATEWAY_SPIFFE_ID ?? "spiffe://attesta.example.org/gateway";
  if (!base || !dir) return Promise.reject(new Error("ATTESTA_GATEWAY_URL and ATTESTA_SVID_DIR must be set"));

  return new Promise((resolve, reject) => {
    const req = https.get(new URL(path, base), {
      ...svid(dir),
      timeout: 5000,
      // SPIFFE: the server is identified by its URI SAN, not its hostname.
      checkServerIdentity: (_host, cert) =>
        cert.subjectaltname?.split(", ").includes(`URI:${gatewayId}`)
          ? undefined
          : new Error(`unexpected gateway identity: ${cert.subjectaltname}`),
    }, (res) => {
      let text = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { text += chunk; });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode ?? 0, body: JSON.parse(text) as T, nextCursor: String(res.headers["x-next-cursor"] ?? "") });
        }
        catch (err) { reject(err); }
      });
    });
    req.on("timeout", () => req.destroy(new Error("gateway timed out")));
    req.on("error", reject);
  });
}
