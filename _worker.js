// সবচেয়ে সরল প্রোক্সি (কোনো রিরাইট ছাড়া)
const UPSTREAM = "https://anet.keralive.workers.dev/v1/master/a0d007312bfd99c47f76b77ae26b1ccdaae76cb1/starjalsha_live_https/index.m3u8";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // শুধু index.m3u8 ফাইলটি পরিবেশন করুন
    if (url.pathname === "/starjalshahd-uk/index.m3u8") {
      const response = await fetch(UPSTREAM, {
        headers: {
          "Origin": "https://bhoomtv.me",
          "Referer": "https://bhoomtv.me",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });
      
      const newHeaders = new Headers(response.headers);
      newHeaders.set("Access-Control-Allow-Origin", "*");
      newHeaders.set("Content-Type", "application/vnd.apple.mpegurl");
      
      return new Response(response.body, {
        status: response.status,
        headers: newHeaders
      });
    }
    
    // অন্য কোনো পাথে 404
    return new Response("Not Found", { status: 404 });
  }
};
