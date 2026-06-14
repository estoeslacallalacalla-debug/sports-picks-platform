import { supabase } from "../../lib/supabase";

export default async function handler(req, res) {
  try {
    const apiKey = process.env.API_FOOTBALL_KEY;

    // Coger solo picks pendientes de hoy y ayer (por si el partido fue ayer tarde)
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const fechaAyer = ayer.toISOString().split("T")[0];

    const { data: historial, error } = await supabase
      .from("picks")
      .select("*")
      .eq("resultado", "pendiente")
      .gte("fecha", fechaAyer);

    if (error) return res.status(500).json({ error });
    if (!historial || historial.length === 0) {
      return res.status(200).json({ ok: true, actualizados: 0, mensaje: "Sin pendientes" });
    }

    // Agrupar por fecha para hacer menos llamadas a la API
    const fechas = [...new Set(historial.map(p => p.fecha))];
    const partidosPorFecha = {};

    for (const fecha of fechas) {
      const response = await fetch(
        `https://v3.football.api-sports.io/fixtures?date=${fecha}&status=FT`,
        { headers: { "x-apisports-key": apiKey } }
      );
      const data = await response.json();
      partidosPorFecha[fecha] = data.response || [];
      await sleep(300);
    }

    let actualizados = 0;

    for (const pick of historial) {
      const partidos = partidosPorFecha[pick.fecha] || [];

      // Búsqueda flexible: normalizamos y buscamos el mejor match
      const partido = encontrarPartido(partidos, pick.partido);

      if (!partido) {
        console.log(`No encontrado: ${pick.partido} (${pick.fecha})`);
        continue;
      }

      if (partido.fixture.status.short !== "FT") continue;

      const gL = partido.goals.home ?? 0;
      const gV = partido.goals.away ?? 0;
      const total = gL + gV;
      const homeTeam = partido.teams.home.name;
      const awayTeam = partido.teams.away.name;

      const acierto = evaluarMercado(pick.mercado, gL, gV, total, homeTeam, awayTeam);

      if (acierto === null) {
        // Mercado no reconocido, dejar pendiente
        console.log(`Mercado no reconocido: ${pick.mercado}`);
        continue;
      }

      await supabase
        .from("picks")
        .update({ resultado: acierto ? "acierto" : "fallo" })
        .eq("id", pick.id);

      actualizados++;
    }

    return res.status(200).json({ ok: true, actualizados });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ─── BÚSQUEDA FLEXIBLE DE PARTIDO ────────────────────────────────────────────

function limpiar(texto) {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar acentos
    .replace(/\bfc\b|\bac\b|\bsc\b|\bcd\b|\bsv\b/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function encontrarPartido(partidos, nombrePick) {
  const pickLimpio = limpiar(nombrePick);

  // Intento exacto
  for (const p of partidos) {
    const apiNombre = limpiar(`${p.teams.home.name} vs ${p.teams.away.name}`);
    if (apiNombre === pickLimpio) return p;
  }

  // Intento con palabras clave (por si los nombres difieren un poco)
  const palabrasPick = pickLimpio.split(" ").filter(w => w.length > 3);
  let mejorMatch = null;
  let mejorPuntuacion = 0;

  for (const p of partidos) {
    const apiNombre = limpiar(`${p.teams.home.name} vs ${p.teams.away.name}`);
    const palabrasApi = apiNombre.split(" ");
    const coincidencias = palabrasPick.filter(w => palabrasApi.includes(w)).length;
    const puntuacion = coincidencias / palabrasPick.length;

    if (puntuacion > mejorPuntuacion && puntuacion >= 0.6) {
      mejorPuntuacion = puntuacion;
      mejorMatch = p;
    }
  }

  return mejorMatch;
}

// ─── EVALUACIÓN DE MERCADOS ───────────────────────────────────────────────────

function evaluarMercado(mercado, gL, gV, total, homeTeam, awayTeam) {
  const m = (mercado || "").toLowerCase();

  // Goles
  if (m.includes("más de 0.5") || m.includes("over 0.5"))   return total >= 1;
  if (m.includes("más de 1.5") || m.includes("over 1.5"))   return total >= 2;
  if (m.includes("más de 2.5") || m.includes("over 2.5"))   return total >= 3;
  if (m.includes("más de 3.5") || m.includes("over 3.5"))   return total >= 4;
  if (m.includes("menos de 2.5") || m.includes("under 2.5")) return total <= 2;
  if (m.includes("menos de 3.5") || m.includes("under 3.5")) return total <= 3;

  // Ambos marcan
  if (m.includes("ambos") || m.includes("btts")) return gL > 0 && gV > 0;

  // Resultado
  if (m.includes("empate") || m.includes("draw")) return gL === gV;

  // Victoria local
  if (m.includes("victoria") && limpiar(m).includes(limpiar(homeTeam))) return gL > gV;

  // Victoria visitante
  if (m.includes("victoria") && limpiar(m).includes(limpiar(awayTeam))) return gV > gL;

  // Doble oportunidad 1X
  if (m.includes("1x") || (m.includes("doble") && m.includes("1x"))) return gL >= gV;

  // Doble oportunidad X2
  if (m.includes("x2") || (m.includes("doble") && m.includes("x2"))) return gV >= gL;

  // Tarjetas (no podemos verificar sin datos extra, dejamos pendiente)
  if (m.includes("tarjeta") || m.includes("card")) return null;

  // Córners (no podemos verificar sin datos extra, dejamos pendiente)
  if (m.includes("corner") || m.includes("córner")) return null;

  return null; // mercado no reconocido
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
