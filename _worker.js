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

    // ১. শুধু নির্দিষ্ট পাথ প্রসেস করুন
    if (!path.startsWith(ROUTE_PREFIX)) {
      return new Response(`Not Found: ${path}`, { status: 404 });
    }

    const relativePath = path.substring(ROUTE_PREFIX.length);
    const upstreamUrl = UPSTREAM_BASE + relativePath;

    try {
      // ২. আপস্ট্রিম থেকে ডেটা আনার চেষ্টা করুন
      const response = await fetch(upstreamUrl, { headers: CUSTOM_HEADERS });

      // ৩. আপস্ট্রিম রেসপন্স ঠিক আছে কিনা চেক করুন
      if (!response.ok) {
        return new Response(
          `Upstream Error: ${response.status} ${response.statusText}\nURL: ${upstreamUrl}`,
          { status: response.status }
        );
      }

      // ৪. যদি M3U8 ফাইল হয়, তাহলে প্রসেস করুন
      if (relativePath === "index.m3u8" || relativePath.endsWith(".m3u8")) {
        const text = await response.text();
        const lines = text.split("\n");

        // ৫. রিরাইটিং লজিক (সহজ ভার্সন)
        const rewrittenLines = lines.map(line => {
          if (!line.trim() || line.startsWith("#")) {
            // URI="..." থাকলে সেটাও আপডেট করুন
            if (line.includes('URI="') && !line.includes('URI="http')) {
              return line.replace(/URI="([^"]*)"/g, (match, p1) => {
                let filename = p1.split('/').pop().split('?')[0];
                return `URI="${workerOrigin}${ROUTE_PREFIX}${filename}"`;
              });
            }
            return line;
          }

          let filename = line.trim();
          // যদি লিংকটি সম্পূর্ণ URL হয়, ফাইলের নাম বের করুন
          if (filename.startsWith("http://") || filename.startsWith("https://")) {
            try {
              const parsed = new URL(filename);
              filename = parsed.pathname.split('/').pop().split('?')[0];
            } catch {
              const parts = filename.split('/');
              filename = parts[parts.length - 1].split('?')[0];
            }
          } else {
            filename = filename.split('?')[0];
          }

          if (filename) {
            return workerOrigin + ROUTE_PREFIX + filename;
          }
          return line;
        });

        // ৬. রিরাইট করা প্লেলিস্ট রিটার্ন করুন
        return new Response(rewrittenLines.join("\n"), {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }

      // ৭. অন্যান্য ফাইল (যেমন .ts) সরাসরি পাস করুন
      const newHeaders = new Headers(response.headers);
      newHeaders.set("Access-Control-Allow-Origin", "*");
      newHeaders.set("Cache-Control", "no-cache");
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });

    } catch (err) {
      // ৮. কোনো এরর হলে তার বিবরণ দেখান
      return new Response(
        `Worker Error: ${err.message}\n\nStack: ${err.stack}`,
        { status: 500 }
      );
    }
  }
};
