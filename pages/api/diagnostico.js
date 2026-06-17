export default async function handler(req, res) {
  try {
    const fdKey = process.env.FOOTBALL_DATA_KEY;

    if (!fdKey) {
      return res.status(500).json({ error: "FOOTBALL_DATA_KEY no configurada" });
    }

    const r = await fetch(
      `https://api.football-data.org/v4/competitions/WC/matches`,
      { headers: { "X-Auth-Token": fdKey } }
    );

    const data = await r.json();
    const status = r.status;

    return res.status(200).json({
      httpStatus: status,
      respuestaCompleta: data
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
