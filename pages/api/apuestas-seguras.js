import { supabase } from "../../lib/supabase";

const CASAS = ["betfair","william hill","unibet","pinnacle","betsson","coolbet","winamax","betclic","leovegas","codere","bwin","bet365","marathon bet","nordic bet","1xbet"];

const DEPORTES = ["soccer_spain_la_liga","soccer_spain_segunda_division","soccer_epl","soccer_germany_bundesliga","soccer_italy_serie_a","soccer_france_ligue_one","soccer_brazil_campeonato","soccer_argentina_primera_division","soccer_netherlands_eredivisie","soccer_portugal_primeira_liga"];

const MERCADOS = [
  { key: "h2h", nombre: "Resultado 1X2" },
  { key: "totals", nombre: "Goles Over/Under" },
  { key: "btts", nombre: "Ambos Marcan" },
  { key: "double_chance", nombre: "Doble Oportunidad" }
];

export default async function handler(req, res) {
  try {
    const KEY = process.env.ODDS_API_KEY;
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT = process.env.TELEGRAM_CHAT_ID;
    const BANK = 100;

    if (!KEY) return res.status(500).json({ error: "ODDS_API_KEY no configurada" });

    await supabase.from("apuestas_seguras").delete().lt("fecha", new Date(Date.now() - 86400000).toISOString());

    const encontradas = [];
    const debug = { deportes: 0, partidos: 0, casasOk: 0, surebets: 0 };

    for (let i = 0; i < DEPORTES.length; i++) {
      const deporte = DEPORTES[i];
      try {
        const url = "https://api.the-odds-api.com/v4/sports/" + deporte + "/odds/?regions=eu&markets=h2h,totals,btts,double_chance&oddsFormat=decimal&apiKey=" + KEY;
        const r = await fetch(url);
        if (!r.ok) {
          console.log("skip " + deporte + " status=" + r.status);
          continue;
        }
        const lista = await r.json();
        if (!Array.isArray(lista)) continue;

        debug.deportes++;
        debug.partidos += lista.length;

        for (let j = 0; j < lista.length; j++) {
          const match = lista[j];
          if (!match.bookmakers) continue;

          const casasOk = match.bookmakers.filter(function(b) {
            const t = b.title.toLowerCase();
            for (let k = 0; k < CASAS.length; k++) {
              if (t.indexOf(CASAS[k]) !== -1) return true;
            }
            return false;
          });

          if (casasOk.length < 2) continue;
          debug.casasOk++;

          for (let m = 0; m < MERCADOS.length; m++) {
            const mercado = MERCADOS[m];
            const sb = calcularSurebet(casasOk, mercado.key, BANK);
            if (!sb) continue;

            debug.surebets++;
            const nombre = match.home_team + " vs " + match.away_team;
            const hash = (match.home_team + match.away_team + mercado.key).toLowerCase().replace(/\W/g, "");
            const ahora = new Date().toISOString();

            const reg = {
              partido: nombre,
              hash_partido: hash,
              beneficio: sb.pct + "%",
              ganancia: sb.ganancia + "€",
              retorno: sb.retorno + "€",
              fecha: ahora,
              ultima_actualizacion: ahora,
              estado: "activa",
              casa_local: sb.apuestas[0] ? sb.apuestas[0].casa : "",
              cuota_local: sb.apuestas[0] ? sb.apuestas[0].cuota : 0,
              apuesta_local: sb.apuestas[0] ? sb.apuestas[0].stake + "€" : "0€",
              casa_empate: sb.apuestas[1] ? sb.apuestas[1].casa : "",
              cuota_empate: sb.apuestas[1] ? sb.apuestas[1].cuota : 0,
              apuesta_empate: sb.apuestas[1] ? sb.apuestas[1].stake + "€" : "0€",
              casa_visitante: sb.apuestas[2] ? sb.apuestas[2].casa : "",
              cuota_visitante: sb.apuestas[2] ? sb.apuestas[2].cuota : 0,
              apuesta_visitante: sb.apuestas[2] ? sb.apuestas[2].stake + "€" : "0€"
            };

            const { data: existe } = await supabase.from("apuestas_seguras").select("id").eq("hash_partido", hash).limit(1);
            if (existe && existe.length > 0) {
              await supabase.from("apuestas_seguras").update(reg).eq("hash_partido", hash);
            } else {
              await supabase.from("apuestas_seguras").insert([reg]);
            }

            encontradas.push({ nombre, mercado: mercado.nombre, pct: sb.pct });

            let lineas = "";
            for (let a = 0; a < sb.apuestas.length; a++) {
              const ap = sb.apuestas[a];
              lineas += "🏦 *" + ap.casa + "* - " + ap.sel + "\nCuota: " + ap.cuota + " | Apostar: *" + ap.stake + "€*\n\n";
            }

            const msg = "💰 *SUREBET DETECTADA* ⚡\n\n⚽ *" + nombre + "*\n🎯 *" + mercado.nombre + "*\n\n" + lineas + "📈 Beneficio: *" + sb.pct + "%*\n💵 Ganancia/100€: *" + sb.ganancia + "€*\n\n⚠️ Verifica cuotas antes de apostar\n🔗 Sports Picks IA";

            await fetch("https://api.telegram.org/bot" + TOKEN + "/sendMessage", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: CHAT, text: msg, parse_mode: "Markdown" })
            });

            await new Promise(function(r) { setTimeout(r, 500); });
          }
        }
      } catch (err) {
        console.error("error " + deporte + ": " + err.message);
      }
    }

    return res.status(200).json({ ok: true, total: encontradas.length, surebets: encontradas, debug: debug });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function calcularSurebet(casas, mercadoKey, bank) {
  const mejores = {};

  for (let i = 0; i < casas.length; i++) {
    const bm = casas[i];
    const mkt = bm.markets ? bm.markets.filter(function(m) { return m.key === mercadoKey; })[0] : null;
    if (!mkt) continue;

    for (let j = 0; j < mkt.outcomes.length; j++) {
      const o = mkt.outcomes[j];
      const p = parseFloat(o.price);
      if (!p || p <= 1) continue;
      if (!mejores[o.name] || p > mejores[o.name].cuota) {
        mejores[o.name] = { sel: o.name, cuota: p, casa: bm.title };
      }
    }
  }

  const sels = Object.values(mejores);
  if (sels.length < 2) return null;

  const suma = sels.reduce(function(a, s) { return a + 1 / s.cuota; }, 0);
  if (suma >= 1) return null;

  const pct = ((1 - suma) * 100).toFixed(2);
  if (parseFloat(pct) > 5) return null;

  const retorno = (bank / suma).toFixed(2);
  const ganancia = (bank / suma - bank).toFixed(2);

  const apuestas = sels.map(function(s) {
    return { sel: s.sel, cuota: s.cuota, casa: s.casa, stake: ((bank / suma) / s.cuota).toFixed(2) };
  });

  return { pct: pct, retorno: retorno, ganancia: ganancia, apuestas: apuestas };
}
