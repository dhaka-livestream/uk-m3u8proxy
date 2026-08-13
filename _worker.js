// ========== কনফিগারেশন ==========
// আপনার GitHub Raw লিংকটি এখানে বসান
const GITHUB_RAW_URL = "https://raw.githubusercontent.com/ইউজারনেম/রিপোজিটরি-নাম/ব্রাঞ্চ-নাম/ফাইলের-পাথ/ফাইলনাম.m3u";
// ==================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ১. আপনি চাইলে নির্দিষ্ট পাথ চেক করতে পারেন
    // যদি পাথটি /starjalshahd-uk/index.m3u8 হয়, তাহলে রিডাইরেক্ট করুন
    if (path === "/starjalshahd-uk/index.m3u8") {
      return Response.redirect(GITHUB_RAW_URL, 302);
    }

    // ২. অন্য যেকোনো পাথে 404 দেখান (অথবা Pages-এর অ্যাসেটে পাঠান)
    return new Response(`Not Found: ${path}`, { status: 404 });
  },
};
