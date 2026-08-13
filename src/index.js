// ========== কনফিগারেশন ==========
const UPSTREAM_BASE = "https://anet.keralive.workers.dev/v1/master/a0d007312bfd99c47f76b77ae26b1ccdaae76cb1/starjalsha_live_https/";
const ROUTE_PREFIX = "/starjalshahd-uk/";   // আপনার পছন্দের পাথ
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
      // ১. শুধু নির্দিষ্ট পাথ হ্যান্ডেল করুন, বাকি সব 404
      if (!path.startsWith(ROUTE_PREFIX)) {
        return new Response(`Not Found: ${path}`, { 
          status: 404,
          headers: { "Content-Type": "text/plain" }
        });
      }

      // ২. পাথ থেকে আপস্ট্রিমের আপেক্ষিক পাথ বের করুন
      const relativePath = path.substring(ROUTE_PREFIX.length);
      // যদি relativePath খালি হয়, তাহলে index.m3u8 ধরে নিন
      const upstreamUrl = relativePath
        ? UPSTREAM_BASE + relativePath
        : UPSTREAM_BASE + "index.m3u8";

      // ৩. আপস্ট্রিম থেকে ডেটা আনুন (হেডার সহ)
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

      // ৪. যদি .m3u8 ফাইল হয়, তাহলে সব লিংক রিরাইট করুন
      if (relativePath.endsWith(".m3u8") || !relativePath) {
        const text = await response.text();
        const lines = text.split("\n");

        const rewrittenLines = lines.map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return line;

          // ৪.১ কমেন্ট লাইন (যেমন #EXTINF, #EXT-X-VERSION)
          if (trimmed.startsWith("#")) {
            // URI="..." থাকলে সেটি আপডেট করুন
            if (trimmed.includes('URI="') && !trimmed.includes('URI="http')) {
              return trimmed.replace(/URI="([^"]*)"/g, (match, p1) => {
                // p1 হলো আপেক্ষিক পাথ (যেমন: key.bin)
                // তাকে Worker-এর পাথে রূপান্তর করুন
                const newPath = p1.startsWith('/') ? p1 : `/${p1}`;
                const fullUrl = workerOrigin + ROUTE_PREFIX + newPath.replace(/^\//, '');
                return `URI="${fullUrl}"`;
              });
            }
            return line; // কমেন্ট লাইন অপরিবর্তিত রাখুন
          }

          // ৪.২ সেগমেন্ট বা অন্য .m3u8 লিংক
          // লাইনটি আপেক্ষিক বা পূর্ণ URL হতে পারে
          let pathToUse = trimmed;
          // যদি পূর্ণ URL হয়, তবে তার পাথ অংশ বের করুন
          if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            try {
              const parsed = new URL(trimmed);
              pathToUse = parsed.pathname + parsed.search; // পাথ + query string
            } catch {
              pathToUse = trimmed;
            }
          }
          // নিশ্চিত করুন pathToUse / দিয়ে শুরু হয়
          if (!pathToUse.startsWith('/')) {
            pathToUse = '/' + pathToUse;
          }
          // Worker-এর পাথে রূপান্তর (ROUTE_PREFIX + path)
          const newUrl = workerOrigin + ROUTE_PREFIX + pathToUse.replace(/^\//, '');
          return newUrl;
        });

        return new Response(rewrittenLines.join("\n"), {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }

      // ৫. .m3u8 ছাড়া অন্য ফাইল (যেমন .ts, .m4s) সরাসরি পাস করুন
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
