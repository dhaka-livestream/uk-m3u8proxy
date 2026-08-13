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

    // ১. শুধুমাত্র আপনার নির্দিষ্ট পাথের রিকোয়েস্ট প্রক্রিয়া করুন
    if (path.startsWith(ROUTE_PREFIX)) {
      const relativePath = path.substring(ROUTE_PREFIX.length);
      const upstreamUrl = UPSTREAM_BASE + relativePath;

      const response = await fetch(upstreamUrl, { headers: CUSTOM_HEADERS });

      if (!response.ok) {
        return new Response(`Upstream Error: ${response.status}`, { status: response.status });
      }

      // M3U8 ফাইল প্রসেস করা
      if (relativePath === "index.m3u8" || relativePath.endsWith(".m3u8")) {
        const text = await response.text();
        const lines = text.split("\n");

        const rewrittenLines = lines.map(line => {
          // ... (আপনার আগের M3U8 রিরাইট করার কোড এখানে বসবে) ...
          // সংক্ষেপে: এখানে সেই কোডই থাকবে যা ছোট পাথগুলোকে পূর্ণ URL-এ রূপান্তর করে
          if (!line.trim() || line.startsWith("#")) {
            if (line.includes('URI="') && !line.includes('URI="http')) {
              return line.replace(/URI="([^"]*)"/g, (match, p1) => {
                let filename = p1.split('/').pop().split('?')[0];
                return `URI="${workerOrigin}${ROUTE_PREFIX}${filename}"`;
              });
            }
            return line;
          }
          let filename = line.trim();
          // ... (filename প্রসেসিং এর কোড) ...
          if (filename) {
            return workerOrigin + ROUTE_PREFIX + filename;
          }
          return line;
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

      // অন্যান্য ফাইল (যেমন .ts সেগমেন্ট) সরাসরি পাস করুন
      const newHeaders = new Headers(response.headers);
      newHeaders.set("Access-Control-Allow-Origin", "*");
      newHeaders.set("Cache-Control", "no-cache");
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    }

    // ২. অন্য যেকোনো রিকোয়েস্ট (যেমন: /, /about) Pages-এর অ্যাসেট সার্ভারে পাঠান
    //    এটি আপনার স্ট্যাটিক ফাইল (যেমন index.html) serve করবে
    return env.ASSETS.fetch(request);
  }
};
