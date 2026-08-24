# Quiz "Es-tu prêt(e) à prendre l'avion avec ton chien ?"

Quiz de diagnostic pour Julie & Charly (@mylittlecharly_) — lien à mettre en bio Instagram/YouTube. Sert de générateur de leads pour l'ebook *Comment voyager en Europe avec son compagnon à quatre pattes*.

- `index.html` — le quiz complet (HTML/CSS/JS autonome, aucune dépendance).
- `api/quiz-lead.js` — fonction serverless Vercel qui reçoit prénom/nom du chien/email à la fin du quiz et crée le contact dans systeme.io (tout le monde est capturé, quel que soit le score).

## Déploiement (Vercel)

1. Importer ce repo dans Vercel (aucune configuration de build nécessaire, c'est un site statique + une fonction serverless).
2. Dans **Project Settings → Environment Variables**, ajouter :

   | Variable | Valeur |
   |---|---|
   | `SYSTEME_API_KEY` | ta clé API systeme.io (Réglages → Clé API publique) — à marquer *sensitive* |
   | `SYSTEME_FIELD_DOG_NAME` | slug du champ personnalisé « Nom du chien » |
   | `SYSTEME_FIELD_SCORE` | slug du champ personnalisé « Score quiz avion » |
   | `SYSTEME_FIELD_WEAK_POINTS` | slug du champ personnalisé « Points à travailler » |

3. Dans systeme.io, créer les 3 champs personnalisés ci-dessus si ce n'est pas déjà fait (Contacts → Champs personnalisés). Le slug de chaque champ est visible quand tu l'ouvres en édition.
4. Redéployer.

## Où voir les réponses

Directement dans **ton compte systeme.io → Contacts**. Chaque personne qui termine le quiz devient un contact avec son prénom, son email, le nom de son chien, son score de préparation (%) et ses points faibles — **y compris les personnes qui ont un bon score** : la capture d'email a lieu systématiquement avant l'affichage du résultat, quel que soit le score obtenu.

Comme c'est ton compte systeme.io, Cédric n'y a pas accès.

## Domaine / lien pour la bio

Une fois déployé sur Vercel, tu obtiens une URL type `quiz-chien-ebook.vercel.app` (ou un domaine personnalisé si tu en connectes un) à mettre en bio.
