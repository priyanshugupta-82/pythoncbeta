export default async function handler(req, res) {
  const { email, password, error } = req.body || {};

  // LOGIN
  if (email && password) {
    if (
      email === "test@pythoncai.in" &&
      password === "pythoncaiisbest911"
    ) {
      return res.json({ ok: true });
    }
    return res.json({ ok: false });
  }

  // AI ERROR FIX
  if (error) {
    const prompt = `
${error}

Explain ONLY in this format:
Error: on line __ ........
Fix: line __ be ........
`;

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
          messages: [{ role: "user", content: prompt }]
        })
      }
    );

    const d = await r.json();
    return res.json({ fix: d.choices[0].message.content });
  }

  res.status(400).end();
}
