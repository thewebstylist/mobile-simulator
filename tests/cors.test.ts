import { describe, expect, it } from "vitest";
import { corsHeaders, corsPreflight } from "@/lib/cors";

describe("standalone frontend CORS", () => {
  it("allows the Sterling Creations website", () => {
    const request = new Request("https://api.example.test/api/generate", {
      method: "OPTIONS",
      headers: { origin: "https://sterlingcreations.ai" },
    });
    expect(corsHeaders(request).get("Access-Control-Allow-Origin")).toBe("https://sterlingcreations.ai");
    expect(corsPreflight(request).status).toBe(204);
  });

  it("rejects unknown cross-origin preflight requests", () => {
    const request = new Request("https://api.example.test/api/generate", {
      method: "OPTIONS",
      headers: { origin: "https://attacker.example" },
    });
    expect(corsHeaders(request).has("Access-Control-Allow-Origin")).toBe(false);
    expect(corsPreflight(request).status).toBe(403);
  });
});
