import { supabase } from "../../lib/supabase";

export default async function handler(req, res) {
  try {
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChat  = process.env.TELEGRAM_CHAT_ID || "@sportspicksia2026";
    const apiKey        = process.env.FOOTBALL_DATA_KEY;

    const hoy     = new Date().toISOString().split("T")[0];
    const hace28h = new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString().split("T")[0];

    // 1. Intentar actualizar resultados pendientes de hoy y ayer
    const { data: pendientes } = await supabase
      .from("picks")
      .select("*")
      .eq("resultado", "pendiente")
      .gte("fecha", hace28h);

    if (pendientes && pendientes.length > 0) {
      const fechas = [...new Set(pendientes.map(p => p.fecha))];
      for (const fecha of fechas) {
        try {
          const r = await fetch(
            `https://api.football-data.org/v4/competitions/WC/matches?dateFrom=${fecha}&dateTo=${fecha}`,
            { headers: { "X-Auth-Token": apiKey } }
          );
          const data = await r.json();
          const terminados = (data.matches || []).filter(m => m.status === "FINISHED");

          for (const pick of pendientes.filter(p => p.fecha === fecha)) {
            const partido = encontrarPartido(terminados, pick.partido);
            if (!partido) continue;

            const gL    = partido.score?.fullTime?.home ?? 0;
            const gV    = partido.score?.fullTime?.away ?? 0;
            const total = gL + gV;
            const home  = partido.homeTeam?.name || "";
            const away  = partido.awayTeam?.name || "";

            const acierto = evaluarMercado(pick.mercado, gL, gV, total, home, away);
            if (acierto === null) continue;

            await supabase
              .from("picks")
              .update({ resultado: acierto ? "acierto" : "fallo" })
              .eq("id", pick.id);
          }
        } catch (err) {
          console.error("Error actualizando:", err.message);
        }
      }
    }

    // 2. Leer SOLO picks que ya tienen resultado (acierto o fallo) de hoy/ayer
    const { data: picks, error } = await supabase
      .from("picks")
      .select("*")
      .gte("fecha", hace28h)
      .in("resultado", ["acierto", "fallo"])  // ← solo los ya jugados
      .order("confianza", { ascending: false });

    if (error) return res.status(500).json({ error });

    const aciertos = picks.filter(p => p.resultado === "acierto").length;
    const fallos   = picks.filter(p => p.resultado === "fallo").length;
    const total    = aciertos + fallos;
    const winrate  = total > 0
      ? ((aciertos / total) * 100).toFixed(0) + "%"
      : "—";

    // Lista de picks jugados hoy
    const listapicks = picks.slice(0, 10).map(p => {
      const icono = p.resultado === "acierto" ? "✅" : "❌";
      return `${icono} ${p.partido} — ${p.mercado} (${p.confianza}%)`;
    }).join("\n");

    const mensaje = total === 0
      ? `📊 *RESUMEN DEL DÍA*\n📅 ${hoy}\n\nHoy no hubo picks con resultado final todavía.\n🔥 Sports Picks IA`
      : `📊 *RESUMEN DEL DÍA*
📅 ${hoy}

✅ Aciertos: *${aciertos}*
❌ Fallos: *${fallos}*
📈 Winrate: *${winrate}*

${listapicks ? `📋 *Picks jugados:*\n${listapicks}` : ""}

🔥 Sports Picks IA`;

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

    return res.status(200).json({ ok: true, aciertos, fallos, winrate });

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
    const api = limpiar(`${p.homeTeam?.name} vs ${p.awayTeam?.name}`);
    if (api === pickL) return p;
  }
  const palabras = pickL.split(" ").filter(w => w.length > 3);
  let mejor = null, mejorPts = 0;
  for (const p of partidos) {
    const api = limpiar(`${p.homeTeam?.name} vs ${p.awayTeam?.name}`).split(" ");
    const pts = palabras.filter(w => api.includes(w)).length / palabras.length;
    if (pts > mejorPts && pts >= 0.6) { mejorPts = pts; mejor = p; }
  }
  return mejor;
}

function evaluarMercado(mercado, gL, gV, total, home, away) {
  const m = (mercado || "").toLowerCase();
  if (m.includes("más de 0.5"))                               return total >= 1;
  if (m.includes("más de 1.5"))                               return total >= 2;
  if (m.includes("más de 2.5"))                               return total >= 3;
  if (m.includes("más de 3.5"))                               return total >= 4;
  if (m.includes("menos de 2.5"))                             return total <= 2;
  if (m.includes("menos de 3.5"))                             return total <= 3;
  if (m.includes("ambos"))                                    return gL > 0 && gV > 0;
  if (m.includes("empate"))                                   return gL === gV;
  if (m.includes("1x"))                                       return gL >= gV;
  if (m.includes("x2"))                                       return gV >= gL;
  if (m.includes("victoria") && limpiar(m).includes(limpiar(home))) return gL > gV;
  if (m.includes("victoria") && limpiar(m).includes(limpiar(away))) return gV > gL;
  if (m.includes("ganador") && limpiar(m).includes(limpiar(home)))  return gL > gV;
  if (m.includes("ganador") && limpiar(m).includes(limpiar(away)))  return gV > gL;
  if (m.includes("ganador") && m.includes("draw"))                  return gL === gV;
  return null;
}
