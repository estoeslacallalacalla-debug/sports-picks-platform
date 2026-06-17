export default async function handler(req, res) {
  try {
    const fdKey = process.env.FOOTBALL_DATA_KEY;

    if (!fdKey) {
      return res.status(500).json({ error: "FOOTBALL_DATA_KEY no configurada" });
    }

    const hoy = new Date().toISOString().split("T")[0];
    const en4dias = new Date(Date.now() + 4*24*60*60*1000).toISOString().split("T")[0];

    const r = await fetch(
      `https://api.football-data.org/v4/competitions/WC/matches?dateFrom=${hoy}&dateTo=${en4dias}`,
      { headers: { "X-Auth-Token": fdKey } }
    );

    const data = await r.json();

    // Resumen simple: solo status y fechas, para verlo rapido
    const resumen = (data.matches || []).map(m => ({
      partido: `${m.homeTeam?.name} vs ${m.awayTeam?.name}`,
      fecha: m.utcDate,
      status: m.status
    }));

    return res.status(200).json({
      hoy,
      en4dias,
      httpStatus: r.status,
      totalEncontrados: resumen.length,
      partidos: resumen,
      mensajeError: data.message || null
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
