import { supabase } from "../../lib/supabase";

const COMPETICIONES = ["PL", "PD", "BL1", "SA", "FL1", "DED", "PPL", "ELC", "BSA", "CL"];

export default async function handler(req, res) {
  try {
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChat  = process.env.TELEGRAM_CHAT_ID || "@sportspicksia2026";
    const apiKey        = process.env.FOOTBALL_DATA_KEY;

    const hoy     = new Date().toISOString().split("T")[0];
    const hace28h = new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString().split("T")[0];

    // 1. Picks pendientes de ayer y hoy
    const { data: pendientes } = await supabase
      .from("picks")
      .select("*")
      .eq("resultado", "pendiente")
      .gte("fecha", hace28h)
      .lte("fecha", hoy);

    // 2. Buscar partidos terminados (una sola búsqueda por liga)
    if (pendientes && pendientes.length > 0) {
      const terminados = [];

      for (const comp of COMPETICIONES) {
        try {
          const r = await fetch(
            "https://api.football-data.org/v4/competitions/" + comp + "/matches?dateFrom=" + hace28h + "&dateTo=" + hoy + "&status=FINISHED",
            { headers: { "X-Auth-Token": apiKey } }
          );
          if (r.ok) {
            const data = await r.json();
            for (const m of (data.matches || [])) terminados.push(m);
          }
        } catch (e) {}
        await sleep(6500);
      }

      for (const pick of pendientes) {
        const partido = encontrarPartido(terminados, pick.partido);
        if (!partido) continue;

        const gL = partido.score && partido.score.fullTime ? partido.score.fullTime.home : null;
        const gV = partido.score && partido.score.fullTime ? partido.score.fullTime.away : null;
        if (gL === null || gV === null) continue;

        const acierto = evaluarMercado(pick.mercado, gL, gV);
        if (acierto === null) continue;

        await supabase
          .from("picks")
          .update({ resultado: acierto ? "acierto" : "fallo" })
          .eq("id", pick.id);
      }
    }

    // 3. Leer solo picks con resultado real
    const { data: picks, error } = await supabase
      .from("picks")
      .select("*")
      .gte("fecha", hace28h)
      .in("resultado", ["acierto", "fallo"])
      .order("confianza", { ascending: false });

    if (error) return res.status(500).json({ error: error });

    const aciertos = picks.filter(function (p) { return p.resultado === "acierto"; }).length;
    const fallos   = picks.filter(function (p) { return p.resultado === "fallo"; }).length;
    const total    = aciertos + fallos;
    const winrate  = total > 0 ? ((aciertos / total) * 100).toFixed(0) + "%" : "—";

    const lista = picks.slice(0, 10).map(function (p) {
      return (p.resultado === "acierto" ? "✅ " : "❌ ") + p.partido + " — " + p.mercado + " (" + p.confianza + "%)";
    }).join("\n");

    let mensaje;
    if (total === 0) {
      mensaje = "📊 RESUMEN DEL DÍA\n📅 " + hoy + "\n\nNo hay picks con resultado final todavía.\n🔥 Sports Picks IA";
    } else {
      mensaje = "📊 RESUMEN DEL DÍA\n📅 " + hoy + "\n\n✅ Aciertos: " + aciertos + "\n❌ Fallos: " + fallos + "\n📈 Winrate: " + winrate + "\n\n📋 Picks jugados:\n" + lista + "\n\n🔥 Sports Picks IA";
    }

    await fetch("https://api.telegram.org/bot" + telegramToken + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: telegramChat, text: mensaje })
    });

    return res.status(200).json({ ok: true, aciertos: aciertos, fallos: fallos, winrate: winrate });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

function limpiar(texto) {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bfc\b|\bac\b|\bsc\b|\bcd\b|\bsv\b/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function encontrarPartido(partidos, nombrePick) {
  const pickL = limpiar(nombrePick);

  for (const p of partidos) {
    const api = limpiar(p.homeTeam.name + " vs " + p.awayTeam.name);
    if (api === pickL) return p;
  }

  const palabras = pickL.split(" ").filter(function (w) { return w.length > 3; });
  if (palabras.length === 0) return null;

  let mejor = null;
  let mejorPts = 0;
  for (const p of partidos) {
    const api = limpiar(p.homeTeam.name + " vs " + p.awayTeam.name).split(" ");
    const pts = palabras.filter(function (w) { return api.indexOf(w) !== -1; }).length / palabras.length;
    if (pts > mejorPts && pts >= 0.6) { mejorPts = pts; mejor = p; }
  }
  return mejor;
}

function evaluarMercado(mercado, gL, gV) {
  const total = gL + gV;
  const m = (mercado || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const g = m.match(/(mas|menos) de (\d+(\.\d+)?) goles/);
  if (g) {
    const linea = parseFloat(g[2]);
    return g[1] === "mas" ? total > linea : total < linea;
  }

  if (m.indexOf("ambos") !== -1) return gL > 0 && gV > 0;
  if (m.indexOf("1x") !== -1) return gL >= gV;
  if (m.indexOf("x2") !== -1) return gV >= gL;
  if (m.indexOf("victoria local") !== -1) return gL > gV;
  if (m.indexOf("victoria visitante") !== -1) return gV > gL;
  if (m.indexOf("empate") !== -1) return gL === gV;

  return null; // tarjetas y corners no se pueden comprobar con tu API
}

function sleep(ms) { return new Promise(function (r) { return setTimeout(r, ms); }); }
