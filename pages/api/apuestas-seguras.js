import { supabase } from "../../lib/supabase";

const CASAS = ["betfair", "william hill", "unibet", "pinnacle", "betsson", "coolbet", "winamax", "betclic", "leovegas", "codere", "bwin", "bet365", "marathon bet", "nordic bet", "1xbet"];

// Cada deporte cuesta 2 creditos por ejecucion (h2h + totals)
const DEPORTES = [
  "soccer_spain_la_liga",
  "soccer_spain_segunda_division",
  "soccer_epl",
  "soccer_germany_bundesliga",
  "soccer_italy_serie_a",
  "soccer_uefa_nations_league"
];

const BANK = 100;
const MAX_BENEFICIO = 5;
const CREDITOS_MINIMOS = 30;

export default async function handler(req, res) {
  try {
    const KEY = process.env.ODDS_API_KEY;
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT = process.env.TELEGRAM_CHAT_ID || "@sportspicksia2026";

    if (!KEY) return res.status(500).json({ error: "ODDS_API_KEY no configurada" });

    await supabase
      .from("apuestas_seguras")
      .delete()
      .lt("fecha", new Date(Date.now() - 86400000).toISOString());

    const encontradas = [];
    const debug = { deportes: 0, partidos: 0, conCasas: 0, errores: [], creditosRestantes: null };

    for (const deporte of DEPORTES) {
      const url = "https://api.the-odds-api.com/v4/sports/" + deporte + "/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=" + KEY;
      const r = await fetch(url);

      const restantes = r.headers.get("x-requests-remaining");
      if (restantes !== null) debug.creditosRestantes = Number(restantes);

      if (!r.ok) {
        debug.errores.push(deporte + ": HTTP " + r.status);
        continue;
      }

      const lista = await r.json();
      if (!Array.isArray(lista)) continue;

      debug.deportes++;
      debug.partidos += lista.length;

      for (const match of lista) {
        const casas = (match.bookmakers || []).filter(function (b) {
          const t = b.title.toLowerCase();
          return CASAS.some(function (c) { return t.indexOf(c) !== -1; });
        });
        if (casas.length < 2) continue;
        debug.conCasas++;

        const nombre = match.home_team + " vs " + match.away_team;
        const candidatas = buscarCandidatas(casas);

        for (const cand of candidatas) {
          const sb = evaluar(cand.sels);
          if (!sb) continue;

          const hash = (match.id + cand.mercado).toLowerCase().replace(/\W/g, "");
          const ahora = new Date().toISOString();
          const a = sb.apuestas;

          const registro = {
            partido: nombre,
            hash_partido: hash,
            beneficio: sb.beneficio + "%",
            ganancia: sb.ganancia + "€",
            retorno: sb.retorno + "€",
            fecha: ahora,
            ultima_actualizacion: ahora,
            estado: "activa",
            casa_local: a[0] ? a[0].casa : "",
            cuota_local: a[0] ? a[0].cuota : 0,
            apuesta_local: a[0] ? a[0].stake + "€" : "0€",
            casa_empate: a[1] ? a[1].casa : "",
            cuota_empate: a[1] ? a[1].cuota : 0,
            apuesta_empate: a[1] ? a[1].stake + "€" : "0€",
            casa_visitante: a[2] ? a[2].casa : "",
            cuota_visitante: a[2] ? a[2].cuota : 0,
            apuesta_visitante: a[2] ? a[2].stake + "€" : "0€"
          };

          encontradas.push({ partido: nombre, mercado: cand.mercado, beneficio: sb.beneficio });

          const { data: existe } = await supabase
            .from("apuestas_seguras")
            .select("id")
            .eq("hash_partido", hash)
            .limit(1);

          if (existe && existe.length > 0) {
            await supabase.from("apuestas_seguras").update(registro).eq("hash_partido", hash);
            continue;
          }

          await supabase.from("apuestas_seguras").insert([registro]);

          let texto = "💰 SUREBET DETECTADA\n\n⚽ " + nombre + "\n🎯 " + cand.mercado + "\n\n";
          a.forEach(function (ap) {
            texto += "🏦 " + ap.casa + " → " + ap.sel + "\nCuota: " + ap.cuota + " | Apostar: " + ap.stake + "€\n\n";
          });
          texto += "📈 Beneficio: " + sb.beneficio + "%\n💵 Ganancia sobre 100€: " + sb.ganancia + "€\n\n⚠️ Verifica las cuotas antes de apostar";

          await fetch("https://api.telegram.org/bot" + TOKEN + "/sendMessage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: CHAT, text: texto })
          });
        }
      }

      if (debug.creditosRestantes !== null && debug.creditosRestantes < CREDITOS_MINIMOS) {
        debug.errores.push("Quedan pocos creditos, paro para no agotar el plan");
        break;
      }
    }

    return res.status(200).json({ ok: true, total: encontradas.length, surebets: encontradas, debug: debug });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

function buscarCandidatas(casas) {
  const out = [];

  const h2h = mejoresCuotas(casas, "h2h");
  const sels1x2 = Object.keys(h2h).map(function (k) { return h2h[k]; });
  if (sels1x2.length === 3) out.push({ mercado: "Resultado 1X2", sels: sels1x2 });

  const tot = mejoresCuotas(casas, "totals");
  const lineas = {};
  Object.keys(tot).forEach(function (k) { lineas[tot[k].punto] = true; });
  Object.keys(lineas).forEach(function (p) {
    const over = tot["Over " + p];
    const under = tot["Under " + p];
    if (over && under) out.push({ mercado: "Goles Over/Under " + p, sels: [over, under] });
  });

  return out;
}

function mejoresCuotas(casas, key) {
  const mejores = {};
  casas.forEach(function (b) {
    const mkt = (b.markets || []).find(function (m) { return m.key === key; });
    if (!mkt) return;
    mkt.outcomes.forEach(function (o) {
      const precio = parseFloat(o.price);
      if (!precio || precio <= 1) return;
      const punto = o.point !== undefined ? String(o.point) : "";
      const clave = punto ? o.name + " " + punto : o.name;
      if (!mejores[clave] || precio > mejores[clave].cuota) {
        mejores[clave] = { sel: clave, cuota: precio, casa: b.title, punto: punto };
      }
    });
  });
  return mejores;
}

function evaluar(sels) {
  const suma = sels.reduce(function (acc, s) { return acc + 1 / s.cuota; }, 0);
  if (suma >= 1) return null;

  const beneficio = (1 / suma - 1) * 100;
  if (beneficio > MAX_BENEFICIO) return null;

  return {
    beneficio: beneficio.toFixed(2),
    ganancia: (BANK / suma - BANK).toFixed(2),
    retorno: (BANK / suma).toFixed(2),
    apuestas: sels.map(function (s) {
      return { sel: s.sel, cuota: s.cuota, casa: s.casa, stake: ((BANK / suma) / s.cuota).toFixed(2) };
    })
  };
}
