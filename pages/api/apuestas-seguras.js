import { supabase } from "../../lib/supabase";

export default async function handler(req, res) {
  try {
    // Limpiar surebets de más de 24h
    await supabase
      .from("apuestas_seguras")
      .delete()
      .lt("fecha", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const oddsApiKey     = process.env.ODDS_API_KEY;
    const telegramToken  = process.env.TELEGRAM_BOT_TOKEN; // ← unificado
    const telegramChat   = process.env.TELEGRAM_CHAT_ID || "@sportspicksia2026";
    const bankroll       = 100;

    // Deportes a monitorizar (fútbol masculino y femenino)
    const deportes = [
      "soccer",
    ];

    const surebets = [];

    for (const deporte of deportes) {
      const response = await fetch(
        `https://api.the-odds-api.com/v4/sports/${deporte}/odds/?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=${oddsApiKey}`
      );

      if (!response.ok) {
        console.error(`Error Odds API: ${response.status}`);
        continue;
      }

      const partidos = await response.json();
      if (!Array.isArray(partidos)) continue;

      for (const match of partidos) {
        if (!match.bookmakers || match.bookmakers.length < 2) continue;

        // Solo casas conocidas
        const casasPermitidas = [
          "bet365", "betfair", "william hill", "bwin",
          "unibet", "1xbet", "pinnacle", "betway", "marathonbet"
        ];

        const bookmakersFiltrados = match.bookmakers.filter(b =>
          casasPermitidas.some(c => b.title.toLowerCase().includes(c))
        );

        if (bookmakersFiltrados.length < 2) continue;

        let bestHome = { price: 0, bookie: "" };
        let bestDraw = { price: 0, bookie: "" };
        let bestAway = { price: 0, bookie: "" };

        for (const bookmaker of bookmakersFiltrados) {
          const market = bookmaker.markets?.find(m => m.key === "h2h");
          if (!market) continue;

          for (const outcome of market.outcomes) {
            if (outcome.name === match.home_team && outcome.price > bestHome.price) {
              bestHome = { price: outcome.price, bookie: bookmaker.title };
            } else if (outcome.name === "Draw" && outcome.price > bestDraw.price) {
              bestDraw = { price: outcome.price, bookie: bookmaker.title };
            } else if (outcome.name === match.away_team && outcome.price > bestAway.price) {
              bestAway = { price: outcome.price, bookie: bookmaker.title };
            }
          }
        }

        // Necesitamos las 3 cuotas
        if (bestHome.price <= 1 || bestDraw.price <= 1 || bestAway.price <= 1) continue;

        // CORRECCIÓN CLAVE: total < 1 para que sea surebet real
        const total =
          (1 / bestHome.price) +
          (1 / bestDraw.price) +
          (1 / bestAway.price);

        if (total >= 1) continue; // ← corregido de < 2 a >= 1

        // Calcular distribución óptima
        const beneficioPct = ((1 - total) * 100).toFixed(2);
        const retorno      = (bankroll / total).toFixed(2);
        const ganancia     = (bankroll / total - bankroll).toFixed(2);

        // Apuesta óptima para cada resultado
        const apuestaHome = ((bankroll / total) / bestHome.price).toFixed(2);
        const apuestaDraw = ((bankroll / total) / bestDraw.price).toFixed(2);
        const apuestaAway = ((bankroll / total) / bestAway.price).toFixed(2);

        const nombrePartido = `${match.home_team} vs ${match.away_team}`;
        const hashPartido   = `${match.home_team}-${match.away_team}`.toLowerCase().replace(/\s/g, "");
        const fechaISO      = new Date().toISOString();

        // Guardar o actualizar en Supabase
        const { data: existente } = await supabase
          .from("apuestas_seguras")
          .select("id")
          .eq("hash_partido", hashPartido)
          .limit(1);

        const registro = {
          partido:              nombrePartido,
          hash_partido:         hashPartido,
          beneficio:            `${beneficioPct}%`,
          ganancia:             `${ganancia}€`,
          retorno:              `${retorno}€`,
          fecha:                fechaISO,
          ultima_actualizacion: fechaISO,
          estado:               "activa",
          casa_local:           bestHome.bookie,
          cuota_local:          bestHome.price,
          apuesta_local:        `${apuestaHome}€`,
          casa_empate:          bestDraw.bookie,
          cuota_empate:         bestDraw.price,
          apuesta_empate:       `${apuestaDraw}€`,
          casa_visitante:       bestAway.bookie,
          cuota_visitante:      bestAway.price,
          apuesta_visitante:    `${apuestaAway}€`,
        };

        if (existente && existente.length > 0) {
          await supabase
            .from("apuestas_seguras")
            .update(registro)
            .eq("hash_partido", hashPartido);
        } else {
          await supabase
            .from("apuestas_seguras")
            .insert([registro]);
        }

        surebets.push({ nombrePartido, beneficioPct, ganancia });

        // Enviar a Telegram si el beneficio es >= 0.5% (real, no 1.5%)
        if (parseFloat(beneficioPct) >= 0.5) {
          const mensaje =
`🔥 *SUREBET DETECTADA* ⚡

⚽ *${nombrePartido}*

━━━━━━━━━━━━━━━━
🏠 *LOCAL*
Casa: ${bestHome.bookie}
Cuota: ${bestHome.price}
💰 Apostar: *${apuestaHome}€*

🤝 *EMPATE*
Casa: ${bestDraw.bookie}
Cuota: ${bestDraw.price}
💰 Apostar: *${apuestaDraw}€*

✈️ *VISITANTE*
Casa: ${bestAway.bookie}
Cuota: ${bestAway.price}
💰 Apostar: *${apuestaAway}€*

━━━━━━━━━━━━━━━━
📈 Beneficio: *${beneficioPct}%*
💵 Ganancia sobre 100€: *${ganancia}€*

⚠️ _Verifica las cuotas antes de apostar_
🔗 Sports Picks IA`;

          await fetch(
            `https://api.telegram.org/bot${telegramToken}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: telegramChat,
                text: mensaje,
                parse_mode: "Markdown"
              })
            }
          );
        }
      }
    }

    return res.status(200).json({ ok: true, total: surebets.length, surebets });

  } catch (error) {
    console.error("Error apuestas-seguras:", error);
    return res.status(500).json({ error: error.message });
  }
}
