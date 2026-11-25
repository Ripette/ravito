# Ravito

Nutrition calée sur l'entraînement : glucides du jour et code couleur de chaque repas selon tes séances, plan de ravitaillement de course, recettes.
Connecteurs : **Strava** (activités réalisées) et **Intervals.icu** (séances planifiées, reçoit Garmin et TrainingPeaks).

- Pas de base de données. Le profil et les séances restent dans le navigateur de chaque utilisateur.
- La connexion Strava est gardée dans un cookie chiffré (AES-256-GCM).
- Hébergement gratuit sur Vercel (offre Hobby).

## Mise en ligne (environ 15 min)

### 1. Déployer sur Vercel
1. Va sur https://vercel.com, connecte-toi avec GitHub.
2. **Add New → Project**, choisis ce dépôt, puis **Deploy** (aucun réglage à changer).
3. Note l'adresse obtenue, par ex. `ravito-xxx.vercel.app`.

### 2. Créer l'app Strava
1. Va sur https://www.strava.com/settings/api.
2. Remplis le formulaire :
   - Application Name : `Ravito`
   - Category : `Training`
   - Website : `https://ravito-xxx.vercel.app`
   - **Authorization Callback Domain** : `ravito-xxx.vercel.app` (sans `https://`)
3. Note le **Client ID** et le **Client Secret**.

### 3. Ajouter les secrets dans Vercel
Projet → **Settings → Environment Variables** :

| Nom | Valeur |
|---|---|
| `STRAVA_CLIENT_ID` | le Client ID Strava |
| `STRAVA_CLIENT_SECRET` | le Client Secret Strava |
| `SESSION_SECRET` | une longue chaîne aléatoire (40 caractères ou plus) |

Ensuite : **Deployments → … → Redeploy** pour les prendre en compte.

### 4. Ouvrir l'app
Va sur ton adresse Vercel, onglet **Séances**, puis **Connecter Strava**.
Sur téléphone : menu du navigateur → « Ajouter à l'écran d'accueil ».

## Ouvrir à des amis
Strava limite une nouvelle app à **1 athlète** (toi). Pour en ajouter, fais une demande d'augmentation via le formulaire indiqué sur https://www.strava.com/settings/api (« Rate limits / athlete capacity »). Chaque ami se connecte ensuite avec son propre Strava ; ses données restent dans son navigateur.

## Garmin et Nolio
- **Garmin** : l'API officielle est réservée aux partenaires validés par Garmin. Relie Garmin Connect à Strava ou à Intervals.icu : tes activités arrivent automatiquement.
- **Nolio** : pas d'API publique ouverte. Il faut demander un accès à Nolio ; le dossier `api/` est prêt à recevoir un connecteur sur le modèle de `api/strava/`.

## Structure
```
index.html            l'application (HTML/CSS/JS, sans dépendance)
api/_lib.js           cookies chiffrés, rafraîchissement du jeton Strava
api/strava/login.js   redirection vers Strava (OAuth)
api/strava/callback.js retour de Strava, enregistre la connexion
api/strava/activities.js activités des N derniers jours
api/strava/logout.js  déconnexion et révocation
api/icu.js            relais vers l'API Intervals.icu
```

Estimations basées sur les recommandations publiques de nutrition du sport ; ce n'est pas un avis médical.
