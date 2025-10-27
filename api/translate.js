import axios from 'axios';

// ==========================================
// API DE TRADUCTION INTELLIGENTE
// ==========================================

/**
 * Détecte la langue d'un texte
 * @param {string} text - Texte à analyser
 * @returns {string} Code langue (en, fr, es, etc.)
 */
function detectLanguage(text) {
  if (!text || text.length < 10) return 'unknown';

  const lowerText = text.toLowerCase();

  // Mots-clés français
  const frenchKeywords = ['le ', 'la ', 'les ', 'de ', 'un ', 'une ', 'des ', 'et ', 'est ', 'sont ', 'dans ', 'pour ', 'avec ', 'qui ', 'que ', 'cette ', 'français'];

  // Mots-clés anglais
  const englishKeywords = ['the ', 'and ', 'is ', 'are ', 'in ', 'to ', 'of ', 'for ', 'with ', 'that ', 'this ', 'from ', 'will ', 'has ', 'have ', 'been'];

  // Mots-clés espagnols
  const spanishKeywords = ['el ', 'la ', 'los ', 'las ', 'de ', 'en ', 'un ', 'una ', 'y ', 'es ', 'son ', 'para ', 'con ', 'que ', 'del ', 'español'];

  const frenchScore = frenchKeywords.filter(k => lowerText.includes(k)).length;
  const englishScore = englishKeywords.filter(k => lowerText.includes(k)).length;
  const spanishScore = spanishKeywords.filter(k => lowerText.includes(k)).length;

  if (frenchScore > englishScore && frenchScore > spanishScore) return 'fr';
  if (spanishScore > englishScore && spanishScore > frenchScore) return 'es';
  return 'en';
}

/**
 * Traduit un texte via DeepL API
 * @param {string} text - Texte à traduire
 * @param {string} targetLang - Langue cible (FR, EN, ES)
 * @param {string} apiKey - Clé API DeepL
 * @returns {Promise<string>} Texte traduit
 */
async function translateWithDeepL(text, targetLang, apiKey) {
  try {
    // DeepL API gratuite
    const response = await axios.post('https://api-free.deepl.com/v2/translate', null, {
      params: {
        auth_key: apiKey,
        text: text,
        target_lang: targetLang.toUpperCase()
      },
      timeout: 10000
    });

    return response.data.translations[0].text;
  } catch (error) {
    console.error('Erreur DeepL:', error.message);
    throw error;
  }
}

/**
 * Traduit un texte via Claude API (fallback)
 * @param {string} text - Texte à traduire
 * @param {string} targetLang - Langue cible (fr, en, es)
 * @param {string} apiKey - Clé API Anthropic
 * @returns {Promise<string>} Texte traduit
 */
async function translateWithClaude(text, targetLang, apiKey) {
  try {
    const langNames = {
      fr: 'français',
      en: 'anglais',
      es: 'espagnol'
    };

    const prompt = `Traduis UNIQUEMENT ce texte en ${langNames[targetLang]}. Ne fais aucun commentaire, retourne uniquement la traduction :

${text}`;

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      timeout: 15000
    });

    return response.data.content[0].text.trim();
  } catch (error) {
    console.error('Erreur Claude:', error.message);
    throw error;
  }
}

/**
 * Handler principal de traduction
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { texts, targetLang } = req.body;

  if (!texts || !Array.isArray(texts) || texts.length === 0) {
    return res.status(400).json({ error: 'Textes requis (array)' });
  }

  if (!targetLang || !['fr', 'en', 'es'].includes(targetLang.toLowerCase())) {
    return res.status(400).json({ error: 'Langue cible invalide (fr, en, es)' });
  }

  const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!DEEPL_API_KEY && !ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: 'Aucune API de traduction configurée (DeepL ou Claude)'
    });
  }

  try {
    console.log(`🌐 Traduction de ${texts.length} textes vers ${targetLang.toUpperCase()}`);

    const translatedTexts = [];
    const results = [];

    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];

      // Détection de langue
      const detectedLang = detectLanguage(text);
      console.log(`  [${i + 1}/${texts.length}] Langue détectée: ${detectedLang}`);

      // Si déjà dans la langue cible, pas besoin de traduire
      if (detectedLang === targetLang.toLowerCase()) {
        console.log(`  → Déjà en ${targetLang}, pas de traduction`);
        results.push({
          original: text,
          translated: text,
          detectedLang: detectedLang,
          wasTranslated: false
        });
        continue;
      }

      // Traduire
      let translated = text;
      let success = false;

      // Essayer DeepL en priorité
      if (DEEPL_API_KEY && !success) {
        try {
          console.log(`  → Traduction via DeepL...`);
          translated = await translateWithDeepL(text, targetLang, DEEPL_API_KEY);
          success = true;
        } catch (error) {
          console.log(`  ⚠️ DeepL échoué, fallback sur Claude...`);
        }
      }

      // Fallback sur Claude
      if (ANTHROPIC_API_KEY && !success) {
        try {
          console.log(`  → Traduction via Claude...`);
          translated = await translateWithClaude(text, targetLang.toLowerCase(), ANTHROPIC_API_KEY);
          success = true;
        } catch (error) {
          console.log(`  ⚠️ Claude échoué`);
        }
      }

      results.push({
        original: text,
        translated: translated,
        detectedLang: detectedLang,
        wasTranslated: success
      });

      // Petit délai entre chaque traduction
      if (i < texts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    console.log(`✅ Traduction terminée`);

    return res.status(200).json({
      success: true,
      targetLang: targetLang.toLowerCase(),
      results: results,
      translatedCount: results.filter(r => r.wasTranslated).length,
      skippedCount: results.filter(r => !r.wasTranslated).length
    });

  } catch (error) {
    console.error('❌ Erreur traduction:', error);
    return res.status(500).json({
      error: error.message
    });
  }
}
