export default async function handler(req, res) {
  try {
    const apiKey       = process.env.API_FOOTBALL_KEY;
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN; // ← unificado
    const telegramChat  = process.env.TELEGRAM_CHAT_ID || "@sportspicksia2026";

    const response = await fetch(
      "https://v3.football.api-sports.io/fixtures?live=all",
      { headers: { "x-apisports-key": apiKey } }
    );

    const data     = await response.json();
    const partidos = data.response || [];
    const picks    = [];

    for (const partido of partidos) {
      const home = partido.teams.home.name;
      const away = partido.teams.away.name;

      const golesHome = partido.goals.home || 0;
      const golesAway = partido.goals.away || 0;
      const totalGoles = golesHome + golesAway;

      const minuto = partido.fixture.status.elapsed || 0;

      const tirosHome = partido.statistics?.[0]?.statistics
        ?.find(s => s.type === "Total Shots")?.value || 0;
      const tirosAway = partido.statistics?.[1]?.statistics
        ?.find(s => s.type === "Total Shots")?.value || 0;

      const posesionHome = partido.statistics?.[0]?.statistics
        ?.find(s => s.type === "Ball Possession")?.value || "50%";

      let mercado   = "";
      let confianza = 0;
      let razon     = "";

      // Partido vivo con muchos tiros y pocos goles → gol próximo
      if (minuto >= 60 && totalGoles <= 1 && (tirosHome + tirosAway) >= 20) {
        mercado   = "Gol en los próximos minutos";
        confianza = 88;
        razon     = `${tirosHome + tirosAway} tiros totales, solo ${totalGoles} gol(es)`;
      }

      // Over 3.5 live
      if (minuto >= 70 && totalGoles >= 2) {
        mercado   = "Más de 3.5 goles (live)";
        confianza = 87;
        razon     = `Ya van ${totalGoles} goles en el minuto ${minuto}`;
      }

      // Ambos ya marcaron
      if (golesHome >= 1 && golesAway >= 1 && minuto < 80) {
        mercado   = "Ambos equipos marcan ✅ (ya confirmado)";
        confianza = 99;
        razon     = `${home} ${golesHome} - ${golesAway} ${away}`;
      }

      // Equipo dominante pero sin gol → gol local
      if (minuto >= 55 && golesHome === 0 && parseInt(posesionHome) >= 65 && tirosHome >= 12) {
        mercado   = `Gol de ${home} (live)`;
        confianza = 82;
        razon     = `${posesionHome} posesión y ${tirosHome} tiros sin marcar`;
      }

      if (confianza >= 82) {
        const pick = { partido: `${home} vs ${away}`, minuto, mercado, confianza, razon };
        picks.push(pick);

        const mensaje =
`🔴 *PICK EN VIVO* ⚡

⚽ *${pick.partido}*
⏱️ Minuto: *${pick.minuto}'*

🎯 *${pick.mercado}*
📊 Confianza: *${pick.confianza}%*
💡 _${pick.razon}_

🔗 Sports Picks IA`;

        await fetch(
          `https://api.telegram.org/bot${telegramToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id:    telegramChat,
              text:       mensaje,
              parse_mode: "Markdown"
            })
          }
        );
      }
    }

    res.status(200).json({ total: picks.length, picks });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
