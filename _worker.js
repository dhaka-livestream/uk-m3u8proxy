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

    try {
      // ১. শুধু নির্দিষ্ট পাথ হ্যান্ডেল করুন
      if (!path.startsWith(ROUTE_PREFIX)) {
        return new Response(`Not Found: ${path}`, { status: 404 });
      }

      // ২. পাথ থেকে আপস্ট্রিমের আপেক্ষিক পাথ বের করুন
      const relativePath = path.substring(ROUTE_PREFIX.length);
      
      // ৩. যদি পাথটি index.m3u8 হয়, তাহলে সেটি প্রসেস করুন
      if (relativePath === "index.m3u8") {
        const upstreamUrl = UPSTREAM_BASE + "index.m3u8";
        const response = await fetch(upstreamUrl, { 
          headers: CUSTOM_HEADERS,
          cf: { cacheTtl: 0 }
        });

        if (!response.ok) {
          return new Response(
            `Upstream Error: ${response.status} ${response.statusText}\nURL: ${upstreamUrl}`,
            { status: response.status }
          );
        }

        const text = await response.text();
        
        // প্লেলিস্টের সব লিংককে Worker-এর পাথে রিরাইট করুন
        const rewritten = text
          .split("\n")
          .map((line) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) {
              // URI="..." থাকলে সেটিও আপডেট করুন
              if (trimmed.includes('URI="') && !trimmed.includes('URI="http')) {
                return trimmed.replace(/URI="([^"]*)"/g, (match, p1) => {
                  const filename = p1.split('/').pop().split('?')[0];
                  return `URI="${workerOrigin}${ROUTE_PREFIX}${filename}"`;
                });
              }
              return line;
            }

            // লাইনটি যদি কোনো লিংক হয় (সেগমেন্ট বা সাব-প্লেলিস্ট)
            let filename = trimmed;
            if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
              try {
                const parsed = new URL(trimmed);
                filename = parsed.pathname.split('/').pop().split('?')[0];
              } catch {
                filename = trimmed.split('/').pop().split('?')[0];
              }
            } else {
              filename = trimmed.split('/').pop().split('?')[0];
            }

            if (filename) {
              return workerOrigin + ROUTE_PREFIX + filename;
            }
            return line;
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

      // ৪. সেগমেন্ট বা অন্য যেকোনো ফাইল (যেমন .ts) – সরাসরি প্রোক্সি
      const upstreamUrl = UPSTREAM_BASE + relativePath;
      const response = await fetch(upstreamUrl, { 
        headers: CUSTOM_HEADERS,
        cf: { cacheTtl: 0 }
      });

      if (!response.ok) {
        return new Response(
          `Upstream Error: ${response.status} ${response.statusText}\nURL: ${upstreamUrl}`,
          { status: response.status }
        );
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
        `Worker Runtime Error:\n${err.message}\n\nStack:\n${err.stack}`,
        { status: 500 }
      );
    }
  }
};
