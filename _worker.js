// ========== কনফিগারেশন ==========
// ১. আপনার GitHub Raw লিংকটি এখানে বসান (শেষে '/' ছাড়া)
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/dhaka-livestream/Sunnext-mpd/refs/heads/main/Starjalshahd-UK.m3u";

// ২. আপনি যে পাথটি ব্যবহার করতে চান (যেমন: /starjalshahd-uk/)
const ROUTE_PREFIX = "/starjalshahd-uk/";

// ৩. আপনার আসল M3U8 ফাইলের নাম (যেমন: index.m3u8)
const M3U8_FILENAME = "index.m3u8";
// ==================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ১. শুধু নির্দিষ্ট পাথে রিডাইরেক্ট করুন
    if (path === ROUTE_PREFIX + M3U8_FILENAME) {
      // GitHub Raw লিংক তৈরি করুন
      const redirectUrl = `${GITHUB_RAW_BASE}/${M3U8_FILENAME}`;
      
      // ৩০২ রিডাইরেক্ট রেসপন্স
      return Response.redirect(redirectUrl, 302);
    }

    // ২. অন্য কোনো পাথে 404
    return new Response(`Not Found: ${path}`, { 
      status: 404,
      headers: { "Content-Type": "text/plain" }
    });
  }
};
