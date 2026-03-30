import { createHmac } from "node:crypto";
import { parseShipmondoWebhookPayload, verifyShipmondoWebhookJwt } from "../lib/webhook-jwt";

function makeHs256Jwt(payload: Record<string, unknown>, secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signingInput = `${header}.${body}`;
  const sig = createHmac("sha256", secret).update(signingInput).digest("base64url");
  return `${signingInput}.${sig}`;
}

describe("verifyShipmondoWebhookJwt", () => {
  it("decodes a valid HS256 JWT", () => {
    const secret = "test-secret";
    const token = makeHs256Jwt(
      {
        webhook: "Test",
        data: { id: 1, reference: "order_01test", pkg_no: "PKG1" },
        url: "https://example.com/hook",
      },
      secret
    );
    const out = verifyShipmondoWebhookJwt(token, secret);
    expect(out.webhook).toBe("Test");
    expect((out.data as Record<string, unknown>).reference).toBe("order_01test");
  });

  it("rejects wrong secret", () => {
    const token = makeHs256Jwt({ data: {} }, "correct");
    expect(() => verifyShipmondoWebhookJwt(token, "wrong")).toThrow(/signature/i);
  });

  it("rejects malformed token", () => {
    expect(() => verifyShipmondoWebhookJwt("not-a-jwt", "s")).toThrow();
  });
});

describe("parseShipmondoWebhookPayload", () => {
  it("extracts nested data object", () => {
    const p = parseShipmondoWebhookPayload({
      webhook: "W",
      data: { reference: "order_x" },
      url: "https://x",
    });
    expect(p.data?.reference).toBe("order_x");
    expect(p.webhook).toBe("W");
  });
});
