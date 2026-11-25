# Ravito

Nutrition calée sur l'entraînement : glucides du jour et code couleur de chaque repas selon tes séances, plan de ravitaillement de course, recettes.

**Connecteur principal : Intervals.icu (gratuit).** Il récupère tes activités depuis Garmin, Coros, Wahoo, Polar, Suunto ou Zwift, et tes séances prévues. Ravito importe les activités réalisées des 3 derniers jours et les séances des 7 prochains jours, à chaque ouverture.

- Pas de base de données. Le profil, les séances et la clé Intervals.icu restent dans le navigateur de chaque utilisateur.
- Hébergement gratuit sur Vercel (offre Hobby). Aucune variable d'environnement n'est nécessaire.

## Objectifs imposés (diététicien·ne, coach)
Dans **Profil**, trois champs facultatifs : **calories** (kcal/jour), **protéines** et **lipides** (g/jour). Les calories sont un **total strict** chaque jour, entraînement compris : rien n'est ajouté. Les glucides pris pendant l'effort (boisson, gels) sont comptés dedans et retirés des repas ; le reste est réparti entre les repas selon le code couleur (plus autour des séances).

## Menus concrets
Pour chaque repas, Ravito propose un menu avec des quantités (poids cuits) calculées pour atteindre les glucides et protéines visés, à partir d'une table d'aliments courants. Bouton « Autre idée » pour une variante. Les glucides pris pendant les séances (boisson, gels) sont déduits des repas. Avant une séance proche, la collation est digeste (peu de gras et de fibres). Valeurs nutritionnelles indicatives.

## Mise en ligne
1. Sur https://vercel.com : **Add New → Project**, choisis ce dépôt, puis **Deploy**.
2. Chaque push sur `main` redéploie automatiquement.

## Connecter sa montre (chaque utilisateur)
1. Crée un compte gratuit sur https://intervals.icu.
2. **Settings → Connections** : connecte Garmin Connect (ou ta marque de montre).
3. **Settings → Developer Settings** : copie l'**Athlete ID** (ex. `i12345`) et génère une **API Key**.
4. Dans Ravito, onglet **Séances → Connecteurs → Intervals.icu** : colle les deux, puis **Connecter et synchroniser**.

Les activités arrivées dans Intervals.icu *via Strava* ne sont pas lisibles par API (restriction de Strava). Connecte la montre directement à Intervals.icu.

## Garmin Connect en direct (clé API personnelle, gratuit)
1. Sur Garmin Connect (site web) : **Paramètres → Clé API personnelle → Créer**. La clé n'est affichée qu'une fois.
2. Dans Ravito : **Séances → Connecteurs → Garmin Connect**, colle la clé, **Connecter Garmin**.

Ravito échange la clé contre un jeton (`personal.connectapi.garmin.com`) et lit les activités des 3 derniers jours à chaque ouverture : sport, durée, FC, puissance et effet d'entraînement Garmin (servant à estimer l'intensité). Les doublons avec Intervals.icu sont ignorés. Chaque utilisateur crée sa propre clé.

## Séances prévues : agenda iCal (Garmin Connect, Nolio, Google Agenda…)
Garmin ne transmet pas les séances planifiées à Intervals.icu. Pour les avoir, colle dans Ravito (onglet **Séances → Agenda d'entraînement**) le lien d'abonnement iCal de ton calendrier, par exemple celui de Garmin Connect où Nolio reporte tes séances. Ravito importe les 10 prochains jours et devine sport, durée et intensité d'après le nom (« HT Basse intensité » = vélo, « SV2 », « 6 x 5' » = intensité haute…). Tu peux corriger chaque séance dans la liste ; tes corrections sont gardées aux synchros suivantes.

## Strava (optionnel, payant)
Strava réserve désormais son API aux abonnés. Si tu as un abonnement :
1. Crée une app sur https://www.strava.com/settings/api (Authorization Callback Domain : ton domaine `xxx.vercel.app`, sans `https://`).
2. Dans Vercel → Settings → Environment Variables, ajoute `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET` et `SESSION_SECRET` (40 caractères aléatoires ou plus), puis redéploie.
3. Le bouton **Connecter Strava** apparaît alors dans l'app. Une nouvelle app Strava est limitée à 1 athlète ; pour plus, fais une demande à Strava.

## Garmin et Nolio
- **Garmin** : l'API officielle est réservée aux partenaires validés. Passe par Intervals.icu.
- **Nolio** : pas d'API publique ouverte. Le dossier `api/` peut accueillir un connecteur sur le modèle de `api/icu.js` si Nolio t'ouvre un accès.

## Structure
```
index.html            l'application (HTML/CSS/JS, sans dépendance)
api/_lib.js           cookies chiffrés, rafraîchissement du jeton Strava
api/strava/login.js   redirection vers Strava (OAuth)
api/strava/callback.js retour de Strava, enregistre la connexion
api/strava/activities.js activités des N derniers jours
api/strava/logout.js  déconnexion et révocation
api/garmin.js         connecteur Garmin Connect (clé API personnelle)
api/icu.js            relais vers l'API Intervals.icu (activités et séances prévues)
api/ics.js            relais pour lire un agenda iCal (refuse les adresses internes)
api/strava/enabled.js indique si les clés Strava sont configurées
```

Estimations basées sur les recommandations publiques de nutrition du sport ; ce n'est pas un avis médical.
