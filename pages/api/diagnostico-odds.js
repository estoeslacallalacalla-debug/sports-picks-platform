export default async function handler(req, res) {
  try {
    const apiKey = process.env.ODDS_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "ODDS_API_KEY no configurada" });

    const r = await fetch(
      "https://api.the-odds-api.com/v4/sports/soccer_spain_la_liga/odds/?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=" + apiKey
    );

    const creditsRemaining = r.headers.get("x-requests-remaining");
    const creditsUsed = r.headers.get("x-requests-used");

    if (!r.ok) {
      const error = await r.text();
      return res.status(200).json({ httpStatus: r.status, error, creditsRemaining, creditsUsed });
    }

    const data = await r.json();
    const partidos = Array.isArray(data) ? data : [];

    return res.status(200).json({
      httpStatus: r.status,
      creditsRemaining,
      creditsUsed,
      totalPartidos: partidos.length,
      casasDisponibles: partidos[0] ? partidos[0].bookmakers.map(function(b) { return b.title; }) : [],
      primerPartido: partidos[0] ? partidos[0].home_team + " vs " + partidos[0].away_team : null
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
