import axios from 'axios';

// ==========================================
// PARTIE 1: INTELLIGENCE DE REQUÊTE
// ==========================================

// Détecter l'intention de recherche et reformuler intelligemment
function analyzeSearchIntent(theme, period) {
  const lowerTheme = theme.toLowerCase();
  
  // Détecter les mots-clés d'intention
  const isTrends = lowerTheme.includes('tendance') || lowerTheme.includes('trend');
  const isNews = lowerTheme.includes('actualité') || lowerTheme.includes('nouveauté') || lowerTheme.includes('news');
  const isInnovation = lowerTheme.includes('innovation') || lowerTheme.includes('nouveau');
  const isEvolution = lowerTheme.includes('évolution') || lowerTheme.includes('développement');
  
  // Extraire le sujet principal (enlever les mots d'intention)
  let mainTopic = theme
    .replace(/tendances?/gi, '')
    .replace(/actualités?/gi, '')
    .replace(/nouveautés?/gi, '')
    .replace(/innovations?/gi, '')
    .replace(/évolutions?/gi, '')
    .trim();
  
  // Construire des requêtes intelligentes
  let queries = [];
  
  if (isTrends) {
    // Pour les tendances : chercher ce qui est populaire, viral, en croissance
    queries = [
      `${mainTopic} tendances ${new Date().getFullYear()}`,
      `${mainTopic} nouveautés populaires`,
      `${mainTopic} en vogue maintenant`,
      `${mainTopic} ce qui marche actuellement`,
      `${mainTopic} viral récent`,
    ];
  } else if (isNews) {
    // Pour les actualités : chercher annonces, lancements, événements
    queries = [
      `${mainTopic} actualités récentes`,
      `${mainTopic} dernières nouvelles`,
      `${mainTopic} annonces importantes`,
      `${mainTopic} lancements ${new Date().getFullYear()}`,
    ];
  } else if (isInnovation) {
    // Pour les innovations : chercher technologies, produits, avancées
    queries = [
      `${mainTopic} innovations ${new Date().getFullYear()}`,
      `${mainTopic} nouvelles technologies`,
      `${mainTopic} avancées récentes`,
      `${mainTopic} produits nouveaux`,
    ];
  } else {
    // Recherche générale optimisée
    queries = [
      `${theme} actualités récentes`,
      `${theme} informations importantes`,
      `${theme} dernières nouvelles`,
      `${theme} ${new Date().getFullYear()}`,
    ];
  }
  
  return {
    queries,
    intentType: isTrends ? 'trends' : isNews ? 'news' : isInnovation ? 'innovation' : 'general',
    mainTopic,
  };
}

// ==========================================
// PARTIE 2: RECHERCHE WEB
// ==========================================

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
    return [];
  }
}

async function searchNews(apiKey, query, count = 15, freshness = 'pw') {
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
        freshness: freshness,
      },
    });

    const newsResults = response.data.news?.results || response.data.web?.results || [];
    
    return newsResults.sort((a, b) => {
      const dateA = a.page_age ? new Date(a.page_age) : new Date(0);
      const dateB = b.page_age ? new Date(b.page_age) : new Date(0);
      return dateB - dateA;
    });

  } catch (error) {
    console.error('Erreur recherche actualités:', error.message);
    return [];
  }
}

// ==========================================
// PARTIE 3: GÉNÉRATION DE RÉSUMÉS AVEC IA
// ==========================================

