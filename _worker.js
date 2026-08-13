// ========== কনফিগারেশন ==========
const CHANNEL_NAME = "Star Jalsha HD";
const CHANNEL_LOGO = "https://jiotvimages.cdn.jio.com/dare_images/images/Star_Jalsha_HD.png";
const UPSTREAM_URL = "https://anet.keralive.workers.dev/v1/master/a0d007312bfd99c47f76b77ae26b1ccdaae76cb1/starjalsha_live_https/index.m3u8";
const CUSTOM_HEADERS = {
  "Referer": "https://bhoomtv.me",
  "Origin": "https://bhoomtv.me",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
};
const ROUTE_PREFIX = "/starjalshahd-uk/";
// ==================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ১. শুধু নির্দিষ্ট পাথে রেসপন্ড করুন
    if (path === ROUTE_PREFIX + "index.m3u8") {
      // ২. একটি M3U8 প্লেলিস্ট তৈরি করুন (যা GitHub-এর মতো)
      const playlist = `#EXTM3U
#EXTINF:-1 tvg-id="317" tvg-name="${CHANNEL_NAME}" tvg-logo="${CHANNEL_LOGO}" tvg-language="Bengali" group-title="Entertainment", ${CHANNEL_NAME}
#EXTVLCOPT:http-referrer=${CUSTOM_HEADERS.Referer}
#EXTVLCOPT:http-origin=${CUSTOM_HEADERS.Origin}
#EXTVLCOPT:http-user-agent=${CUSTOM_HEADERS["User-Agent"]}
#KODIPROP:inputstream=inputstream.adaptive
#KODIPROP:inputstream.adaptive.manifest_headers="Referer=${CUSTOM_HEADERS.Referer};Origin=${CUSTOM_HEADERS.Origin};User-Agent=${CUSTOM_HEADERS["User-Agent"]}"
#KODIPROP:mimetype=application/dash+xml
${UPSTREAM_URL}`;

      return new Response(playlist, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // অন্য যেকোনো পাথে 404
    return new Response(`Not Found: ${path}`, { status: 404 });
  },
};
