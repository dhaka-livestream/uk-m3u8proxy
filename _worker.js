export default {
  async fetch(request) {
    return new Response("Worker is working!", {
      headers: { "Content-Type": "text/plain" }
    });
  }
};
