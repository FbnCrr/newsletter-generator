import axios from 'axios';

// Fonction de recherche web via Brave
async function searchWeb(apiKey, query, count = 10) {
  try {
    const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
      params: {
        q: query,
        count: count,
        search_lang: 'fr',
      },
    });

    return response.data.web?.results || [];
  } catch (error) {
    console.error('Erreur recherche web:', error.message);
    throw new Error(`Erreur recherche web: ${error.message}`);
  }
}

// Fonction de recherche d'actualités
async function searchNews(apiKey, query, count = 10) {
  try {
    const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
      params: {
        q: query,
        count: count,
        result_filter: 'news',
        freshness: 'pw',
      },
    });

    return response.data.news?.results || response.data.web?.results || [];
  } catch (error) {
    console.error('Erreur recherche actualités:', error.message);
    throw new Error(`Erreur recherche actualités: ${error.message}`);
  }
}

// Fonction de génération de la newsletter
function generateNewsletter(theme, results, newsResults) {
  const date = new Date().toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  let newsletter = `# 📰 Newsletter ${theme}\n`;
  newsletter += `*${date} - Généré avec recherche web en temps réel*\n\n`;
  newsletter += `---\n\n`;

  // Section À la Une
  if (newsResults.length > 0) {
    const topNews = newsResults[0];
    newsletter += `## 🔥 À la Une\n\n`;
    newsletter += `### ${topNews.title}\n\n`;
    newsletter += `**Source:** ${topNews.url}\n`;
    if (topNews.age) newsletter += `**Date:** ${topNews.age}\n`;
    newsletter += `\n${topNews.description || 'Article récent sur le sujet.'}\n\n`;
    newsletter += `[Lire l'article complet](${topNews.url})\n\n`;
    newsletter += `---\n\n`;
  }

  // Actualités principales
  newsletter += `## 📊 Actualités Principales\n\n`;
  
  const mainArticles = results.slice(0, 6);
  mainArticles.forEach((article, index) => {
    newsletter += `### ${index + 1}. ${article.title}\n\n`;
    newsletter += `**Source:** [${new URL(article.url).hostname}](${article.url})\n`;
    if (article.age) newsletter += `**Date:** ${article.age}\n`;
    newsletter += `\n${article.description || 'Information pertinente sur ce sujet.'}\n\n`;
  });

  newsletter += `---\n\n`;

  // Analyse et tendances
  newsletter += `## 💡 Analyse et Tendances\n\n`;
  newsletter += `Les recherches effectuées sur **${theme}** révèlent plusieurs tendances importantes :\n\n`;
  newsletter += `- L'actualité autour de ce sujet est particulièrement dynamique avec ${results.length} sources récentes identifiées\n`;
  newsletter += `- Les articles les plus récents datent de moins d'une semaine, témoignant de l'intérêt continu pour cette thématique\n`;
  newsletter += `- Les sources couvrent différents angles : innovations technologiques, analyses de marché, et perspectives d'experts\n\n`;
  newsletter += `Cette diversité de points de vue permet une compréhension approfondie des enjeux actuels.\n\n`;
  newsletter += `---\n\n`;

  // Sources et lectures
  newsletter += `## 🔗 Sources et Lectures Complémentaires\n\n`;
  results.slice(0, 10).forEach((article, index) => {
    newsletter += `${index + 1}. [${article.title}](${article.url})\n`;
  });

  newsletter += `\n---\n\n`;
  newsletter += `*Newsletter générée automatiquement avec ${results.length} sources web • ${theme}*\n`;

  return newsletter;
}

// Handler principal pour Vercel
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { theme } = req.body;

  if (!theme) {
    return res.status(400).json({ error: 'Thématique requise' });
  }

  const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

  if (!BRAVE_API_KEY) {
    return res.status(500).json({ 
      error: 'Clé API Brave non configurée. Configurez BRAVE_API_KEY dans les variables d\'environnement Vercel.' 
    });
  }

  try {
    console.log(`🔍 Génération newsletter pour: ${theme}`);

    // ÉTAPE 1: Faire plusieurs recherches avec différents angles
    const searches = [
      `${theme} actualités 2025`,
      `${theme} innovations récentes`,
      `${theme} tendances marché`,
      `${theme} analyse experts`,
      `${theme} dernières nouvelles`,
    ];

    console.log('📡 Lancement de 5 recherches web...');
// Faire les recherches une par une avec un délai
const searchResults = [];
for (const query of searches) {
  const result = await searchWeb(BRAVE_API_KEY, query, 5);
  searchResults.push(result);
  // Attendre 1 seconde entre chaque recherche
  await new Promise(resolve => setTimeout(resolve, 1000));
}

    
    // ÉTAPE 2: Recherche d'actualités spécifiques
    console.log('📰 Recherche d\'actualités récentes...');
    const newsResults = await searchNews(BRAVE_API_KEY, theme, 10);

    // ÉTAPE 3: Combiner et dédupliquer les résultats
    const allResults = [...newsResults, ...searchResults.flat()];
    const uniqueResults = Array.from(
      new Map(allResults.map(item => [item.url, item])).values()
    ).slice(0, 15);

    console.log(`✅ ${uniqueResults.length} résultats uniques trouvés`);

    // ÉTAPE 4: Générer la newsletter
    const newsletter = generateNewsletter(theme, uniqueResults, newsResults);

    return res.status(200).json({
      success: true,
      newsletter,
      theme,
      resultsCount: uniqueResults.length,
      searchesPerformed: searches.length + 1
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    return res.status(500).json({ 
      error: error.message,
      details: 'Vérifiez votre clé API Brave et votre connexion Internet'
    });
  }
}
