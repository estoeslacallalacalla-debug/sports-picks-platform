import { supabase } from "../../lib/supabase";

// Solo casas con web para España (se descartan versiones de otros paises y exchanges)
const CASAS = ["bet365", "betfair", "william hill", "betsson", "bwin", "888sport", "betway", "sportium", "codere", "luckia", "retabet", "marca"];

// Cada deporte cuesta 2 creditos por ejecucion (h2h + totals)
const DEPORTES = [
  "soccer_spain_la_liga",
  "soccer_spain_segunda_division",
  "soccer_epl",
  "soccer_germany_bundesliga",
  "soccer_italy_serie_a",
  "soccer_uefa_nations_league"
];

const BANK = 50;
const MIN_BENEFICIO = 0.8;
const MAX_BENEFICIO = 5;
const MAX_AVISOS = 3;
const MAX_EDAD_MIN = 15;
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
      .lt("fecha", new Date(Date.now() - 20 * 3600 * 1000).toISOString());

    const todas = [];
    const debug = { deportes: 0, partidos: 0, conCasas: 0, candidatas: 0, errores: [], creditosRestantes: null };

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
        const casas = (match.bookmakers || []).filter(casaValida);
        if (casas.length < 2) continue;
        debug.conCasas++;

        const nombre = match.home_team + " vs " + match.away_team;
        const candidatas = buscarCandidatas(casas);

        for (const cand of candidatas) {
          const sb = evaluar(cand.sels);
          if (!sb) continue;
          todas.push({
            nombre: nombre,
            mercado: cand.mercado,
            sb: sb,
            hash: (match.id + cand.mercado).toLowerCase().replace(/\W/g, "")
          });
        }
      }

      if (debug.creditosRestantes !== null && debug.creditosRestantes < CREDITOS_MINIMOS) {
        debug.errores.push("Quedan pocos creditos, paro para no agotar el plan");
        break;
      }
    }

    debug.candidatas = todas.length;

    // Surebets ya registradas en las ultimas horas
    const { data: existentes } = await supabase.from("apuestas_seguras").select("hash_partido");
    const hashes = (existentes || []).map(function (x) { return x.hash_partido; });
    const huecos = Math.max(0, MAX_AVISOS - hashes.length);
    const ahora = new Date().toISOString();

    // Actualizar las que ya existian (sin volver a avisar)
    for (const t of todas) {
      if (hashes.indexOf(t.hash) !== -1) {
        await supabase.from("apuestas_seguras").update(crearRegistro(t, ahora)).eq("hash_partido", t.hash);
      }
    }

    // Nuevas: las de mayor beneficio primero, con tope diario
    const nuevas = todas
      .filter(function (t) { return hashes.indexOf(t.hash) === -1; })
      .sort(function (a, b) { return parseFloat(b.sb.beneficio) - parseFloat(a.sb.beneficio); })
      .slice(0, huecos);

    const enviadas = [];

    for (const t of nuevas) {
      await supabase.from("apuestas_seguras").insert([crearRegistro(t, ahora)]);

      let texto = "💰 SUREBET DETECTADA\n\n⚽ " + t.nombre + "\n🎯 " + t.mercado + "\n\n";
      t.sb.apuestas.forEach(function (ap) {
        texto += "🏦 " + ap.casa + " → " + ap.sel + "\nCuota: " + ap.cuota + " | Apostar: " + ap.stake + "€\n\n";
      });
      texto += "📈 Beneficio: " + t.sb.beneficio + "%\n💵 Ganancia sobre " + BANK + "€: " + t.sb.ganancia + "€\n\n⏱ Las cuotas cambian rapido: comprueba las dos antes de apostar";

      await fetch("https://api.telegram.org/bot" + TOKEN + "/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT, text: texto })
      });

      enviadas.push({ partido: t.nombre, mercado: t.mercado, beneficio: t.sb.beneficio });
    }

    return res.status(200).json({ ok: true, total: enviadas.length, surebets: enviadas, debug: debug });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

function casaValida(b) {
  const t = b.title.toLowerCase();
  if (t.indexOf("(") !== -1) return false;
  if ((b.key || "").indexOf("_ex") !== -1) return false;
  return CASAS.some(function (c) { return t.indexOf(c) !== -1; });
}

function fresco(mkt) {
  if (!mkt.last_update) return true;
  const edad = (Date.now() - new Date(mkt.last_update).getTime()) / 60000;
  return edad <= MAX_EDAD_MIN;
}

function crearRegistro(t, ahora) {
  const a = t.sb.apuestas;
  return {
    partido: t.nombre,
    hash_partido: t.hash,
    beneficio: t.sb.beneficio + "%",
    ganancia: t.sb.ganancia + "€",
    retorno: t.sb.retorno + "€",
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
    if (!mkt || !fresco(mkt)) return;
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
  if (beneficio < MIN_BENEFICIO || beneficio > MAX_BENEFICIO) return null;

  return {
    beneficio: beneficio.toFixed(2),
    ganancia: (BANK / suma - BANK).toFixed(2),
    retorno: (BANK / suma).toFixed(2),
    apuestas: sels.map(function (s) {
      return { sel: s.sel, cuota: s.cuota, casa: s.casa, stake: ((BANK / suma) / s.cuota).toFixed(2) };
    })
  };
}
