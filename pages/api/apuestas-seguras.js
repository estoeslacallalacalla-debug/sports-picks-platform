import { supabase } from "../../lib/supabase";

// ─── CASAS CON LICENCIA EN ESPAÑA ────────────────────────────────────────────
// Solo estas casas operan legalmente en España
const CASAS_ESPANA = [
  "bet365",
  "betfair",
  "william hill",
  "codere",
  "bwin",
  "sportium",
  "888sport",
  "betway",
  "marca apuestas",
  "retabet",
  "luckia",
  "interwetten",
];

// ─── MERCADOS A ANALIZAR ──────────────────────────────────────────────────────
const MERCADOS = [
  { key: "h2h",           nombre: "Resultado (1X2)",        tipo: "3way"  },
  { key: "totals",        nombre: "Goles Over/Under",       tipo: "2way"  },
  { key: "btts",          nombre: "Ambos Marcan",           tipo: "2way"  },
  { key: "double_chance", nombre: "Doble Oportunidad",      tipo: "2way"  },
];

export default async function handler(req, res) {
  try {
    // Limpiar surebets de más de 24h
    await supabase
      .from("apuestas_seguras")
      .delete()
      .lt("fecha", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const oddsApiKey    = process.env.ODDS_API_KEY;
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChat  = process.env.TELEGRAM_CHAT_ID || "@sportspicksia2026";
    const bankroll      = 100;

    const surebetsEncontradas = [];
    const mercadosQuery = MERCADOS.map(m => m.key).join(",");

    // Obtener cuotas de fútbol con todos los mercados
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/soccer/odds/?regions=eu&markets=${mercadosQuery}&oddsFormat=decimal&apiKey=${oddsApiKey}`
    );

    if (!response.ok) {
      return res.status(500).json({ error: `Odds API error: ${response.status}` });
    }

    const partidos = await response.json();
    if (!Array.isArray(partidos)) {
      return res.status(500).json({ error: "Respuesta inválida de Odds API" });
    }

    for (const match of partidos) {
      if (!match.bookmakers || match.bookmakers.length < 2) continue;

      const nombrePartido = `${match.home_team} vs ${match.away_team}`;

      // Filtrar solo casas con licencia española
      const casasValidas = match.bookmakers.filter(b =>
        CASAS_ESPANA.some(c => b.title.toLowerCase().includes(c))
      );

      if (casasValidas.length < 2) continue;

      // Analizar cada mercado por separado
      for (const mercado of MERCADOS) {
        const surebet = detectarSurebetMercado(
          casasValidas, mercado, match, bankroll, nombrePartido
        );

        if (!surebet) continue;

        // Guardar en Supabase
        const hashPartido = `${match.home_team}-${match.away_team}-${mercado.key}`
          .toLowerCase().replace(/\s/g, "");
        const fechaISO = new Date().toISOString();

        const { data: existente } = await supabase
          .from("apuestas_seguras")
          .select("id")
          .eq("hash_partido", hashPartido)
          .limit(1);

        const registro = {
          partido:              nombrePartido,
          hash_partido:         hashPartido,
          beneficio:            `${surebet.beneficioPct}%`,
          ganancia:             `${surebet.ganancia}€`,
          retorno:              `${surebet.retorno}€`,
          fecha:                fechaISO,
          ultima_actualizacion: fechaISO,
          estado:               "activa",
          casa_local:           surebet.apuestas[0]?.casa || "",
          cuota_local:          surebet.apuestas[0]?.cuota || 0,
          apuesta_local:        `${surebet.apuestas[0]?.stake || 0}€`,
          casa_empate:          surebet.apuestas[1]?.casa || "",
          cuota_empate:         surebet.apuestas[1]?.cuota || 0,
          apuesta_empate:       `${surebet.apuestas[1]?.stake || 0}€`,
          casa_visitante:       surebet.apuestas[2]?.casa || "",
          cuota_visitante:      surebet.apuestas[2]?.cuota || 0,
          apuesta_visitante:    `${surebet.apuestas[2]?.stake || 0}€`,
        };

        if (existente && existente.length > 0) {
          await supabase.from("apuestas_seguras").update(registro).eq("hash_partido", hashPartido);
        } else {
          await supabase.from("apuestas_seguras").insert([registro]);
        }

        surebetsEncontradas.push({ nombrePartido, mercado: mercado.nombre, beneficioPct: surebet.beneficioPct });

        // Enviar a Telegram
        const lineasApuestas = surebet.apuestas.map(a =>
          `🏦 *${a.casa}* → ${a.seleccion}\nCuota: ${a.cuota} | Apostar: *${a.stake}€*`
        ).join("\n\n");

        const mensaje =
`💰 *SUREBET DETECTADA* ⚡

⚽ *${nombrePartido}*
🎯 Mercado: *${mercado.nombre}*

${lineasApuestas}

━━━━━━━━━━━━━━━━
📈 Beneficio: *${surebet.beneficioPct}%*
💵 Ganancia sobre 100€: *${surebet.ganancia}€*
✅ Solo casas con licencia en España

⚠️ _Verifica las cuotas antes de apostar_
🔗 Sports Picks IA`;

        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: telegramChat, text: mensaje, parse_mode: "Markdown" })
        });

        await sleep(500);
      }
    }

    return res.status(200).json({ ok: true, total: surebetsEncontradas.length, surebets: surebetsEncontradas });

  } catch (error) {
    console.error("Error apuestas-seguras:", error);
    return res.status(500).json({ error: error.message });
  }
}

// ─── DETECTAR SUREBET EN UN MERCADO ──────────────────────────────────────────

function detectarSurebetMercado(casas, mercado, match, bankroll, nombrePartido) {
  // Recoger las mejores cuotas por selección entre todas las casas
  const mejoresPorSeleccion = {};

  for (const bookmaker of casas) {
    const mkt = bookmaker.markets?.find(m => m.key === mercado.key);
    if (!mkt) continue;

    for (const outcome of mkt.outcomes) {
      const sel = outcome.name;
      const price = parseFloat(outcome.price);
      if (!price || price <= 1) continue;

      if (!mejoresPorSeleccion[sel] || price > mejoresPorSeleccion[sel].cuota) {
        mejoresPorSeleccion[sel] = {
          seleccion: sel,
          cuota: price,
          casa: bookmaker.title
        };
      }
    }
  }

  const selecciones = Object.values(mejoresPorSeleccion);
  if (selecciones.length < 2) return null;

  // Calcular margen total
  const sumaImplicitas = selecciones.reduce((acc, s) => acc + 1 / s.cuota, 0);

  // Solo es surebet si el margen es < 1 (probabilidades suman menos del 100%)
  if (sumaImplicitas >= 1) return null;

  // Límite de beneficio realista: max 5% para evitar datos erróneos
  const beneficioPct = ((1 - sumaImplicitas) * 100).toFixed(2);
  if (parseFloat(beneficioPct) > 5) return null;

  const retorno = (bankroll / sumaImplicitas).toFixed(2);
  const ganancia = (bankroll / sumaImplicitas - bankroll).toFixed(2);

  const apuestas = selecciones.map(s => ({
    seleccion: s.seleccion,
    cuota: s.cuota,
    casa: s.casa,
    stake: ((bankroll / sumaImplicitas) / s.cuota).toFixed(2)
  }));

  return { beneficioPct, retorno, ganancia, apuestas };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
