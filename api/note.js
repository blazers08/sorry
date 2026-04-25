export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const rawText = typeof req.body?.text === "string" ? req.body.text : "";
  const text = rawText.trim().slice(0, 180);
  const rawSource = typeof req.body?.source === "string" ? req.body.source : "";
  const source = rawSource.trim().slice(0, 80) || "未標記來源";
  const rawCardTitle = typeof req.body?.cardTitle === "string" ? req.body.cardTitle : "";
  const cardTitle = rawCardTitle.trim().slice(0, 120) || source;

  if (!text) {
    return res.status(400).json({ ok: false, error: "Empty note" });
  }

  const payload = {
    source,
    cardTitle,
    text,
    createdAt: new Date().toISOString(),
    userAgent: req.headers["user-agent"] || "unknown"
  };

  console.log("[apology-note]", JSON.stringify(payload));

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL;
  const notifyToEmail = process.env.NOTIFY_TO_EMAIL;

  if (!resendApiKey || !resendFromEmail || !notifyToEmail) {
    console.warn("[apology-note] email skipped: missing env vars");
    return res.status(200).json({ ok: true, emailSent: false });
  }

  try {
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: [notifyToEmail],
        subject: `Christie 網站有新留言：${payload.source}`,
        text: [
          `有人在「${payload.cardTitle}」留下新留言。`,
          "",
          `來源：${payload.source}`,
          `時間：${payload.createdAt}`,
          `裝置：${payload.userAgent}`,
          "",
          "內容：",
          payload.text
        ].join("\n")
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("[apology-note] resend failed", emailResponse.status, errorText);
      return res.status(500).json({ ok: false, error: "Email send failed" });
    }

    return res.status(200).json({ ok: true, emailSent: true });
  } catch (error) {
    console.error("[apology-note] resend exception", error);
    return res.status(500).json({ ok: false, error: "Email send exception" });
  }
}
