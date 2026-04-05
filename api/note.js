export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const rawText = typeof req.body?.text === "string" ? req.body.text : "";
  const text = rawText.trim().slice(0, 180);

  if (!text) {
    return res.status(400).json({ ok: false, error: "Empty note" });
  }

  const payload = {
    text,
    createdAt: new Date().toISOString(),
    userAgent: req.headers["user-agent"] || "unknown"
  };

  console.log("[apology-note]", JSON.stringify(payload));

  return res.status(200).json({ ok: true });
}
