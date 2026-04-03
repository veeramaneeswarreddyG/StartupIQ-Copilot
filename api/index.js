export default async function handler(req, res) {
  const app = await import('../server/index.js');
  return app.default(req, res);
}