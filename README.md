# 📰 Newsletter Generator Cloud

![Status](https://img.shields.io/badge/status-active-success.svg)
![Platform](https://img.shields.io/badge/platform-Vercel-black.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

> Générateur automatique de newsletters professionnelles avec recherche web en temps réel. Déployable sur Vercel en 1-click !

[🚀 Demo Live](https://newsletter-generator.vercel.app) | [📖 Guide de Déploiement](./DEPLOIEMENT.md)

---

## ✨ Fonctionnalités

- 🔍 **Recherche web en temps réel** via l'API Brave Search
- 📱 **Interface responsive** - Fonctionne sur tous les appareils
- ☁️ **100% Cloud** - Aucune installation requise
- 🆓 **Gratuit** - Jusqu'à 2000 newsletters/mois
- 🔒 **Sécurisé** - HTTPS automatique
- ⚡ **Rapide** - Génération en 10-20 secondes
- 🌍 **Accessible partout** - URL publique

---

## 🎯 Démo

![Screenshot](https://via.placeholder.com/800x400/667eea/ffffff?text=Newsletter+Generator)

**Exemple de génération :**
1. Entrez "Intelligence artificielle"
2. Cliquez sur "Générer"
3. Recevez une newsletter avec :
   - Actualités récentes
   - Analyse de tendances
   - Sources vérifiées
   - Format professionnel

---

## 🚀 Déploiement Rapide

### Option 1 : Déploiement en 1-click (Recommandé)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/VOTRE_USERNAME/newsletter-generator)

1. Cliquez sur le bouton ci-dessus
2. Connectez votre compte GitHub
3. Ajoutez votre `BRAVE_API_KEY` dans les variables d'environnement
4. Cliquez sur "Deploy"
5. ✅ C'est prêt !

### Option 2 : Déploiement manuel

Suivez le [Guide de Déploiement Complet](./DEPLOIEMENT.md) (10-15 minutes)

---

## 🔑 Configuration

### 1. Obtenir une clé API Brave

1. Allez sur https://brave.com/search/api/
2. Créez un compte gratuit
3. Générez une clé API
4. **Gratuit** : 2000 recherches/mois

### 2. Variables d'environnement

Dans Vercel, configurez :

```env
BRAVE_API_KEY=votre_cle_brave_ici
```

---

## 📁 Structure du Projet

```
newsletter-cloud/
├── api/
│   ├── generate.js      # Endpoint de génération
│   └── health.js        # Health check
├── public/
│   └── index.html       # Interface web
├── package.json         # Dépendances
├── vercel.json          # Configuration Vercel
└── README.md            # Ce fichier
```

---

## 🛠️ Développement Local

### Prérequis

- Node.js 18+
- Une clé API Brave

### Installation

```bash
# Cloner le repo
git clone https://github.com/VOTRE_USERNAME/newsletter-generator.git
cd newsletter-generator

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env
# Éditez .env et ajoutez votre BRAVE_API_KEY

# Démarrer en local
vercel dev
# Ou
npm run dev
```

L'application sera disponible sur `http://localhost:3000`

---

## 📊 API Endpoints

### `POST /api/generate`

Génère une newsletter.

**Request:**
```json
{
  "theme": "Intelligence artificielle"
}
```

**Response:**
```json
{
  "success": true,
  "newsletter": "# 📰 Newsletter Intelligence artificielle\n...",
  "theme": "Intelligence artificielle",
  "resultsCount": 15,
  "searchesPerformed": 6
}
```

### `GET /api/health`

Vérifie le statut du serveur.

**Response:**
```json
{
  "status": "ok",
  "apiConfigured": true,
  "timestamp": "2025-10-26T12:00:00.000Z"
}
```

---

## 🎨 Personnalisation

### Modifier l'interface

Éditez `public/index.html` :
- Changez les couleurs dans la section `<style>`
- Modifiez les textes
- Ajoutez votre logo

### Modifier le format de newsletter

Éditez `api/generate.js` :
- Fonction `generateNewsletter()`
- Personnalisez la structure
- Ajoutez des sections

### Changer le nombre de recherches

Dans `api/generate.js`, ligne ~80 :
```javascript
const searches = [
  `${theme} actualités 2025`,
  `${theme} innovations récentes`,
  // Ajoutez d'autres recherches ici
];
```

---

## 📱 Utilisation Mobile

L'application est **full responsive** et fonctionne parfaitement sur :
- 📱 Smartphones (iOS / Android)
- 💻 Ordinateurs
- 🖥️ Tablettes

**Astuce :** Ajoutez l'URL à votre écran d'accueil pour un accès rapide !

---

## 💰 Coûts

| Service | Plan Gratuit | Limite |
|---------|--------------|--------|
| **Vercel** | ✅ Gratuit | Illimité |
| **Brave API** | ✅ Gratuit | 2000 req/mois |
| **GitHub** | ✅ Gratuit | Illimité |

**Total : 0€/mois** 🎉

---

## 🔒 Sécurité

- ✅ Clé API stockée de manière sécurisée (variables d'environnement Vercel)
- ✅ HTTPS automatique sur tous les déploiements
- ✅ Pas de stockage de données utilisateur
- ✅ Code open-source et auditable

---

## 🐛 Dépannage

### "API Brave non configurée"

→ Vérifiez que `BRAVE_API_KEY` est bien configurée dans Vercel

### "Serveur non disponible"

→ Attendez 2-3 minutes après le déploiement initial

### Pas de résultats

→ Vérifiez votre quota sur https://api.search.brave.com/app/dashboard

Plus de solutions dans le [Guide de Déploiement](./DEPLOIEMENT.md)

---

## 📚 Technologies Utilisées

- **Frontend** : HTML5, CSS3, Vanilla JavaScript
- **Backend** : Node.js, Vercel Serverless Functions
- **API** : Brave Search API
- **Hébergement** : Vercel
- **Version Control** : Git, GitHub

---

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

---

## 📝 Roadmap

- [ ] Support multi-langues
- [ ] Templates de newsletters personnalisables
- [ ] Export en PDF
- [ ] Envoi par email automatique
- [ ] Historique des newsletters
- [ ] Planification automatique
- [ ] Statistiques d'utilisation
- [ ] Mode sombre

---

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👏 Remerciements

- [Brave Search API](https://brave.com/search/api/) pour la recherche web
- [Vercel](https://vercel.com) pour l'hébergement gratuit
- [Anthropic Claude](https://claude.ai) pour l'assistance au développement

---

## 📧 Contact

Des questions ? Ouvrez une [issue](https://github.com/VOTRE_USERNAME/newsletter-generator/issues) !

---

**Fait avec ❤️ et ☕ par [Votre Nom]**

[⬆ Retour en haut](#-newsletter-generator-cloud)