async function generateAISummary(article, theme, anthropicApiKey) {
  try {
    // Si pas de clé Anthropic, utiliser la description existante
    if (!anthropicApiKey) {
      return article.description || 'Information pertinente sur ce sujet.';
    }

    // Préparer le contexte pour Claude
    const prompt = `Tu es un expert en veille technologique. Voici un article sur "${theme}":

Titre: ${article.title}
URL: ${article.url}
Description existante: ${article.description || 'Pas de description'}

Ta mission: Rédige un résumé professionnel et informatif de 2-3 phrases (maximum 250 caractères) qui:
1. Explique clairement le SUJET principal de l'article
2. Mentionne les informations clés ou les chiffres importants
3. Soit engageant et utile pour un professionnel en veille

Ne commence pas par "Cet article..." ou "Le texte...". Écris directement le résumé factuel.`;

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: prompt
      }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      timeout: 10000
    });

    const summary = response.data.content[0].text.trim();
    return summary || article.description || 'Information pertinente sur ce sujet.';

  } catch (error) {
    console.error('Erreur génération résumé IA:', error.message);
    // Fallback sur la description originale
    return article.description || 'Information pertinente sur ce sujet.';
  }
}

// Enrichir un article avec résumé IA
async function enrichArticleWithAI(article, theme, anthropicApiKey) {
  const thumbnail = article.thumbnail?.src || article.thumbnail?.original || null;
  
  // Nettoyer la description existante
  let description = article.description || article.extra_snippets?.join(' ') || '';
  
  // Si la description est trop courte ou de mauvaise qualité, générer avec IA
  const shouldUseAI = anthropicApiKey && (
    !description || 
    description.length < 50 || 
    description.includes('...') ||
    description.split(' ').length < 10
  );
  
  if (shouldUseAI) {
    console.log(`🤖 Génération résumé IA pour: ${article.title.substring(0, 50)}...`);
    description = await generateAISummary(article, theme, anthropicApiKey);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit
  }
  
  return {
    title: article.title || 'Article sans titre',
    url: article.url,
    description: description,
    thumbnail: thumbnail,
    age: article.age || article.page_age || 'Date non spécifiée',
    source: new URL(article.url).hostname.replace('www.', ''),
    profile: article.profile,
  };
}

// ==========================================
// PARTIE 4: GÉNÉRATION HTML
// ==========================================

