import { supabase } from "../../lib/supabase";

export default async function handler(req, res) {
  try {
    const apiKey  = process.env.API_FOOTBALL_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (!apiKey)  return res.status(500).json({ error: "API_FOOTBALL_KEY no configurada" });
    if (!groqKey) return res.status(500).json({ error: "GROQ_API_KEY no configurada" });

    const hoy = new Date().toISOString().split("T")[0];

    // Ligas e IDs reales de API-Football
    // La temporada del Mundial 2026 es "2026", el resto usa la temporada normal
    const ligas = [
      // Mundial y competiciones de selecciones (PRIORIDAD)
      { id: 1,   nombre: "🌍 Mundial 2026",                temporada: 2026 },
      { id: 32,  nombre: "🌸 Mundial Femenino",             temporada: null },
      { id: 5,   nombre: "🏆 UEFA Nations League",          temporada: null },
      { id: 9,   nombre: "🏆 Copa America",                temporada: null },
      { id: 10,  nombre: "🌐 Amistosos Internacionales",    temporada: null },
      { id: 524, nombre: "🌐 Amistosos Internacionales Fem", temporada: null },
      { id: 34,  nombre: "🌎 Eliminatorias Sudamerica",     temporada: null },
      { id: 32,  nombre: "🌍 Eliminatorias Europa",         temporada: null },
      // Ligas poco conocidas - masculino
      { id: 40,  nombre: "🇧🇴 Liga Bolivia",                temporada: null },
      { id: 352, nombre: "🇰🇿 Superliga Kazajistan",        temporada: null },
      { id: 354, nombre: "🇧🇾 Liga Bielorrusia",            temporada: null },
      { id: 208, nombre: "🇦🇱 Liga Albanesa",               temporada: null },
      { id: 164, nombre: "🇮🇸 Liga Islandesa",              temporada: null },
      { id: 288, nombre: "🇿🇲 Liga Zambia",                 temporada: null },
      // Ligas femeninas
      { id: 838, nombre: "🇺🇸 NWSL Femenino",               temporada: null },
      { id: 59,  nombre: "🇸🇪 Damallsvenskan Femenino",     temporada: null },
    ];

    const temporadaNormal = new Date().getMonth() >= 6
      ? new Date().getFullYear()
      : new Date().getFullYear() - 1;

    // LIMITE para no agotar la API gratuita (100 llamadas/dia)
    const LIMITE_LIGAS_CONSULTADAS  = 12; // maximo de ligas que consultamos por dia
    const LIMITE_PARTIDOS_ANALIZADOS = 8; // maximo de partidos que pasan por estadisticas+IA
    let llamadasUsadas = 0;
    const MAX_LLAMADAS = 80; // margen de seguridad sobre las 100/dia

    function puedeLlamar(costo = 1) {
      if (llamadasUsadas + costo > MAX_LLAMADAS) return false;
      llamadasUsadas += costo;
      return true;
    }

    // 1. Recoger partidos de hoy (solo hasta el limite de ligas)
    const ligasConPartidos = [];
    for (const liga of ligas.slice(0, LIMITE_LIGAS_CONSULTADAS)) {
      if (!puedeLlamar(1)) break;
      try {
        const r = await fetch(
          `https://v3.football.api-sports.io/fixtures?league=${liga.id}&date=${hoy}&timezone=Europe/Madrid`,
          { headers: { "x-apisports-key": apiKey } }
        );
        const data = await r.json();
        const partidos = (data.response || []).filter(p => p.fixture.status.short === "NS");
        if (partidos.length > 0) {
          ligasConPartidos.push({
            ...liga,
            temporadaUsar: liga.temporada || temporadaNormal,
            partidos
          });
        }
        await sleep(250);
      } catch (err) {
        console.error(`Liga ${liga.id}:`, err.message);
      }
    }

    if (ligasConPartidos.length === 0) {
      return res.status(200).json({ ok: true, totalPicks: 0, picks: [], mensaje: "Sin partidos hoy", llamadasUsadas });
    }

    // 2. Aplanar todos los partidos encontrados y limitar cuantos analizamos
    let todosPartidos = [];
    for (const liga of ligasConPartidos) {
      for (const partido of liga.partidos) {
        todosPartidos.push({ liga, partido });
      }
    }
    todosPartidos = todosPartidos.slice(0, LIMITE_PARTIDOS_ANALIZADOS);

    // 3. Para cada partido: estadisticas reales (2 llamadas) + analisis Groq (0 llamadas API-Football)
    const todosLosPicks = [];

    for (const { liga, partido } of todosPartidos) {
      if (!puedeLlamar(2)) break; // 2 llamadas: stats local + stats visitante

      const homeId   = partido.teams.home.id;
      const awayId   = partido.teams.away.id;
      const homeName = partido.teams.home.name;
      const awayName = partido.teams.away.name;
      const hora      = partido.fixture.date?.substring(11, 16) || "??:??";

      const [statsHome, statsAway] = await Promise.all([
        fetchStats(apiKey, homeId, liga.id, liga.temporadaUsar),
        fetchStats(apiKey, awayId, liga.id, liga.temporadaUsar),
      ]);
      await sleep(250);

      // H2H solo si quedan llamadas disponibles
      let h2h = [];
      if (puedeLlamar(1)) {
        h2h = await fetchH2H(apiKey, homeId, awayId);
        await sleep(250);
      }

      const resumenDatos = construirResumen(
        homeName, awayName, liga.nombre, hora,
        statsHome, statsAway, h2h
      );

      const analisisIA = await analizarConGroq(groqKey, resumenDatos);
      if (!analisisIA) continue;

      const mercadosBuenos = analisisIA.filter(m => m.confianza >= 70);

      for (const m of mercadosBuenos) {
        todosLosPicks.push({
          partido:   `${homeName} vs ${awayName}`,
          liga:      liga.nombre,
          mercado:   m.mercado,
          confianza: m.confianza,
          fecha:     hoy,
          resultado: "pendiente",
        });
      }
    }

    // 4. Top 10 por confianza
    const topPicks = todosLosPicks
      .filter(p => p.partido && p.partido.trim() !== "")
      .sort((a, b) => b.confianza - a.confianza)
      .slice(0, 10);

    // 5. Guardar en Supabase
    if (topPicks.length > 0) {
      await supabase.from("picks").delete().eq("fecha", hoy).eq("resultado", "pendiente");
      await supabase.from("picks").insert(topPicks);
    }

    // 6. Enviar a Telegram
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChat  = process.env.TELEGRAM_CHAT_ID || "@sportspicksia2026";

    for (const pick of topPicks) {
      const estrellas = pick.confianza >= 85 ? "⭐⭐⭐" : pick.confianza >= 75 ? "⭐⭐" : "⭐";
      const mensaje =
`⚽ *PICK DEL DÍA* ${estrellas}

🏆 *${pick.liga}*
🆚 *${pick.partido}*

🎯 *${pick.mercado}*
📊 Confianza: *${pick.confianza}%*

🤖 _Análisis con IA (Groq Llama 3)_
🔗 Sports Picks IA`;

      await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: telegramChat, text: mensaje, parse_mode: "Markdown" })
      });
      await sleep(400);
    }

    return res.status(200).json({ ok: true, totalPicks: topPicks.length, picks: topPicks, llamadasUsadas });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ─── ESTADISTICAS API-FOOTBALL ────────────────────────────────────────────────

