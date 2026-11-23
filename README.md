# Créno — agenda-college

Emploi du temps pour un·e collégien·ne de 6e. Affiche le planning de la
semaine et les heures libres ("heures de trou"). Pas de compte : tout est
stocké dans le navigateur. Pas de base de données côté serveur — la seule
pièce serveur du projet est un relais iCal sans état (voir plus bas).

Basé sur les [brand guidelines Créno](https://claude.ai/design) (violet
`#4B34F5` pour les cours, vert `#17C99A` pour les heures de trou, rose
`#FF4D8D` pour le cours en cours, orange `#FF9A3C` pour les devoirs).

## Fonctionnalités

- **Aucun compte** — un prénom suffit, tout vit dans `localStorage`.
- **Vue du jour** — cours, cours en direct, heures de trou calculées
  automatiquement entre les créneaux.
- **Cours récurrents** — chaque semaine, semaine A/B, chaque jour d'école,
  1×/mois, ou ponctuel. L'alternance A/B se calcule à partir de la semaine
  de la rentrée (lundi 31 août — `TERM_START` dans `lib/recurrence.ts`,
  fixe, pas un réglage).
- **Devoirs** — liste simple à cocher, avec date de rendu.
- **Prochain cours** — mis en avant sur l'écran du jour : la prochaine
  occurrence à venir (aujourd'hui ou plus tard), avec le temps restant.
  Un cours annulé n'est jamais "en cours" ni "prochain cours".
- **Import JSON** (Réglages → « Importer un JSON ») — charge un export
  hebdomadaire au format EcoleDirecte (`jours[].cours[]`, voir
  `lib/importSchedule.ts`) et crée un cours ponctuel par entrée. Réimporter
  la même semaine remplace les cours déjà importés sur ces dates (pas de
  doublons) sans toucher aux cours récurrents. Chaque cours importé porte
  un statut (`normal`/`remplace`/`controle`/`annule`), affiché en badge et,
  pour `remplace`/`controle`, avec le prof habituel ("X (remplace Y)"). Un
  cours annulé reste visible (barré, grisé) mais ne bloque pas le créneau :
  il ne compte ni comme "en cours" ni comme "prochain cours". Taper un
  cours ouvre une fiche avec le détail (`info` du JSON) et un lien
  "Modifier".
- **Synchronisation iCal** (Réglages → « Lien iCal EcoleDirecte ») — colle
  le lien d'abonnement iCal (`.ics`) fourni par EcoleDirecte ; Créno le
  récupère via `api/ics-proxy.ts` (voir « Architecture » plus bas), le parse
  (`lib/importIcal.ts`) et l'importe avec le même mécanisme « remplace les
  dates déjà importées » que l'import JSON. Le lien est gardé en local
  (masqué à l'affichage) pour qu'une resynchronisation tienne en un tap. À
  l'inverse du JSON, un flux iCal standard ne distingue pas
  `remplace`/`controle` (pas de champ dédié dans la norme) : seul
  `STATUS:CANCELLED` est reconnu de façon fiable et mappé sur `annule` — le
  reste (prof, type de statut) dépendra de ce qu'EcoleDirecte met réellement
  dans `SUMMARY`/`DESCRIPTION`, pas encore vérifié contre un flux réel.
- **Suppression** (Réglages → « Supprimer l'emploi du temps ») — vide tous
  les cours (récurrents et importés) après confirmation dans une modale ;
  les devoirs ne sont pas touchés.
- **Installable** — `manifest.json` + service worker (via `vite-plugin-pwa`) :
  « Ajouter à l'écran d'accueil » depuis le navigateur, fonctionne hors ligne.

## Développement

```bash
npm install
npm run dev      # serveur de dev
npm test         # tests (récurrence, emploi du temps, import JSON)
npm run build    # build de prod (inclut le typecheck)
```

Stack : React + TypeScript + Vite, routage via `react-router-dom`
(`HashRouter`). Aucune base de données — `api/ics-proxy.ts` est la seule
pièce serveur (déployée comme Vercel Edge Function).

## Architecture : le relais iCal

Un navigateur ne peut pas récupérer le flux `.ics` d'EcoleDirecte en
direct : EcoleDirecte n'envoie pas d'en-têtes CORS pour des sites tiers.
Google Agenda contourne ce problème en allant chercher le flux depuis ses
propres serveurs, pas depuis le navigateur de l'utilisateur·ice —
`api/ics-proxy.ts` fait la même chose : il ne fait que relayer le texte du
calendrier (aucune donnée stockée, aucun compte), et n'accepte que des
liens `https://*.ecoledirecte.com/...` (`lib/icsProxyGuard.ts`) pour ne pas
devenir un proxy ouvert vers n'importe quelle URL. Faute d'avoir eu accès à
un vrai flux EcoleDirecte au moment d'écrire ce code, le proxy et le
parseur (`lib/importIcal.ts`) sont testés contre la norme RFC 5545 et des
exemples synthétiques, pas contre un flux réel — à vérifier au premier
essai.

## Stockage local

| Clé | Contenu |
| --- | --- |
| `creno.prenom` | prénom de l'élève |
| `creno.cours` | liste des cours, récurrence incluse |
| `creno.devoirs` | liste des devoirs |
| `creno.icalUrl` | lien d'abonnement iCal EcoleDirecte, si renseigné |
