# Case study assets

Scripts pour générer automatiquement les visuels (screenshots + vidéos) du case
study, à exécuter **en local sur ta machine** (pas depuis un environnement
sandboxé) car ils ont besoin d'accéder à ton projet Supabase.

## Pourquoi en local

L'app dépend de Supabase (`*.supabase.co`) pour l'auth et les données. Cet
agent tourne dans un sandbox dont le réseau ne résout pas les sous-domaines
`supabase.co`, donc ni le mode local ni la version Vercel déployée ne
peuvent être capturés depuis là — l'app ne pourrait pas se connecter au
backend dans les deux cas. D'où ces scripts prêts à lancer chez toi.

## 1. Installer Playwright

```bash
npm install -D playwright
npx playwright install chromium
```

## 2. Créer le compte de démo + les données factices

```bash
npm run case-study:seed
```

Ce script :
- crée (ou réutilise) un compte Supabase Auth dédié :
  `b23design23+casestudy@outlook.com` / `CaseStudyDemo2026!`
  (alias `+casestudy` de ton adresse — si la confirmation par email est
  activée sur ton projet Supabase, tu recevras le mail de confirmation sur
  ta boîte habituelle ; sinon relance simplement `npm run case-study:seed`
  après confirmation)
- insère 6 clients fictifs et une quinzaine de commandes avec des statuts
  variés (En cours / Livré / Payé), dont :
  - une commande livrée depuis 18 jours → "Relance (J+15)"
  - une commande livrée depuis 20 jours → "Relance (J+15)"
  - une commande livrée depuis 35 jours → "Relance ferme (J+30)"

Le script est idempotent : tu peux le relancer, il met à jour les clients
existants et régénère les commandes (avec des délais recalculés par rapport
à la date du jour, donc les captures restent cohérentes même des semaines
plus tard).

Si tu préfères utiliser un autre compte/mot de passe, passe-les en variables
d'environnement :

```bash
CASE_STUDY_EMAIL=toi@example.com CASE_STUDY_PASSWORD=... npm run case-study:seed
```

## 3. Générer les visuels

```bash
npm run case-study:capture
```

Ce script lance `npm run dev` automatiquement s'il ne tourne pas déjà sur
`http://localhost:5173` (et l'arrête à la fin s'il l'a démarré), ouvre
Chromium avec Playwright, et génère dans ce dossier :

**Screenshots (desktop 1440×900 et mobile 390×844) :**
- `login-desktop.png` / `login-mobile.png`
- `dashboard-desktop.png` / `dashboard-mobile.png`
- `clients-desktop.png` / `clients-mobile.png`
- `client-detail-desktop.png` / `client-detail-mobile.png` (fiche
  "Techno Solutions SARL", qui a l'historique de commandes le plus varié)

**Vidéos (desktop, `.webm`) :**
- `sidebar-animation.webm` — repli puis dépli du menu latéral
- `relance-dashboard.webm` — clic sur "Envoyer la relance" depuis le Dashboard
- `client-drawer.webm` — ouverture/fermeture du panneau de création de client

Note : pour `relance-dashboard.webm`, le script intercepte l'appel réseau
vers ton webhook Make (`hook.eu1.make.com`) et lui répond `200 OK` sans le
solliciter réellement, pour éviter de déclencher un vrai scénario
d'automatisation (email/SMS) pendant la capture de démo. L'interaction UI
(bouton → confirmation) est donc bien filmée, mais aucune vraie relance n'est
envoyée.

Pour capturer sur une autre URL (ex: un déploiement Vercel où le réseau,
lui, fonctionne) :

```bash
CASE_STUDY_BASE_URL=https://ton-app.vercel.app npm run case-study:capture
```
