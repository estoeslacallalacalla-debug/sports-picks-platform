import { supabase } from "../../lib/supabase";

export default async function handler(req, res) {
  try {
    const footballDataKey =
      process.env.FOOTBALL_DATA_KEY ||
      process.env["CLAVE_DE_DATOS_DE_FÚTBOL"];

    if (!footballDataKey) {
      return res.status(500).json({
        error: "FOOTBALL_DATA_KEY no configurada"
      });
    }

    const fecha = new Date()
      .toISOString()
      .split("T")[0];

    const response = await fetch(
      "https://api.football-data.org/v4/matches",
      {
        headers: {
          "X-Auth-Token": footballDataKey
        }
      }
    );

    const fixturesData = await response.json();

    const partidos =
      fixturesData.matches || [];

    const picks = [];

    for (const partido of partidos) {
      const leagueName =
        partido.competition?.name || "Liga";

      const homeName =
        partido.homeTeam?.name || "Local";

      const awayName =
        partido.awayTeam?.name || "Visitante";

      let confianza = 75;
      let mercado = "Over 1.5 goles";

      if (
        leagueName.includes("Friendly") ||
        leagueName.includes("Friendlies")
      ) {
        confianza = 80;
        mercado = "Ambos marcan";
      }

      picks.push({
        liga: leagueName,
        partido: `${homeName} vs ${awayName}`,
        mercado,
        confianza,
        promedio: 2.5,
        fecha,
        resultado: "pendiente"
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
      totalPartidos: partidos.length,
      totalPicks: picks.length,
      picks: topPicks
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
