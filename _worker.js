// _worker.js - একটি সাধারণ ডিবাগিং কোড
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // যেকোনো রিকোয়েস্টে এই মেসেজটি দেখাবে
    return new Response(`Hello from Worker! You requested: ${url.pathname}`, {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
