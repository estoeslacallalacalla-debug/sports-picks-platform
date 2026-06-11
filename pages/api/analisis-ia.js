import { supabase } from "../../lib/supabase";

export default async function handler(req, res) {
  try {

    const apiKey =
      process.env.FOOTBALL_DATA_KEY ||
      process.env["CLAVE_DE_DATOS_DE_FÚTBOL"];

    if (!apiKey) {
      return res.status(500).json({
        error: "FOOTBALL_DATA_KEY no configurada"
      });
    }

    const response = await fetch(
      "https://api.football-data.org/v4/matches",
      {
        headers: {
          "X-Auth-Token": apiKey
        }
      }
    );

    const data = await response.json();

    const partidos = data.matches || [];

    const ligasPermitidas = [
      "UEFA Champions League",
      "UEFA Europa League",
      "UEFA Europa Conference League",
      "UEFA Nations League",
      "FIFA World Cup",
      "Serie A",
      "Serie B",
      "Bundesliga",
      "2. Bundesliga",
      "La Liga",
      "LaLiga",
      "LaLiga 2",
      "Premier League",
      "Ligue 1",
      "MLS",
      "Liga MX",
      "J1 League",
      "K League",
      "Allsvenskan",
      "Eliteserien",
      "Veikkausliiga"
    ];

    const picks = [];

    for (const partido of partidos) {

      const liga =
        partido.competition?.name || "";

      const permitida =
        ligasPermitidas.some(l =>
          liga.includes(l)
        );

      if (!permitida) continue;

      const local =
        partido.homeTeam?.name || "Local";

      const visitante =
        partido.awayTeam?.name || "Visitante";

      let confianza = 75;
      let mercado = "Más de 1.5 goles";

      if (
        liga.includes("Champions")
      ) {
        confianza = 85;
      }

      if (
        liga.includes("Premier")
      ) {
        confianza = 83;
      }

      picks.push({
        partido: `${local} vs ${visitante}`,
        liga,
        mercado,
        confianza,
        fecha: new Date()
          .toISOString()
          .split("T")[0],
        resultado: "pendiente",
        promedio: 2.5
      });
    }

    picks.sort(
      (a, b) =>
        b.confianza - a.confianza
    );

    const topPicks =
      picks.slice(0, 8);

    if (topPicks.length > 0) {

      await supabase
        .from("picks")
        .insert(topPicks);
    }

    return res.status(200).json({
      ok: true,
      totalPartidos:
        partidos.length,
      totalPicks:
        topPicks.length,
      picks: topPicks
    });

  } catch (error) {

    return res.status(500).json({
      error: error.message
    });
  }
}
