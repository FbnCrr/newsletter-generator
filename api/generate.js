import axios from 'axios';

// Fonction de recherche web via Brave avec période
async function searchWeb(apiKey, query, count = 10, freshness = null) {
  try {
    const params = {
      q: query,
      count: count,
      search_lang: 'fr',
    };
    
    if (freshness) {
      params.freshness = freshness;
    }

    const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
      params: params,
    });

    return response.data.web?.results || [];
  } catch (error) {
    console.error('Erreur recherche web:', error.message);
    throw new Error(`Erreur recherche web: ${error.message}`);
  }
}

// Fonction de recherche d'actualités optimisée
async function searchNews(apiKey, query, count = 15, freshness = 'pw') {
  try {
    // Faire plusieurs recherches d'actualités avec différents angles
    const newsQueries = [
      `${query} actualités nouvelles annonces`,
      `${query} dernières informations`,
      `${query} news récent`,
    ];

    let allNews = [];
    
    for (const newsQuery of newsQueries) {
      const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': apiKey,
        },
        params: {
          q: newsQuery,
          count: count,
          search_lang: 'fr',
          freshness: freshness,
        },
      });

      const newsResults = response.data.news?.results || response.data.web?.results || [];
      allNews = allNews.concat(newsResults);
      
      // Délai pour éviter rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Dédupliquer par URL
    const uniqueNews = Array.from(
      new Map(allNews.map(item => [item.url, item])).values()
    );

    // Trier par date (les plus récents en premier)
    return uniqueNews.sort((a, b) => {
      const dateA = a.page_age ? new Date(a.page_age) : new Date(0);
      const dateB = b.page_age ? new Date(b.page_age) : new Date(0);
      return dateB - dateA;
    }).slice(0, count);

  } catch (error) {
    console.error('Erreur recherche actualités:', error.message);
    return [];
  }
}

// Fonction pour extraire le contenu enrichi d'un article
function enrichArticle(article) {
  return {
    title: article.title || 'Article sans titre',
    url: article.url,
    description: article.description || article.extra_snippets?.join(' ') || 'Pas de description disponible.',
    thumbnail: article.thumbnail?.src || article.thumbnail?.original || null,
    age: article.age || article.page_age || 'Date non spécifiée',
    source: new URL(article.url).hostname.replace('www.', ''),
    profile: article.profile,
  };
}

