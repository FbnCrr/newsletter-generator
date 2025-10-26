import axios from 'axios';

// Fonction de recherche web via Brave avec période
async function searchWeb(apiKey, query, count = 10, freshness = null) {
  try {
    const params = {
      q: query,
      count: count,
      search_lang: 'fr',
    };
    
    // Ajouter le filtre de fraîcheur si spécifié
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

// Fonction de recherche d'actualités avec période
async function searchNews(apiKey, query, count = 10, freshness = 'pw') {
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
        freshness: freshness,
      },
    });

    return response.data.news?.results || response.data.web?.results || [];
  } catch (error) {
    console.error('Erreur recherche actualités:', error.message);
    throw new Error(`Erreur recherche actualités: ${error.message}`);
  }
}

// Fonction de génération de la newsletter HTML enrichie
function generateNewsletterHTML(theme, results, newsResults, period) {
  const date = new Date().toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const topNews = newsResults.slice(0, 6);
  const mainResults = results.slice(0, 8);

  let html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter ${theme} - ${period || date}</title>
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
                🚀 ${theme} - ${period || date}
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
                Découvrez les dernières actualités et tendances sur <strong>${theme}</strong>. Cette newsletter compile les informations les plus pertinentes issues de ${results.length} sources vérifiées et ${newsResults.length} actualités récentes.
              </p>
            </td>
          </tr>`;

  // SECTIONS PRINCIPALES - Une par article
  topNews.forEach((article, index) => {
    const hostname = new URL(article.url).hostname.replace('www.', '');
    const imageUrl = article.thumbnail?.src || article.thumbnail?.original || 'https://via.placeholder.com/540x300/2563eb/ffffff?text=' + encodeURIComponent(theme);
    
    html += `
          <!-- SECTION ${index + 1} -->
          <tr>
            <td style="padding: 0 40px 25px 40px;">
              <h2 style="margin: 0 0 15px 0; color: #1e40af; font-size: 20px; border-left: 4px solid #2563eb; padding-left: 15px;">
                ${index === 0 ? '🔥' : '📰'} ${article.title}
              </h2>
              <img src="${imageUrl}" alt="${article.title}" style="width: 100%; max-width: 540px; height: auto; border-radius: 8px; margin-bottom: 15px; display: block;" onerror="this.src='https://via.placeholder.com/540x300/2563eb/ffffff?text=Image+non+disponible'" />
              <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                ${article.description || 'Information pertinente sur ce sujet d\'actualité concernant ' + theme + '.'}
              </p>
              ${article.age ? `<p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; font-style: italic;">📅 ${article.age}</p>` : ''}
              <p style="margin: 0; color: #6b7280; font-size: 13px;">
                📎 Source : <a href="${article.url}" style="color: #2563eb; text-decoration: none;">${hostname}</a>
              </p>
            </td>
          </tr>`;
  });

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
                <li>L'actualité autour de ce sujet est particulièrement dynamique avec ${results.length} sources récentes identifiées</li>
                <li>Les articles les plus récents témoignent de l'intérêt continu pour cette thématique</li>
                <li>Les sources couvrent différents angles : innovations technologiques, analyses de marché, et perspectives d'experts</li>
                <li>Cette diversité de points de vue permet une compréhension approfondie des enjeux actuels</li>
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

  mainResults.slice(0, 10).forEach((article, index) => {
    const hostname = new URL(article.url).hostname.replace('www.', '');
    html += `
                <li><a href="${article.url}" style="color: #2563eb; text-decoration: none;">${article.title}</a> <span style="color: #9ca3af;">(${hostname})</span></li>`;
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
                  💡 <strong>En résumé :</strong> Cette newsletter a compilé ${results.length} sources et ${newsResults.length} actualités sur ${theme}. Les informations présentées offrent une vue d'ensemble complète des développements récents et des tendances émergentes dans ce domaine.
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
                Propulsé par Brave Search API • ${results.length} sources analysées
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
  if (!period) return 'pw'; // Par défaut : semaine passée
  
  // Extraire les informations de période
  const lowerPeriod = period.toLowerCase();
  
  if (lowerPeriod.includes('24h') || lowerPeriod.includes('jour')) return 'pd';
  if (lowerPeriod.includes('semaine')) return 'pw';
  if (lowerPeriod.includes('mois')) return 'pm';
  if (lowerPeriod.includes('année') || lowerPeriod.includes('an')) return 'py';
  
  // Tenter de détecter un mois/année spécifique
  const monthYear = lowerPeriod.match(/(\w+)\s+(\d{4})/);
  if (monthYear) return 'py'; // Année passée pour mois spécifique
  
  return 'pm'; // Par défaut : mois passé
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

  const { theme, period } = req.body;

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
    console.log(`🔍 Génération newsletter pour: ${theme} (Période: ${period || 'récent'})`);

    // Convertir période en freshness
    const freshness = periodToFreshness(period);

    // ÉTAPE 1: Faire plusieurs recherches avec différents angles (AVEC DÉLAI)
    const searches = [
      `${theme} ${period || ''} actualités`,
      `${theme} ${period || ''} innovations`,
      `${theme} ${period || ''} tendances`,
    ];

    console.log('📡 Lancement de 3 recherches web avec délais...');
    const searchResults = [];
    for (const query of searches) {
      const result = await searchWeb(BRAVE_API_KEY, query, 5, freshness);
      searchResults.push(result);
      // Attendre 1 seconde entre chaque recherche pour éviter rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // ÉTAPE 2: Recherche d'actualités spécifiques
    console.log('📰 Recherche d\'actualités récentes...');
    const newsResults = await searchNews(BRAVE_API_KEY, `${theme} ${period || ''}`, 10, freshness);

    // ÉTAPE 3: Combiner et dédupliquer les résultats
    const allResults = [...newsResults, ...searchResults.flat()];
    const uniqueResults = Array.from(
      new Map(allResults.map(item => [item.url, item])).values()
    ).slice(0, 15);

    console.log(`✅ ${uniqueResults.length} résultats uniques trouvés`);

    // ÉTAPE 4: Générer la newsletter HTML enrichie
    const newsletterHTML = generateNewsletterHTML(theme, uniqueResults, newsResults, period);

    return res.status(200).json({
      success: true,
      newsletter: newsletterHTML,
      theme,
      period: period || 'récent',
      resultsCount: uniqueResults.length,
      searchesPerformed: searches.length + 1,
      format: 'html'
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    return res.status(500).json({ 
      error: error.message,
      details: 'Vérifiez votre clé API Brave et votre connexion Internet'
    });
  }
}
