// Receives leads from public/quiz-avion-chien.html and forwards them to
// systeme.io as contacts, so Julie can build a newsletter from the quiz.
// The systeme.io API key never reaches the browser — it only lives here,
// as a Vercel environment variable (SYSTEME_API_KEY).

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SYSTEME_API_BASE = "https://api.systeme.io/api";

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

function buildCustomFields({ dogName, score, weakCategories }) {
  const fields = [];
  if (process.env.SYSTEME_FIELD_DOG_NAME && dogName) {
    fields.push({ slug: process.env.SYSTEME_FIELD_DOG_NAME, value: String(dogName).slice(0, 200) });
  }
  if (process.env.SYSTEME_FIELD_SCORE && typeof score === "number") {
    fields.push({ slug: process.env.SYSTEME_FIELD_SCORE, value: String(score) });
  }
  if (process.env.SYSTEME_FIELD_WEAK_POINTS && Array.isArray(weakCategories)) {
    fields.push({ slug: process.env.SYSTEME_FIELD_WEAK_POINTS, value: weakCategories.join(", ").slice(0, 500) });
  }
  return fields;
}

async function upsertSystemeContact(apiKey, { email, firstName, fields }) {
  const createRes = await fetch(`${SYSTEME_API_BASE}/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
    body: JSON.stringify({
      email,
      firstName,
      ...(fields.length ? { fields } : {}),
    }),
  });

  if (createRes.ok) return { ok: true };

  // Contact already exists: look it up and patch its custom fields instead.
  if (createRes.status === 422 || createRes.status === 409) {
    const searchRes = await fetch(`${SYSTEME_API_BASE}/contacts?email=${encodeURIComponent(email)}`, {
      headers: { "X-API-Key": apiKey },
    });
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const existing = Array.isArray(searchData.items) ? searchData.items[0] : Array.isArray(searchData) ? searchData[0] : null;
      if (existing && existing.id && fields.length) {
        const updateRes = await fetch(`${SYSTEME_API_BASE}/contacts/${existing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/merge-patch+json", "X-API-Key": apiKey },
          body: JSON.stringify({ fields }),
        });
        if (updateRes.ok) return { ok: true };
        const updateErr = await updateRes.text();
        return { ok: false, status: updateRes.status, detail: updateErr };
      }
      // Contact exists and there's nothing new to patch (no custom fields configured).
      if (existing) return { ok: true };
    }
  }

  const createErr = await createRes.text();
  return { ok: false, status: createRes.status, detail: createErr };
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

  const apiKey = process.env.SYSTEME_API_KEY;
  if (!apiKey) {
    console.error("quiz-lead: SYSTEME_API_KEY manquante");
    return res.status(500).json({ error: "Configuration serveur manquante" });
  }

  try {
    const fields = buildCustomFields({ dogName, score, weakCategories });
    const result = await upsertSystemeContact(apiKey, { email, firstName, fields });

    if (!result.ok) {
      console.error("quiz-lead: systeme.io a refusé la requête", result.status, result.detail);
      return res.status(502).json({ error: "Erreur lors de l'enregistrement" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("quiz-lead: appel systeme.io échoué", err);
    return res.status(502).json({ error: "Erreur réseau" });
  }
}
