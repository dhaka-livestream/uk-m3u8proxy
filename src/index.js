// ========== কনফিগারেশন ==========
const UPSTREAM_BASE = "https://anet.keralive.workers.dev/v1/master/a0d007312bfd99c47f76b77ae26b1ccdaae76cb1/starjalsha_live_https/";
const ROUTE_PREFIX = "/starjalshahd-uk/";
const CUSTOM_HEADERS = {
  "Origin": "https://bhoomtv.me",
  "Referer": "https://bhoomtv.me",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
};
// ==================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const workerOrigin = url.origin;

    // রুট পাথে (/) গেলে 404 দেখাবে, "Hello world" নয়
    if (!path.startsWith(ROUTE_PREFIX)) {
      return new Response(`Not Found: ${path}`, { status: 404 });
    }

    const relativePath = path.substring(ROUTE_PREFIX.length);
    const upstreamUrl = UPSTREAM_BASE + relativePath;

    try {
      const response = await fetch(upstreamUrl, { headers: CUSTOM_HEADERS });

      if (!response.ok) {
        return new Response(
          `Upstream Error: ${response.status} ${response.statusText}\nURL: ${upstreamUrl}`,
          { status: response.status }
        );
      }

      if (relativePath === "index.m3u8" || relativePath.endsWith(".m3u8")) {
        let text = await response.text();
        const baseUrl = UPSTREAM_BASE.replace(/\/[^/]*$/, '/');
        const rewritten = text
          .split("\n")
          .map((line) => {
            line = line.trim();
            if (!line || line.startsWith("#")) {
              if (line.includes('URI="') && !line.includes('URI="http')) {
                return line.replace(/URI="([^"]*)"/g, (match, p1) => {
                  const fullUrl = new URL(p1, baseUrl).href;
                  return `URI="${fullUrl}"`;
                });
              }
              return line;
            }
            try {
              const fullUrl = new URL(line, baseUrl).href;
              return fullUrl;
            } catch {
              return line;
            }
          })
          .join("\n");

        return new Response(rewritten, {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }

      const newHeaders = new Headers(response.headers);
      newHeaders.set("Access-Control-Allow-Origin", "*");
      newHeaders.set("Cache-Control", "no-cache");
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });

    } catch (err) {
      return new Response(
        `Worker Error: ${err.message}\n\nStack: ${err.stack}`,
        { status: 500 }
      );
    }
  }
};
