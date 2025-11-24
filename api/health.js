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
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

  const translationMethod = DEEPL_API_KEY
    ? 'DeepL (Gratuit)'
    : ANTHROPIC_API_KEY
      ? 'Claude AI (Payant)'
      : 'Aucune';

  res.status(200).json({
    status: 'ok',
    apiConfigured: !!BRAVE_API_KEY,
    apis: {
      brave: !!BRAVE_API_KEY,
      anthropic: !!ANTHROPIC_API_KEY,
      deepl: !!DEEPL_API_KEY,
      translationAvailable: !!(DEEPL_API_KEY || ANTHROPIC_API_KEY),
      translationMethod: translationMethod
    },
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || 'development'
  });
}
