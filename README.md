# Quiz "Es-tu prêt(e) à prendre l'avion avec ton chien ?"

Quiz de diagnostic pour Julie & Charly (@mylittlecharly_) — lien à mettre en bio Instagram/YouTube. Sert de générateur de leads pour l'ebook *Comment voyager en Europe avec son compagnon à quatre pattes*.

- `index.html` — le quiz complet (HTML/CSS/JS autonome, aucune dépendance).
- `api/quiz-lead.js` — fonction serverless Vercel qui reçoit prénom/nom du chien/email à la fin du quiz et envoie un email de notification à Julie via Resend (tout le monde déclenche un email, quel que soit le score).

## Déploiement (Vercel)

1. Importer ce repo dans Vercel (aucune configuration de build nécessaire, c'est un site statique + une fonction serverless).
2. Créer un compte gratuit sur [resend.com](https://resend.com), **avec l'adresse email sur laquelle tu veux recevoir les notifications du quiz**.
3. Dans Resend, aller dans **API Keys → Create API Key** et copier la clé.
4. Dans Vercel, **Project Settings → Environment Variables**, ajouter :

   | Variable | Valeur |
   |---|---|
   | `RESEND_API_KEY` | la clé API créée à l'étape 3 — à marquer *sensitive* |
   | `NOTIFY_EMAIL` | l'adresse email où tu veux recevoir les notifications |

5. Redéployer.

⚠️ **Important** : sans domaine vérifié dans Resend, l'adresse d'envoi par défaut (`onboarding@resend.dev`) ne peut envoyer **que vers l'adresse email utilisée pour créer le compte Resend**. Donc `NOTIFY_EMAIL` doit être exactement cette même adresse. Si tu veux recevoir les notifs sur une autre adresse plus tard, il faudra vérifier un nom de domaine dans Resend (Domains → Add Domain).

## Où voir les réponses

Un email arrive dans ta boîte à chaque quiz terminé, avec le prénom, le nom du chien, l'email, le score de préparation (%) et les points à travailler — **y compris pour les bons scores** : la capture d'email a lieu systématiquement avant l'affichage du résultat, quel que soit le score obtenu.

Tu peux répondre directement à cet email (le "répondre à" pointe vers l'email de la personne qui a fait le quiz).

Pour l'instant tu compiles ces emails manuellement (par exemple dans un tableau, ou en les ajoutant toi-même dans systeme.io) — rien n'est automatisé côté systeme.io. On pourra brancher ça plus tard si tu veux.

## Domaine / lien pour la bio

Une fois déployé sur Vercel, tu obtiens une URL type `quiz-chien.vercel.app` (ou un domaine personnalisé si tu en connectes un) à mettre en bio.