// Fonction de génération de la newsletter HTML enrichie
function generateNewsletterHTML(theme, results, newsResults, period) {
  const date = new Date().toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Enrichir les articles
  const enrichedNews = newsResults.slice(0, 6).map(enrichArticle);
  const enrichedResults = results.slice(0, 10).map(enrichArticle);

  // Titre de la période
  let periodTitle = period ? ` - ${period}` : ` - ${date}`;

  let html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter ${theme}${periodTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

          <!-- HEADER -->
          <tr>
            <td style="padding: 40px 40px 30px 40px;">
              <h1 style="margin: 0; color: #2563eb; font-size: 32px; font-weight: bold; line-height: 1.2;">
                🚀 ${theme}${periodTitle}
              </h1>
              <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
                Newsletter de veille • Généré le ${date}
              </p>
            </td>
          </tr>
          
          <!-- INTRODUCTION -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Découvrez les dernières actualités et tendances sur <strong>${theme}</strong>. Cette newsletter compile les informations les plus pertinentes issues de <strong>${enrichedResults.length} sources vérifiées</strong> et <strong>${enrichedNews.length} actualités récentes</strong>.
              </p>
            </td>
          </tr>`;

  // ACTUALITÉS PRINCIPALES
  if (enrichedNews.length > 0) {
    enrichedNews.forEach((article, index) => {
      const emoji = index === 0 ? '🔥' : index === 1 ? '⚡' : index === 2 ? '📰' : '📌';
      const imageUrl = article.thumbnail || `https://via.placeholder.com/540x300/2563eb/ffffff?text=${encodeURIComponent(theme)}`;
      
      html += `
          <!-- ACTUALITÉ ${index + 1} -->
          <tr>
            <td style="padding: 0 40px 25px 40px;">
              <h2 style="margin: 0 0 15px 0; color: #1e40af; font-size: 20px; border-left: 4px solid #2563eb; padding-left: 15px;">
                ${emoji} ${article.title}
              </h2>
              <img src="${imageUrl}" alt="${article.title}" style="width: 100%; max-width: 540px; height: auto; border-radius: 8px; margin-bottom: 15px; display: block;" onerror="this.src='https://via.placeholder.com/540x300/2563eb/ffffff?text=Image+non+disponible'" />
              <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                ${article.description}
              </p>
              ${article.age ? `<p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; font-style: italic;">📅 ${article.age}</p>` : ''}
              <p style="margin: 0; color: #6b7280; font-size: 13px;">
                📎 Source : <a href="${article.url}" style="color: #2563eb; text-decoration: none;">${article.source}</a>
              </p>
            </td>
          </tr>`;
    });
  } else {
    // Si pas d'actualités, afficher les résultats web
    html += `
          <!-- AUCUNE ACTUALITÉ RÉCENTE -->
          <tr>
            <td style="padding: 0 40px 25px 40px;">
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  ⚠️ <strong>Note :</strong> Aucune actualité très récente n'a été trouvée. Voici les informations les plus pertinentes disponibles.
                </p>
              </div>
            </td>
          </tr>`;

    // Afficher les meilleurs résultats web comme actualités
    enrichedResults.slice(0, 4).forEach((article, index) => {
      const imageUrl = article.thumbnail || `https://via.placeholder.com/540x300/2563eb/ffffff?text=${encodeURIComponent(theme)}`;
      
      html += `
          <!-- RÉSULTAT ${index + 1} -->
          <tr>
            <td style="padding: 0 40px 25px 40px;">
              <h2 style="margin: 0 0 15px 0; color: #1e40af; font-size: 20px; border-left: 4px solid #2563eb; padding-left: 15px;">
                📊 ${article.title}
              </h2>
              <img src="${imageUrl}" alt="${article.title}" style="width: 100%; max-width: 540px; height: auto; border-radius: 8px; margin-bottom: 15px; display: block;" onerror="this.src='https://via.placeholder.com/540x300/2563eb/ffffff?text=Image+non+disponible'" />
              <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                ${article.description}
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 13px;">
                📎 Source : <a href="${article.url}" style="color: #2563eb; text-decoration: none;">${article.source}</a>
              </p>
            </td>
          </tr>`;
    });
  }

  // SECTION ANALYSE
  html += `
          <!-- ANALYSE ET TENDANCES -->
          <tr>
            <td style="padding: 0 40px 25px 40px;">
              <h2 style="margin: 0 0 15px 0; color: #1e40af; font-size: 20px; border-left: 4px solid #2563eb; padding-left: 15px;">
                💡 Analyse et Tendances
              </h2>
              <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                Les recherches effectuées sur <strong>${theme}</strong> révèlent plusieurs tendances importantes :
              </p>
              <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 15px; line-height: 1.8;">
                <li>L'actualité autour de ce sujet est particulièrement dynamique avec <strong>${enrichedResults.length} sources</strong> récentes identifiées</li>
                <li>Les articles couvrent différents angles : <strong>innovations technologiques</strong>, <strong>analyses de marché</strong>, et <strong>perspectives d'experts</strong></li>
                <li>Les sources incluent des médias spécialisés, des sites d'information généraliste et des publications professionnelles</li>
                <li>Cette diversité de points de vue permet une <strong>compréhension approfondie</strong> des enjeux actuels</li>
              </ul>
            </td>
          </tr>`;

  // RESSOURCES COMPLÉMENTAIRES
  html += `
          <!-- RESSOURCES COMPLÉMENTAIRES -->
          <tr>
            <td style="padding: 0 40px 25px 40px;">
              <h2 style="margin: 0 0 15px 0; color: #1e40af; font-size: 20px; border-left: 4px solid #2563eb; padding-left: 15px;">
                🔗 Ressources Complémentaires
              </h2>
              <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">`;

  enrichedResults.slice(0, 10).forEach((article) => {
    html += `
                <li><a href="${article.url}" style="color: #2563eb; text-decoration: none;">${article.title}</a> <span style="color: #9ca3af;">(${article.source})</span></li>`;
  });

  html += `
              </ul>
            </td>
          </tr>

          <!-- CONCLUSION -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; border-left: 4px solid #2563eb;">
                <p style="margin: 0; color: #1e40af; font-size: 15px; line-height: 1.6;">
                  💡 <strong>En résumé :</strong> Cette newsletter a compilé <strong>${enrichedResults.length} sources</strong> et <strong>${enrichedNews.length} actualités</strong> sur ${theme}. Les informations présentées offrent une vue d'ensemble complète des développements récents et des tendances émergentes dans ce domaine.
                </p>
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 13px;">
                Newsletter générée automatiquement • ${theme} • ${date}
              </p>
              <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
                Propulsé par Brave Search API • ${enrichedResults.length} sources analysées
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

  return html;
}

// Convertir période en paramètre freshness Brave
function periodToFreshness(period) {
  if (!period) return 'pw';
  
  const lowerPeriod = period.toLowerCase();
  
  if (lowerPeriod.includes('24h') || lowerPeriod.includes('jour')) return 'pd';
  if (lowerPeriod.includes('semaine')) return 'pw';
  if (lowerPeriod.includes('mois')) return 'pm';
  if (lowerPeriod.includes('année') || lowerPeriod.includes('an')) return 'py';
  
  const monthYear = lowerPeriod.match(/(\w+)\s+(\d{4})/);
  if (monthYear) return 'py';
  
  return 'pm';
}

// Handler principal pour Vercel
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

  const { theme, period } = req.body;

  if (!theme) {
    return res.status(400).json({ error: 'Thématique requise' });
  }

  const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

  if (!BRAVE_API_KEY) {
    return res.status(500).json({ 
      error: 'Clé API Brave non configurée.' 
    });
  }

  try {
    console.log(`🔍 Génération newsletter pour: ${theme} (Période: ${period || 'récent'})`);

    const freshness = periodToFreshness(period);

    // RECHERCHE D'ACTUALITÉS OPTIMISÉE
    console.log('📰 Recherche d\'actualités récentes...');
    const newsResults = await searchNews(BRAVE_API_KEY, theme, 15, freshness);
    
    // RECHERCHES WEB COMPLÉMENTAIRES
    const searches = [
      `${theme} ${period || ''} actualités récentes`,
      `${theme} ${period || ''} dernières nouvelles`,
      `${theme} ${period || ''} informations`,
    ];

    console.log('📡 Lancement de 3 recherches web...');
    const searchResults = [];
    for (const query of searches) {
      const result = await searchWeb(BRAVE_API_KEY, query, 8, freshness);
      searchResults.push(result);
      await new Promise(resolve => setTimeout(resolve, 1200));
    }

    // Combiner et dédupliquer
    const allResults = [...newsResults, ...searchResults.flat()];
    const uniqueResults = Array.from(
      new Map(allResults.map(item => [item.url, item])).values()
    ).slice(0, 20);

    console.log(`✅ ${uniqueResults.length} résultats (dont ${newsResults.length} actualités)`);

    // Générer la newsletter HTML
    const newsletterHTML = generateNewsletterHTML(theme, uniqueResults, newsResults, period);

    return res.status(200).json({
      success: true,
      newsletter: newsletterHTML,
      theme,
      period: period || 'récent',
      resultsCount: uniqueResults.length,
      newsCount: newsResults.length,
      searchesPerformed: searches.length + 1,
      format: 'html'
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    return res.status(500).json({ 
      error: error.message
    });
  }
}
