# Créno — agenda-college

Emploi du temps pour un·e collégien·ne de 6e. Affiche le planning de la
semaine et les heures libres ("heures de trou"). Pas de compte, pas de
serveur : tout est stocké dans le navigateur.

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
- **Installable** — `manifest.json` + service worker (via `vite-plugin-pwa`) :
  « Ajouter à l'écran d'accueil » depuis le navigateur, fonctionne hors ligne.

## Développement

```bash
npm install
npm run dev      # serveur de dev
npm test         # tests du moteur de récurrence
npm run build    # build de prod (inclut le typecheck)
```

Stack : React + TypeScript + Vite, routage via `react-router-dom`
(`HashRouter`), aucune dépendance serveur.

## Stockage local

| Clé | Contenu |
| --- | --- |
| `creno.prenom` | prénom de l'élève |
| `creno.cours` | liste des cours, récurrence incluse |
| `creno.devoirs` | liste des devoirs |
