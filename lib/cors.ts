const builtInOrigins = ["https://sterlingcreations.ai", "https://www.sterlingcreations.ai"];

function allowedOrigins() {
  const configured = (process.env.PROMO_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return new Set([...builtInOrigins, ...configured]);
}

export function corsHeaders(request: Request) {
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  });
  const origin = request.headers.get("origin")?.replace(/\/$/, "");
  if (origin && allowedOrigins().has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  return headers;
}

export function withCors(request: Request, response: Response) {
  corsHeaders(request).forEach((value, key) => response.headers.set(key, value));
  return response;
}

export function corsPreflight(request: Request) {
  const headers = corsHeaders(request);
  const origin = request.headers.get("origin");
  if (origin && !headers.has("Access-Control-Allow-Origin")) {
    return new Response(null, { status: 403, headers });
  }
  return new Response(null, { status: 204, headers });
}
