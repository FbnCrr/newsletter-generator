export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

  res.status(200).json({
    status: 'ok',
    apiConfigured: !!BRAVE_API_KEY,
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || 'development'
  });
}
