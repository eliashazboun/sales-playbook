import { randomUUID } from "crypto";

const SENSITIVE_QUERY_KEYS = new Set([
  "password",
  "pass",
  "token",
  "access_token",
  "refresh_token",
  "api_key",
  "apikey",
  "key",
  "secret",
  "authorization",
  "email",
  "phone",
]);

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function getClientIp(req: Request) {
  // Most hosting providers/proxies populate one of these headers.
  // Never use this as an authentication/security decision by itself.
  return (
    firstHeaderValue(req.headers.get("x-forwarded-for")) ??
    firstHeaderValue(req.headers.get("x-vercel-forwarded-for")) ??
    firstHeaderValue(req.headers.get("cf-connecting-ip")) ??
    firstHeaderValue(req.headers.get("x-real-ip")) ??
    "unknown"
  );
}

function getSafeQuery(url: URL) {
  const query: Record<string, string> = {};

  for (const [key, value] of url.searchParams.entries()) {
    query[key] = SENSITIVE_QUERY_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : value;
  }

  return query;
}

function compactUserAgent(userAgent: string | null) {
  if (!userAgent) return null;
  return userAgent.length > 300 ? `${userAgent.slice(0, 300)}…` : userAgent;
}

type RouteHandler<Args extends unknown[]> = (
  req: Request,
  ...args: Args
) => Response | Promise<Response>;

export function withApiLogging<Args extends unknown[]>(handler: RouteHandler<Args>) {
  return async (req: Request, ...args: Args): Promise<Response> => {
    const startedAt = new Date();
    const startedMs = performance.now();
    const url = new URL(req.url);
    const requestId = req.headers.get("x-request-id") || randomUUID();

    const baseLog = {
      requestId,
      timestamp: startedAt.toISOString(),
      method: req.method,
      path: url.pathname,
      query: getSafeQuery(url),
      ip: getClientIp(req),
      userAgent: compactUserAgent(req.headers.get("user-agent")),
      referer: req.headers.get("referer"),
      origin: req.headers.get("origin"),
      acceptLanguage: req.headers.get("accept-language"),
      contentType: req.headers.get("content-type"),
      contentLength: req.headers.get("content-length"),
    };

    console.info(
      `[API REQUEST] ${JSON.stringify({
        ...baseLog,
        event: "request_started",
      })}`
    );

    try {
      const response = await handler(req, ...args);
      const durationMs = Math.round((performance.now() - startedMs) * 10) / 10;

      response.headers.set("x-request-id", requestId);

      console.info(
        `[API RESPONSE] ${JSON.stringify({
          ...baseLog,
          event: "request_completed",
          status: response.status,
          durationMs,
          completedAt: new Date().toISOString(),
        })}`
      );

      return response;
    } catch (error) {
      const durationMs = Math.round((performance.now() - startedMs) * 10) / 10;

      console.error(
        `[API ERROR] ${JSON.stringify({
          ...baseLog,
          event: "request_failed",
          status: 500,
          durationMs,
          failedAt: new Date().toISOString(),
          error:
            error instanceof Error
              ? { name: error.name, message: error.message, stack: error.stack }
              : { message: String(error) },
        })}`
      );

      throw error;
    }
  };
}