async function fetchStats(apiKey, teamId, leagueId, season) {
  try {
    const r = await fetch(
      `https://v3.football.api-sports.io/teams/statistics?team=${teamId}&league=${leagueId}&season=${season}`,
      { headers: { "x-apisports-key": apiKey } }
    );
    const data = await r.json();
    return data.response || {};
  } catch { return {}; }
}

async function fetchH2H(apiKey, homeId, awayId) {
  try {
    const r = await fetch(
      `https://v3.football.api-sports.io/fixtures/headtohead?h2h=${homeId}-${awayId}&last=6`,
      { headers: { "x-apisports-key": apiKey } }
    );
    const data = await r.json();
    return data.response || [];
  } catch { return []; }
}

// ─── CONSTRUIR RESUMEN PARA GROQ ──────────────────────────────────────────────

function construirResumen(homeName, awayName, liga, hora, statsHome, statsAway, h2h) {
  const pjL  = statsHome?.fixtures?.played?.total || 0;
  const pvL  = statsHome?.fixtures?.wins?.total   || 0;
  const peL  = statsHome?.fixtures?.draws?.total  || 0;
  const pdL  = statsHome?.fixtures?.loses?.total  || 0;
  const gmL  = statsHome?.goals?.for?.average?.total     || "?";
  const gcL  = statsHome?.goals?.against?.average?.total || "?";

  const pjV  = statsAway?.fixtures?.played?.total || 0;
  const pvV  = statsAway?.fixtures?.wins?.total   || 0;
  const peV  = statsAway?.fixtures?.draws?.total  || 0;
  const pdV  = statsAway?.fixtures?.loses?.total  || 0;
  const gmV  = statsAway?.goals?.for?.average?.total     || "?";
  const gcV  = statsAway?.goals?.against?.average?.total || "?";

  const h2hResumen = h2h.slice(0, 5).map(p => {
    const gH = p.goals?.home ?? 0;
    const gA = p.goals?.away ?? 0;
    return `${p.teams.home.name} ${gH}-${gA} ${p.teams.away.name}`;
  }).join(", ") || "Sin datos previos (puede ser primer enfrentamiento, normal en mundiales)";

  return `PARTIDO: ${homeName} vs ${awayName}
LIGA/COMPETICION: ${liga} | HORA: ${hora}

LOCAL (${homeName}):
- Estadisticas disponibles: ${pvL}V ${peL}E ${pdL}D en ${pjL} partidos
- Media goles marcados/partido: ${gmL}
- Media goles encajados/partido: ${gcL}

VISITANTE (${awayName}):
- Estadisticas disponibles: ${pvV}V ${peV}E ${pdV}D en ${pjV} partidos
- Media goles marcados/partido: ${gmV}
- Media goles encajados/partido: ${gcV}

ULTIMOS ENFRENTAMIENTOS DIRECTOS: ${h2hResumen}

NOTA: si es un partido de selecciones (Mundial, Nations League, Eliminatorias) y no hay
muchas estadisticas de liga, basa el analisis en el nivel general de la seleccion,
su historial en este tipo de torneos y el contexto del partido.`;
}

