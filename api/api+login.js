// api/api+login.js

const RATE_LIMIT = new Map(); // IP → { count, time }
const LIMIT = 20; // requests
const WINDOW = 60 * 1000; // 1 minute

export default async function handler(req, res) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown";

  // ---------------- RATE LIMIT ----------------
  const now = Date.now();
  const entry = RATE_LIMIT.get(ip) || { count: 0, time: now };

  if (now - entry.time > WINDOW) {
    entry.count = 0;
    entry.time = now;
  }

  entry.count++;
  RATE_LIMIT.set(ip, entry);

  if (entry.count > LIMIT) {
    return res.status(429).json({
      ok: false,
      error: "Too many requests. Please slow down."
    });
  }

  // --------------- LOGIN API ------------------
  if (req.body?.email && req.body?.password) {
    // Simple demo login (replace with DB later)
    if (
      req.body.email === "test@test.com" &&
      req.body.password === "123456"
    ) {
      return res.json({ ok: true });
    }
    return res.json({ ok: false });
  }

  // --------------- AI FIX API -----------------
  if (!req.body?.error) {
    return res.json({ ok: false });
  }

  const err = req.body.error.toLowerCase();

  let response = {
    fix: "Fix: unable to determine correction."
  };

  // ---- Missing parenthesis or quote ----
  if (
    err.includes("unexpected eof") ||
    err.includes("missing") ||
    err.includes("incomplete") ||
    err.includes("was never closed")
  ) {
    response.fix =
`Error: on line 2, missing closing parenthesis or quote.
Fix: line 2 be print("hello world")`;
  }

  // ---- Indentation error ----
  else if (err.includes("indentationerror")) {
    response.fix =
`Error: incorrect indentation on line 2.
Fix: line 2 be properly indented.`;
  }

  // ---- Name error ----
  else if (err.includes("nameerror")) {
    response.fix =
`Error: variable used before definition.
Fix: define the variable before use.`;
  }

  return res.json(response);
}
