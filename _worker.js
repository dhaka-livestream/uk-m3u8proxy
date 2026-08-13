// ========== কনফিগারেশন ==========
// আপনার GitHub Raw লিংকটি এখানে বসান
const GITHUB_RAW_URL = "https://raw.githubusercontent.com/dhaka-livestream/Sunnext-mpd/refs/heads/main/Starjalshahd-UK.m3u";

// প্লেলিস্টের ভেতরের লিংকের জন্য বেস URL (শেষে '/' দিতে হবে)
const BASE_URL = "https://raw.githubusercontent.com/ইউজারনেম/রিপোজিটরি-নাম/ব্রাঞ্চ-নাম/ফাইলের-পাথ/";

// প্রয়োজনীয় হেডার (প্রয়োজনে)
const CUSTOM_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
};
// ==================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ১. শুধু নির্দিষ্ট পাথ হ্যান্ডেল করুন
    if (path === "/starjalshahd-uk/index.m3u8") {
      try {
        // ২. GitHub থেকে প্লেলিস্ট ফাইলটি fetch করুন
        const response = await fetch(GITHUB_RAW_URL, {
          headers: CUSTOM_HEADERS,
          cf: { cacheTtl: 0 } // ক্যাশিং বন্ধ রাখতে
        });

        if (!response.ok) {
          return new Response(`GitHub Raw Error: ${response.status}`, { status: response.status });
        }

        // ৩. প্লেলিস্টের কন্টেন্ট পড়ুন
        const text = await response.text();

        // ৪. প্রতিটি লাইন প্রসেস করুন
        const lines = text.split('\n');
        const rewrittenLines = lines.map(line => {
          const trimmedLine = line.trim();

          // কমেন্ট লাইন বা খালি লাইন স্কিপ করুন (URI="..." থাকলে সেটা আপডেট করুন)
          if (trimmedLine.startsWith('#') || !trimmedLine) {
            // URI="..." থাকলে সেটিও আপডেট করুন
            if (trimmedLine.includes('URI="') && !trimmedLine.includes('URI="http')) {
              return trimmedLine.replace(/URI="([^"]*)"/g, (match, p1) => {
                try {
                  const fullUrl = new URL(p1, BASE_URL).href;
                  return `URI="${fullUrl}"`;
                } catch {
                  return match;
                }
              });
            }
            return line;
          }

          // ৫. লিংকটি আপেক্ষিক কিনা চেক করুন
          try {
            // যদি লিংকটি ইতিমধ্যে পূর্ণ URL না হয়, তাহলে বেস URL এর সাথে যোগ করুন
            const fullUrl = new URL(trimmedLine, BASE_URL).href;
            return fullUrl;
          } catch {
            // যদি কনভার্ট করা না যায়, তাহলে লাইনটি অপরিবর্তিত রাখুন
            return line;
          }
        });

        // ৬. পরিবর্তিত কন্টেন্ট রিটার্ন করুন
        const modifiedContent = rewrittenLines.join('\n');

        return new Response(modifiedContent, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Access-Control-Allow-Origin': '*', // CORS সমস্যা এড়াতে[reference:5]
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          }
        });

      } catch (err) {
        return new Response(`Worker Error: ${err.message}`, { status: 500 });
      }
    }

    // অন্য যেকোনো পাথে 404 দেখান
    return new Response(`Not Found: ${path}`, { status: 404 });
  },
};
