import { supabase } from "../../lib/supabase";
const CASAS_ESPANA = [
  "bet365", "betfair", "william hill", "codere",
  "bwin", "sportium", "888sport", "betway",
  "retabet", "luckia", "interwetten",
  "unibet", "betsson", "pinnacle", "marathon bet",
  "betclic", "winamax", "leovegas", "coolbet"
];
const MERCADOS = [
  { key: "h2h",           nombre: "Resultado (1X2)"     },
  { key: "totals",        nombre: "Goles Over/Under"    },
  { key: "btts",          nombre: "Ambos Marcan"        },
  { key: "double_chance", nombre: "Doble Oportunidad"   },
];
// Códigos correctos de the-odds-api para fútbol
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
    const mercadosQuery = MERCADOS.map(m => m.key).join(",");
    for (const deporte of DEPORTES_ODDS) {
      try {
        const response = await fetch(
          `https://api.the-odds-api.com/v4/sports/${deporte}/odds/?regions=eu&markets=${mercadosQuery}&oddsFormat=decimal&apiKey=${oddsApiKey}`
        );
        if (!response.ok) {
          console.log(`Deporte ${deporte} no disponible (${response.status})`);
          continue;
        }
        const partidos = await response.json();
        if (!Array.isArray(partidos)) continue;
        for (const match of partidos) {
          if (!match.bookmakers || match.bookmakers.length < 2) continue;
          const nombrePartido = `${match.home_team} vs ${match.away_team}`;
          const casasValidas = match.bookmakers.filter(b =>
            CASAS_ESPANA.some(c => b.title.toLowerCase().includes(c))
          );
          if (casasValidas.length < 2) continue;
          for (const mercado of MERCADOS) {
            const surebet = detectarSurebetMercado(casasValidas, mercado, bankroll);
            if (!surebet) continue;
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
✅ Casas con licencia en España
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
      } catch (err) {
        console.error(`Error deporte ${deporte}:`, err.message);
      }
    }
    return res.status(200).json({ ok: true, total: surebetsEncontradas.length, surebets: surebetsEncontradas });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
function detectarSurebetMercado(casas, mercado, bankroll) {
  const mejoresPorSeleccion = {};
  for (const bookmaker of casas) {
    const mkt = bookmaker.markets?.find(m => m.key === mercado.key);
    if (!mkt) continue;
    for (const outcome of mkt.outcomes) {
      const sel   = outcome.name;
      const price = parseFloat(outcome.price);
      if (!price || price <= 1) continue;

      if (!mejoresPorSeleccion[sel] || price > mejoresPorSeleccion[sel].cuota) {
        mejoresPorSeleccion[sel] = { seleccion: sel, cuota: price, casa: bookmaker.title };
      }
    }
  }

  const selecciones = Object.values(mejoresPorSeleccion);
  if (selecciones.length < 2) return null;

  const sumaImplicitas = selecciones.reduce((acc, s) => acc + 1 / s.cuota, 0);
  if (sumaImplicitas >= 1) return null;

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
