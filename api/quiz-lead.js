// Receives leads from index.html and emails Julie a notification for each
// completed quiz (name, dog's name, email, score, weak points), so she can
// collect them manually for now. The Resend API key never reaches the
// browser — it only lives here, as a Vercel environment variable.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => { data += chunk; });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    return res.status(400).json({ error: "Corps de requête invalide" });
  }

  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const dogName = typeof body.dogName === "string" ? body.dogName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const website = typeof body.website === "string" ? body.website.trim() : "";
  const score = typeof body.score === "number" ? body.score : undefined;
  const weakCategories = Array.isArray(body.weakCategories) ? body.weakCategories.filter((c) => typeof c === "string") : [];

  // Honeypot: bots fill every field, real users never see or fill this one.
  if (website) {
    return res.status(200).json({ ok: true });
  }

  if (!firstName || !dogName || !email || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: "Champs manquants ou invalides" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const notifyTo = process.env.NOTIFY_EMAIL;
  if (!apiKey || !notifyTo) {
    console.error("quiz-lead: RESEND_API_KEY ou NOTIFY_EMAIL manquant");
    return res.status(500).json({ error: "Configuration serveur manquante" });
  }

  const scoreLabel = typeof score === "number" ? `${score}%` : "inconnu";
  const weakLabel = weakCategories.length ? weakCategories.join(", ") : "aucun (score parfait)";

  const html = `
    <h2>Nouvelle réponse au quiz avion 🐾✈️</h2>
    <p><strong>Prénom :</strong> ${escapeHtml(firstName)}</p>
    <p><strong>Chien :</strong> ${escapeHtml(dogName)}</p>
    <p><strong>Email :</strong> ${escapeHtml(email)}</p>
    <p><strong>Score de préparation :</strong> ${scoreLabel}</p>
    <p><strong>Points à travailler :</strong> ${escapeHtml(weakLabel)}</p>
  `.trim();

  try {
    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Quiz avion chien <onboarding@resend.dev>",
        to: [notifyTo],
        subject: `Quiz : ${firstName} & ${dogName} (${scoreLabel})`,
        html,
        reply_to: email,
      }),
    });

    if (!sendRes.ok) {
      const errText = await sendRes.text();
      console.error("quiz-lead: Resend a refusé la requête", sendRes.status, errText);
      return res.status(502).json({ error: "Erreur lors de l'envoi" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("quiz-lead: appel Resend échoué", err);
    return res.status(502).json({ error: "Erreur réseau" });
  }
}
