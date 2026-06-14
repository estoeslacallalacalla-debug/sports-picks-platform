import { supabase } from "../../lib/supabase";

export default async function handler(req, res) {
  try {
    const apiKey = process.env.API_FOOTBALL_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "API_FOOTBALL_KEY no configurada" });
    }

    const hoy = new Date().toISOString().split("T")[0];

    // Ligas poco conocidas masculinas y femeninas + mundiales
    const ligas = [
      // Mundiales
      { id: 1,   nombre: "🌍 Mundial Masculino" },
      { id: 32,  nombre: "🌸 Mundial Femenino" },
      // Ligas poco conocidas - masculino
      { id: 40,  nombre: "🇧🇴 Liga Bolivia" },
      { id: 352, nombre: "🇰🇿 Superliga Kazajistán" },
      { id: 354, nombre: "🇧🇾 Liga Bielorrusia" },
      { id: 208, nombre: "🇦🇱 Liga Albanesa" },
      { id: 164, nombre: "🇮🇸 Liga Islandesa" },
      { id: 288, nombre: "🇿🇲 Liga Zambia" },
      { id: 341, nombre: "🇬🇪 Erovnuli Liga (Georgia)" },
      { id: 340, nombre: "🇻🇳 V.League 1 (Vietnam)" },
      { id: 333, nombre: "🇷🇸 Superliga Serbia" },
      { id: 271, nombre: "🇩🇰 Superliga Dinamarca" },
      { id: 113, nombre: "🇸🇪 Allsvenskan (Suecia)" },
      // Ligas femeninas
      { id: 838, nombre: "🇺🇸 NWSL (EE.UU. Femenino)" },
      { id: 59,  nombre: "🇸🇪 Damallsvenskan (Suecia Femenino)" },
      { id: 545, nombre: "🇩🇪 Frauen-Bundesliga" },
      { id: 760, nombre: "🌍 Champions League Femenino" },
    ];

    const temporada = new Date().getMonth() >= 6
      ? new Date().getFullYear()
      : new Date().getFullYear() - 1;

    const picks = [];
    const ligasConPartidos = [];

    for (const liga of ligas) {
      try {
        const res1 = await fetch(
          `https://v3.football.api-sports.io/fixtures?league=${liga.id}&date=${hoy}&timezone=Europe/Madrid`,
          { headers: { "x-apisports-key": apiKey } }
        );
        const data = await res1.json();
        const partidos = data.response || [];

        if (partidos.length > 0) {
          ligasConPartidos.push({ ...liga, partidos });
        }

        await sleep(300);
      } catch (err) {
        console.error(`Error liga ${liga.id}:`, err.message);
      }
    }

    // Para cada partido obtener estadísticas y calcular mercados
    for (const liga of ligasConPartidos) {
      for (const partido of liga.partidos) {
        // Solo partidos no iniciados
        if (partido.fixture.status.short !== "NS") continue;

        const homeId = partido.teams.home.id;
        const awayId = partido.teams.away.id;
        const homeName = partido.teams.home.name;
        const awayName = partido.teams.away.name;

        // Estadísticas de la temporada
        const [statsHome, statsAway, h2h] = await Promise.all([
          fetchStats(apiKey, homeId, liga.id, temporada),
          fetchStats(apiKey, awayId, liga.id, temporada),
          fetchH2H(apiKey, homeId, awayId),
        ]);

        await sleep(300);

        const esFemenino = liga.nombre.includes("Femenino") ||
                           liga.nombre.includes("Femenina") ||
                           liga.nombre.includes("Women") ||
                           liga.nombre.includes("🌸");

        const mercadosDetectados = calcularMercados(
          statsHome, statsAway, h2h, homeName, awayName, esFemenino
        );

        // Solo mercados con >= 70% de confianza
        const mercadosBuenos = mercadosDetectados.filter(m => m.confianza >= 70);

        for (const m of mercadosBuenos) {
          picks.push({
            partido:   `${homeName} vs ${awayName}`,
            liga:      liga.nombre,
            mercado:   m.mercado,
            confianza: m.confianza,
            fecha:     hoy,
            resultado: "pendiente",
          });
        }
      }
    }

    // Ordenar por confianza y limitar a 10 para no gastar la API
    const topPicks = picks
      .sort((a, b) => b.confianza - a.confianza)
      .slice(0, 10);

    if (topPicks.length > 0) {
      // Evitar duplicados: borrar picks de hoy antes de insertar
      await supabase
        .from("picks")
        .delete()
        .eq("fecha", hoy)
        .eq("resultado", "pendiente");

      await supabase.from("picks").insert(topPicks);
    }

    return res.status(200).json({
      ok: true,
      totalPicks: topPicks.length,
      picks: topPicks,
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ─── ESTADÍSTICAS ─────────────────────────────────────────────────────────────

async function fetchStats(apiKey, teamId, leagueId, season) {
  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/teams/statistics?team=${teamId}&league=${leagueId}&season=${season}`,
      { headers: { "x-apisports-key": apiKey } }
    );
    const data = await res.json();
    return data.response || {};
  } catch { return {}; }
}

async function fetchH2H(apiKey, homeId, awayId) {
  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/fixtures/headtohead?h2h=${homeId}-${awayId}&last=6`,
      { headers: { "x-apisports-key": apiKey } }
    );
    const data = await res.json();
    return data.response || [];
  } catch { return []; }
}

