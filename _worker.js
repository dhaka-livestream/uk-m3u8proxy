// ========== কনফিগারেশন (শুধু এখানে পরিবর্তন করুন) ==========
// আপনার GitHub Raw লিংক (যে .m3u ফাইলটি কাজ করে)
const GITHUB_RAW_URL = "https://raw.githubusercontent.com/ইউজারনেম/রিপোজিটরি-নাম/ব্রাঞ্চ-নাম/ফাইলের-পাথ/ফাইলনাম.m3u";

// আপনি যে পাথটি ব্যবহার করতে চান (স্ল্যাশ দিয়ে শুরু ও শেষ)
const ROUTE_PREFIX = "/starjalshahd-uk/";

// আপস্ট্রিমের বেস URL (যেখান থেকে সেগমেন্ট লোড হবে)
const UPSTREAM_BASE = "https://anet.keralive.workers.dev/v1/master/a0d007312bfd99c47f76b77ae26b1ccdaae76cb1/starjalsha_live_https/";

// প্রয়োজনীয় হেডার (যা GitHub প্লেলিস্টে ছিল)
const CUSTOM_HEADERS = {
  "Origin": "https://bhoomtv.me",
  "Referer": "https://bhoomtv.me",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
};
// ===========================================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const workerOrigin = url.origin;

    try {
      // ১. যদি রিকোয়েস্ট index.m3u8 এর জন্য হয়
      if (path === ROUTE_PREFIX + "index.m3u8") {
        // GitHub থেকে প্লেলিস্ট ফেচ করুন
        const response = await fetch(GITHUB_RAW_URL, {
          cf: { cacheTtl: 0 }
        });

        if (!response.ok) {
          return new Response(`GitHub Error: ${response.status}`, { status: response.status });
        }

        const text = await response.text();
        const lines = text.split("\n");

        // ২. প্রতিটি লাইন প্রসেস করুন
        const rewrittenLines = lines.map((line) => {
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

          // ৩. লিংকটি (সেগমেন্ট বা সাব-প্লেলিস্ট) প্রসেস করুন
          let filename = trimmed;
          // যদি পূর্ণ URL হয়, ফাইলের নাম বের করুন
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

          // ৪. Worker-এর পাথে রূপান্তর
          if (filename) {
            return workerOrigin + ROUTE_PREFIX + filename;
          }
          return line;
        });

        // ৫. রিরাইট করা প্লেলিস্ট রিটার্ন করুন
        return new Response(rewrittenLines.join("\n"), {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }

      // ৬. সেগমেন্ট বা অন্য ফাইলের রিকোয়েস্ট (যেমন .ts, .m3u8)
      if (path.startsWith(ROUTE_PREFIX)) {
        const filename = path.substring(ROUTE_PREFIX.length);
        // যদি ফাইলের নাম খালি হয়, তাহলে index.m3u8 ধরে নিন
        const upstreamUrl = filename
          ? UPSTREAM_BASE + filename
          : UPSTREAM_BASE + "index.m3u8";

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
      }

      // ৭. অন্য কোনো পাথে 404
      return new Response(`Not Found: ${path}`, { status: 404 });

    } catch (err) {
      return new Response(
        `Worker Error:\n${err.message}\n\nStack:\n${err.stack}`,
        { status: 500 }
      );
    }
  }
};
