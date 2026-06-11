export default async function handler(req, res) {
  try {
    const oddsKey = process.env.ODDS_API_KEY;

    if (!oddsKey) {
      return res.status(500).json({
        error: "ODDS_API_KEY no configurada"
      });
    }

    const response = await fetch(
      "https://api.the-odds-api.com/v4/sports/soccer/odds/?regions=eu&markets=h2h&apiKey=" +
        oddsKey
    );

    const data = await response.json();

    return res.status(200).json({
      total: data.length,
      partidos: data
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