function generateNewsletterHTML(theme, enrichedNews, enrichedResults, period, intentType, totalResources = enrichedResults.length) {
  const date = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let periodTitle = period ? ` - ${period}` : ` - ${date}`;
  
  // Adapter le titre selon l'intention
  let mainTitle = `${theme}${periodTitle}`;
  if (intentType === 'trends') {
    mainTitle = `Tendances ${theme}${periodTitle}`;
  }

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
                🚀 ${mainTitle}
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
                ${intentType === 'trends' 
                  ? `Découvrez les dernières <strong>tendances</strong> sur ${theme}. Cette newsletter compile les informations les plus pertinentes sur ce qui est populaire et émergent actuellement.`
                  : `Découvrez les dernières actualités et tendances sur <strong>${theme}</strong>. Cette newsletter compile les informations les plus pertinentes issues de <strong>${enrichedResults.length} sources vérifiées</strong>.`
                }
              </p>
            </td>
          </tr>`;

  // ACTUALITÉS PRINCIPALES (on affiche directement enrichedNews qui contient déjà 10 articles max)
  const articlesToShow = enrichedNews;

  articlesToShow.forEach((article, index) => {
    const emoji = index === 0 ? '🔥' : index === 1 ? '⚡' : index === 2 ? '📰' : '📌';
    const imageUrl = article.thumbnail || `https://via.placeholder.com/540x300/2563eb/ffffff?text=${encodeURIComponent(theme)}`;

    html += `
          <!-- ACTUALITÉ ${index + 1} -->
          <tr>
            <td style="padding: 0 40px 25px 40px;">
              <h2 style="margin: 0 0 15px 0; border-left: 4px solid #2563eb; padding-left: 15px;">
                <a href="${article.url}" style="color: #1e40af; text-decoration: none; font-size: 20px; display: block;" target="_blank">
                  ${emoji} ${article.title}
                </a>
              </h2>
              <img src="${imageUrl}" alt="${article.title}" style="width: 100%; max-width: 540px; height: auto; border-radius: 8px; margin-bottom: 15px; display: block;" onerror="this.src='https://via.placeholder.com/540x300/2563eb/ffffff?text=Image+non+disponible'" />
              <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                ${article.description}
              </p>
              ${article.age && article.age !== 'Date non spécifiée' ? `<p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; font-style: italic;">📅 ${article.age}</p>` : ''}
              <p style="margin: 0; color: #6b7280; font-size: 13px;">
                📎 Source : <a href="${article.url}" style="color: #2563eb; text-decoration: none;">${article.source}</a>
              </p>
            </td>
          </tr>`;
  });

  // POUR ALLER PLUS LOIN (uniquement les articles NON affichés dans les actualités principales)
  // Créer un Set des URLs déjà affichées
  const displayedUrls = new Set(enrichedNews.map(a => a.url));

  // Filtrer les ressources supplémentaires pour exclure celles déjà affichées
  const uniqueAdditionalResources = enrichedResults.filter(article => !displayedUrls.has(article.url));

  html += `
          <!-- POUR ALLER PLUS LOIN -->
          <tr>
            <td style="padding: 0 40px 25px 40px;">
              <h2 style="margin: 0 0 15px 0; color: #1e40af; font-size: 20px; border-left: 4px solid #2563eb; padding-left: 15px;">
                🔗 Pour aller plus loin
              </h2>
              <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">`;

  uniqueAdditionalResources.slice(0, 12).forEach((article) => {
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
                  💡 <strong>En résumé :</strong> Cette newsletter a compilé <strong>${totalResources} sources</strong> sur ${theme}. Les informations présentées offrent une vue d'ensemble complète des développements récents et des tendances émergentes dans ce domaine.
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
                Propulsé par Brave Search API • ${totalResources} sources analysées
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

// ==========================================
// PARTIE 5: HANDLER PRINCIPAL
// ==========================================

function periodToFreshness(period) {
  if (!period) return 'pw';
  const lowerPeriod = period.toLowerCase();
  if (lowerPeriod.includes('24h') || lowerPeriod.includes('jour')) return 'pd';
  if (lowerPeriod.includes('semaine')) return 'pw';
  if (lowerPeriod.includes('mois')) return 'pm';
  if (lowerPeriod.includes('année') || lowerPeriod.includes('an')) return 'py';
  return 'pm';
}

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

  const { themes, period, preferredSources = [], excludedSites = [] } = req.body;

  // Support ancien format (theme → themes)
  const themesList = themes || (req.body.theme ? [req.body.theme] : []);

  if (!themesList || themesList.length === 0) {
    return res.status(400).json({ error: 'Au moins une thématique requise' });
  }

  if (themesList.length > 5) {
    return res.status(400).json({ error: 'Maximum 5 thématiques à la fois' });
  }

  const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY; // Optionnel

  if (!BRAVE_API_KEY) {
    return res.status(500).json({
      error: 'Clé API Brave non configurée.'
    });
  }

  try {
    // MODE SIMPLE : Un seul thème pour l'instant
    // TODO : Support multi-thématiques complet à venir
    const theme = themesList[0];
    const isMultiTheme = themesList.length > 1;

    if (isMultiTheme) {
      console.log(`⚠️ Multi-thématiques détecté (${themesList.length}), mais pas encore supporté. Utilisation du premier thème : ${theme}`);
    }

    console.log(`🔍 Génération newsletter pour: ${theme} (Période: ${period || 'récent'})`);
    console.log(`🚫 Sites exclus: ${excludedSites.length} sites`);

    // ANALYSER L'INTENTION DE RECHERCHE
    const { queries, intentType, mainTopic } = analyzeSearchIntent(theme, period);
    console.log(`🧠 Intention détectée: ${intentType} | Sujet: ${mainTopic}`);
    console.log(`📝 Requêtes générées:`, queries);

    const freshness = periodToFreshness(period);

    // RECHERCHES MULTIPLES INTELLIGENTES
    console.log('📡 Lancement des recherches intelligentes...');
    let allResults = [];
    
    for (const query of queries.slice(0, 4)) {
      const results = await searchWeb(BRAVE_API_KEY, query, 8, freshness);
      allResults = allResults.concat(results);
      await new Promise(resolve => setTimeout(resolve, 1200));
    }

    // RECHERCHE D'ACTUALITÉS SPÉCIFIQUE
    const newsResults = await searchNews(BRAVE_API_KEY, `${mainTopic} actualités`, 10, freshness);
    allResults = allResults.concat(newsResults);

    // RECHERCHES CIBLÉES SUR SITES PRÉFÉRÉS
    if (preferredSources && preferredSources.length > 0) {
      console.log(`🎯 Recherche sur ${preferredSources.length} sites préférés...`);

      for (const source of preferredSources.slice(0, 5)) { // Limiter à 5 sites max
        const siteQuery = `site:${source} ${mainTopic}`;
        console.log(`  → Recherche sur ${source}...`);

        const siteResults = await searchWeb(BRAVE_API_KEY, siteQuery, 5, freshness);
        allResults = allResults.concat(siteResults);

        await new Promise(resolve => setTimeout(resolve, 1200)); // Délai anti-rate limit
      }

      console.log(`✅ Recherches sur sites préférés terminées`);
    }

    // DÉDUPLIQUER
    let uniqueResults = Array.from(
      new Map(allResults.map(item => [item.url, item])).values()
    );

    console.log(`✅ ${uniqueResults.length} résultats uniques trouvés`);

    // FILTRER LES SITES EXCLUS
    if (excludedSites && excludedSites.length > 0) {
      const beforeFilter = uniqueResults.length;
      uniqueResults = uniqueResults.filter(article => {
        try {
          const articleDomain = new URL(article.url).hostname.replace('www.', '');
          const isExcluded = excludedSites.some(excludedDomain =>
            articleDomain.includes(excludedDomain) || excludedDomain.includes(articleDomain)
          );
          return !isExcluded;
        } catch (e) {
          return true; // Garder l'article si URL invalide
        }
      });
      const filtered = beforeFilter - uniqueResults.length;
      if (filtered > 0) {
        console.log(`🚫 ${filtered} résultats filtrés (sites exclus)`);
      }
    }

    // Limiter le nombre de résultats
    uniqueResults = uniqueResults.slice(0, 25);
    console.log(`📊 ${uniqueResults.length} résultats après filtrage`);

    // ENRICHIR AVEC RÉSUMÉS IA (si clé disponible)
    console.log(`🤖 Enrichissement des articles${ANTHROPIC_API_KEY ? ' avec IA' : ''}...`);
    const enrichedArticles = [];

    // Enrichir jusqu'à 20 articles pour s'assurer d'avoir au moins 10 bons résultats
    for (const article of uniqueResults.slice(0, 20)) {
      const enriched = await enrichArticleWithAI(article, theme, ANTHROPIC_API_KEY);
      enrichedArticles.push(enriched);
    }

    // Prendre les 10 meilleurs résultats pour affichage principal
    const enrichedNews = enrichedArticles.slice(0, 10);

    // Ressources supplémentaires pour "Pour aller plus loin" (exclure les 10 déjà affichés)
    const additionalResources = enrichedArticles.slice(10);

    // Total pour les statistiques
    const totalResources = enrichedArticles.length;

    console.log(`📰 ${enrichedNews.length} articles à afficher | ${additionalResources.length} ressources supplémentaires | ${totalResources} résultats totaux`);

    // GÉNÉRER LA NEWSLETTER
    const newsletterHTML = generateNewsletterHTML(
      theme,
      enrichedNews,
      additionalResources,  // Ressources supplémentaires uniquement
      period,
      intentType,
      totalResources  // Total pour les statistiques
    );

    return res.status(200).json({
      success: true,
      newsletter: newsletterHTML,
      theme,
      period: period || 'récent',
      intentType,
      resultsCount: totalResources,
      newsCount: enrichedNews.length,
      additionalCount: additionalResources.length,
      aiSummariesUsed: !!ANTHROPIC_API_KEY,
      format: 'html'
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    return res.status(500).json({ 
      error: error.message
    });
  }
}