// ─── ANALISIS CON GROQ ────────────────────────────────────────────────────────

async function analizarConGroq(groqKey, resumenDatos) {
  const prompt = `Analiza este partido de futbol con los datos proporcionados.
Evalua TODOS estos mercados y da un porcentaje de probabilidad realista a cada uno.

${resumenDatos}

Responde SOLO con un array JSON valido, sin texto antes ni despues, sin backticks.
Formato exacto:
[
  {"mercado": "Victoria local", "confianza": <0-98>},
  {"mercado": "Empate", "confianza": <0-98>},
  {"mercado": "Victoria visitante", "confianza": <0-98>},
  {"mercado": "Doble oportunidad 1X", "confianza": <0-98>},
  {"mercado": "Doble oportunidad X2", "confianza": <0-98>},
  {"mercado": "Mas de 1.5 goles", "confianza": <0-98>},
  {"mercado": "Mas de 2.5 goles", "confianza": <0-98>},
  {"mercado": "Menos de 2.5 goles", "confianza": <0-98>},
  {"mercado": "Ambos equipos marcan", "confianza": <0-98>},
  {"mercado": "Mas de 3.5 tarjetas", "confianza": <0-98>},
  {"mercado": "Mas de 8.5 corners", "confianza": <0-98>}
]

IMPORTANTE: basa los porcentajes en los datos reales proporcionados, no inventes datos.`;

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        temperature: 0.2,
        max_tokens: 600,
        messages: [
          {
            role: "system",
            content: "Eres un analista experto en futbol. Respondes SOLO con JSON valido, sin explicaciones ni backticks."
          },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await r.json();
    const texto = data?.choices?.[0]?.message?.content?.trim() || "";
    const limpio = texto.replace(/```json|```/g, "").trim();
    return JSON.parse(limpio);

  } catch (err) {
    console.error("Error Groq:", err.message);
    return null;
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
