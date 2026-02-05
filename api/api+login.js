// api/api+login.js

const rateMap = new Map();
const LIMIT = 10;        // max AI calls
const WINDOW = 60_000;   // per 60 seconds

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const body = req.body || {};
  const { email, password, error } = body;

  /* ---------------- LOGIN ---------------- */
  if (email !== undefined && password !== undefined) {
    if (
      email === "test@pythoncai.in" &&
      password === "pythoncaiisbest911"
    ) {
      return res.status(200).json({ ok: true });
    }
    return res.status(401).json({ ok: false });
  }

  /* ----------- RATE LIMIT (AI) ----------- */
  if (error) {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      "unknown";

    const now = Date.now();
    let data = rateMap.get(ip);

    if (!data || now - data.time > WINDOW) {
      data = { count: 0, time: now };
    }

    data.count++;
    rateMap.set(ip, data);

    if (data.count > LIMIT) {
      return res.status(429).json({
        fix:
          "Error: rate limit exceeded.\n" +
          "Fix: wait 1 minute and try again."
      });
    }
  }

  /* -------------- AI FIXER -------------- */
  if (error) {
    const prompt = `
You are a Python error fixer.

The program produced this error:
${error}

Respond STRICTLY in this exact format:

Error: on line X, <clear explanation>.
Fix: line X be <corrected code>.

Rules:
- Do not add extra text.
- Do not add markdown.
- Always respond in exactly 2 lines.
`;

    try {
      const r = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "arcee-ai/trinity-large-preview:free",
            temperature: 0,
            messages: [{ role: "user", content: prompt }]
          })
        }
      );

      const d = await r.json();
      const text =
        d?.choices?.[0]?.message?.content ||
        "Error: unknown error.\nFix: check syntax.";

      return res.status(200).json({ fix: text });

    } catch (e) {
      return res.status(500).json({
        fix:
          "Error: AI service unavailable.\n" +
          "Fix: try again later."
      });
    }
  }

  return res.status(400).end();
}
