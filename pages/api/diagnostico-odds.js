
export default async function handler(req, res) {
  try {
    const apiKey = process.env.ODDS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "ODDS_API_KEY no configurada" });
    }

    // Probar con La Liga que es la más probable que tenga datos ahora
    const r = await fetch(
      `https://api.the-odds-api.com/v4/sports/soccer_spain_la_liga/odds/?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=${apiKey}`
    );

    const creditsRemaining = r.headers.get("x-requests-remaining");
    const creditsUsed = r.headers.get("x-requests-used");

    if (!r.ok) {
      const error = await r.text();
      return res.status(200).json({
        httpStatus: r.status,
        error,
        creditsRemaining,
        creditsUsed
      });
    }

    const data = await r.json();

    return res.status(200).json({
      httpStatus: r.status,
      creditsRemaining,
