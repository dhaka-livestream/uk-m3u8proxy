// ========== কনফিগারেশন ==========
// আপনার GitHub Raw লিংকটি এখানে বসান (যে .m3u ফাইলটি কাজ করে)
const GITHUB_RAW_URL = "https://raw.githubusercontent.com/dhaka-livestream/Sunnext-mpd/refs/heads/main/Starjalshahd-UK.m3u";
// আপনি যে পাথটি ব্যবহার করতে চান
const ROUTE_PREFIX = "/starjalshahd-uk/";
// ==================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ১. শুধু নির্দিষ্ট পাথেই রিডাইরেক্ট করুন
    if (path === ROUTE_PREFIX + "index.m3u8") {
      // 302 রিডাইরেক্ট (VLC স্বয়ংক্রিয়ভাবে ফলো করবে)
      return Response.redirect(GITHUB_RAW_URL, 302);
    }

    // ২. অন্য যেকোনো পাথে 404 দেখান
    return new Response(`Not Found: ${path}`, { status: 404 });
  },
};