// ─── CÁLCULO DE MERCADOS ──────────────────────────────────────────────────────

function calcularMercados(statsHome, statsAway, h2h, homeName, awayName, esFemenino) {
  const bonus = esFemenino ? 4 : 0;

  const pjL = statsHome?.fixtures?.played?.total || 1;
  const pvL = statsHome?.fixtures?.wins?.total   || 0;
  const peL = statsHome?.fixtures?.draws?.total  || 0;

  const pjV = statsAway?.fixtures?.played?.total || 1;
  const pvV = statsAway?.fixtures?.wins?.total   || 0;
  const peV = statsAway?.fixtures?.draws?.total  || 0;

  const gmL = parseFloat(statsHome?.goals?.for?.average?.total    || 1.3);
  const gcL = parseFloat(statsHome?.goals?.against?.average?.total || 1.1);
  const gmV = parseFloat(statsAway?.goals?.for?.average?.total    || 1.1);
  const gcV = parseFloat(statsAway?.goals?.against?.average?.total || 1.3);

  const golesEsp = ((gmL + gcV) + (gmV + gcL)) / 2;

  // H2H stats
  const h2hN      = h2h.length || 1;
  const h2hO25    = h2h.filter(p => (p.goals?.home||0)+(p.goals?.away||0) > 2.5).length;
  const h2hAmbos  = h2h.filter(p => (p.goals?.home||0)>0 && (p.goals?.away||0)>0).length;

  const pctVL   = cap(Math.round((pvL / pjL) * 100));
  const pctE    = cap(Math.round(((peL/pjL)+(peV/pjV))/2 * 100));
  const pctVV   = cap(Math.round((pvV / pjV) * 100));

  const pctO15  = cap(Math.round((golesEsp > 1.5 ? 72 : 48) + bonus + h2hO25/h2hN*10));
  const pctO25  = cap(Math.round((h2hO25/h2hN)*65 + (golesEsp > 2.5 ? 20 : 5) + bonus));
  const pctU25  = cap(100 - pctO25);
  const pctAmb  = cap(Math.round((h2hAmbos/h2hN)*65 + (gmL>1&&gmV>1?20:5) + bonus));
  const pct1X   = cap(pctVL + pctE);
  const pctX2   = cap(pctE + pctVV);

  const mercados = [];

  // Resultado
  if (pctVL  >= 70) mercados.push({ mercado: `Victoria ${homeName}`,                  confianza: pctVL  });
  if (pctE   >= 70) mercados.push({ mercado: "Empate",                                 confianza: pctE   });
  if (pctVV  >= 70) mercados.push({ mercado: `Victoria ${awayName}`,                   confianza: pctVV  });

  // Doble oportunidad
  if (pct1X  >= 70) mercados.push({ mercado: `Doble oportunidad 1X (${homeName}/Empate)`, confianza: pct1X });
  if (pctX2  >= 70) mercados.push({ mercado: `Doble oportunidad X2 (Empate/${awayName})`, confianza: pctX2 });

  // Goles
  if (pctO15 >= 70) mercados.push({ mercado: "Más de 1.5 goles",   confianza: pctO15 });
  if (pctO25 >= 70) mercados.push({ mercado: "Más de 2.5 goles",   confianza: pctO25 });
  if (pctU25 >= 70) mercados.push({ mercado: "Menos de 2.5 goles", confianza: pctU25 });

  // Ambos marcan
  if (pctAmb >= 70) mercados.push({ mercado: "Ambos equipos marcan", confianza: pctAmb });

  return mercados.sort((a, b) => b.confianza - a.confianza);
}

function cap(n) { return Math.min(Math.max(n, 0), 98); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
