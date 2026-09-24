
import { supabase } from "../../lib/supabase";

const CASAS_CONOCIDAS = [
  "bet365", "betfair", "william hill", "codere",
  "bwin", "unibet", "betsson", "pinnacle",
  "marathon bet", "betclic", "winamax",
  "leovegas", "coolbet", "888sport", "betway",
  "sportium", "1xbet", "nordicsbet", "nordic bet"
];

const MERCADOS = [
  { key: "h2h",           nombre: "Resultado (1X2)"  },
  { key: "totals",        nombre: "Goles Over/Under" },
  { key: "btts",          nombre: "Ambos Marcan"     },
  { key: "double_chance", nombre: "Doble Oportunidad"},
];

const DEPORTES_ODDS = [
  "soccer_spain_la_liga",
  "soccer_spain_segunda_division",
  "soccer_epl",
  "soccer_germany_bundesliga",
  "soccer_italy_serie_a",
  "soccer_france_ligue_one",
  "soccer_brazil_campeonato",
  "soccer_argentina_primera_division",
  "soccer_netherlands_eredivisie",
  "soccer_portugal_primeira_liga",
];

export default async function handler(req, res) {
  try {
    await supabase
      .from("apuestas_seguras")
      .delete()
      .lt("fecha", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const oddsApiKey    = process.env.ODDS_API_KEY;
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChat  = process.env.TELEGRAM_CHAT_ID || "@sportspicksia2026";
    const bankroll      = 100;

    const surebetsEncontradas = [];
    const debug = { deportes: 0, partidos: 0, conMinimoCasas: 0, surebetsDetectadas: 0 };
    const mercadosQuery = MERCADOS.map(m => m.key).join(",");

    for (const deporte of DEPORTES_ODDS) {
      try {
        const response = await fetch(
          "https://api.the-odds-api.com/v4/sports/" + deporte + "/odds/?regions=eu&markets=" + mercadosQuery + "&oddsFormat=decimal&apiKey=" + oddsApiKey
        );

        if (!response.ok) continue;

        const partidos = await response.json();
        if (!Array.isArray(partidos)) continue;

        debug.deportes++;
        debug.partidos += partidos.length;

        for (const match of partidos) {
          if (!match.bookmakers || match.bookmakers.length === 0) continue;

          const nombrePartido = match.home_team + " vs " + match.away_team;

          // Filtrar casas conocidas
          const casasValidas = match.bookmakers.filter(b =>
            CASAS_CONOCIDAS.some(c => b.title.toLowerCase().includes(c))
          );

          // Necesitamos al menos 2 casas para comparar
          if (casasValidas.length < 2) continue;
          debug.conMinimoCasas++;

          for (const mercado of MERCADOS) {
            const surebet = detectarSurebet(casasValidas, mercado, bankroll);
            if (!surebet) continue;

            debug.surebetsDetectadas++;

            const hashPartido = (match.home_team + "-" + match.away_team + "-" + mercado.key)
              .toLowerCase().replace(/\s/g, "");
            const fechaISO = new Date().toISOString();

            const registro = {
              partido:              nombrePartido,
              hash_partido:         hashPartido,
              beneficio:            surebet.beneficioPct + "%",
              ganancia:             surebet.ganancia + "€",
              retorno:              surebet.retorno + "€",
              fecha:                fechaISO,
              ultima_actualizacion: fechaISO,
              estado:               "activa",
              casa_local:           surebet.apuestas[0] ? surebet.apuestas[0].casa : "",
              cuota_local:          surebet.apuestas[0] ? surebet.apuestas[0].cuota : 0,
              apuesta_local:        surebet.apuestas[0] ? surebet.apuestas[0].stake + "€" : "0€",
              casa_empate:          surebet.apuestas[1] ? surebet.apuestas[1].casa : "",
              cuota_empate:         surebet.apuestas[1] ? surebet.apuestas[1].cuota : 0,
              apuesta_empate:       surebet.apuestas[1] ? surebet.apuestas[1].stake + "€" : "0€",
              casa_visitante:       surebet.apuestas[2] ? surebet.apuestas[2].casa : "",
              cuota_visitante:      surebet.apuestas[2] ? surebet.apuestas[2].cuota : 0,
              apuesta_visitante:    surebet.apuestas[2] ? surebet.apuestas[2].stake + "€" : "0€",
            };

            const { data: existente } = await supabase
              .from("apuestas_seguras")
              .select("id")
              .eq("hash_partido", hashPartido)
              .limit(1);

            if (existente && existente.length > 0) {
              await supabase.from("apuestas_seguras").update(registro).eq("hash_partido", hashPartido);
            } else {
              await supabase.from("apuestas_seguras").insert([registro]);
            }

            surebetsEncontradas.push({
              nombrePartido,
              mercado: mercado.nombre,
              beneficioPct: surebet.beneficioPct
            });

            const lineas = surebet.apuestas.map(a =>
              "🏦 *" + a.casa + "* → " + a.seleccion + "\nCuota: " + a.cuota + " | Apostar: *" + a.stake + "€*"
            ).join("\n\n");

            const mensaje = "💰 *SUREBET DETECTADA* ⚡\n\n" +
              "⚽ *" + nombrePartido + "*\n" +
              "🎯 Mercado: *" + mercado.nombre + "*\n\n" +
              lineas + "\n\n" +
              "━━━━━━━━━━━━━━━━\n" +
              "📈 Beneficio: *" + surebet.beneficioPct + "%*\n" +
              "💵 Ganancia sobre 100€: *" + surebet.ganancia + "€*\n\n" +
              "⚠️ _Verifica las cuotas antes de apostar_\n" +
              "🔗 Sports Picks IA";

            await fetch("https://api.telegram.org/bot" + telegramToken + "/sendMessage", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: telegramChat, text: mensaje, parse_mode: "Markdown" })
            });

            await sleep(500);
          }
        }
      } catch (err) {
        console.error("Error deporte " + deporte + ":", err.message);
      }
    }

    return res.status(200).json({ ok: true, total: surebetsEncontradas.length, surebets: surebetsEncontradas, debug });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

function detectarSurebet(casas, mercado, bankroll) {
  const mejores = {};

  for (const bookmaker of casas) {
    const mkt = bookmaker.markets ? bookmaker.markets.find(function(m) { return m.key === mercado.key; }) : null;
    if (!mkt) continue;

    for (const outcome of mkt.outcomes) {
      const sel   = outcome.name;
      const price = parseFloat(outcome.price);
      if (!price || price <= 1) continue;

      if (!mejores[sel] || price > mejores[sel].cuota) {
        mejores[sel] = { seleccion: sel, cuota: price, casa: bookmaker.title };
      }
    }
  }

  const selecciones = Object.values(mejores);
  if (selecciones.length < 2) return null;

  const suma = selecciones.reduce(function(acc, s) { return acc + 1 / s.cuota; }, 0);
  if (suma >= 1) return null;

  const beneficioPct = ((1 - suma) * 100).toFixed(2);
  if (parseFloat(beneficioPct) > 5) return null;

  const retorno = (bankroll / suma).toFixed(2);
  const ganancia = (bankroll / suma - bankroll).toFixed(2);

  const apuestas = selecciones.map(function(s) {
    return {
      seleccion: s.seleccion,
      cuota: s.cuota,
      casa: s.casa,
      stake: ((bankroll / suma) / s.cuota).toFixed(2)
    };
  });

  return { beneficioPct, retorno, ganancia, apuestas };
}

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }
