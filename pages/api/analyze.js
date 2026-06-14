export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  const matches = req.body;

  if (!Array.isArray(matches) || matches.length === 0) {
    return res.status(400).json({ error: "Sin partidos" });
  }

  // Máximo 10 partidos para no gastar la API
  const partidos = matches.slice(0, 10);
  const resultados = [];

  for (const match of partidos) {
    try {
      const homeId = match.teams?.home?.id;
      const awayId = match.teams?.away?.id;
      const leagueId = match.league?.id;
      const season = match.league?.season;
      const leagueName = match.league?.name || "";

      if (!homeId || !awayId || !leagueId) continue;

      // Pedir estadísticas de ambos equipos a la API
      const [statsHome, statsAway, h2h] = await Promise.all([
        fetchStats(apiKey, homeId, leagueId, season),
        fetchStats(apiKey, awayId, leagueId, season),
        fetchH2H(apiKey, homeId, awayId),
      ]);

      const analisis = calcularMercados(match, statsHome, statsAway, h2h, leagueName);
      resultados.push(analisis);

      // Pausa pequeña entre llamadas para no saturar la API
      await sleep(300);

    } catch (err) {
      console.error("Error analizando partido:", err.message);
    }
  }

  return res.status(200).json(resultados);
}

// ─── LLAMADAS A LA API ───────────────────────────────────────────────────────

async function fetchStats(apiKey, teamId, leagueId, season) {
  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/teams/statistics?team=${teamId}&league=${leagueId}&season=${season}`,
      { headers: { "x-apisports-key": apiKey } }
    );
    const data = await res.json();
    return data.response || {};
  } catch {
    return {};
  }
}

async function fetchH2H(apiKey, homeId, awayId) {
  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/fixtures/headtohead?h2h=${homeId}-${awayId}&last=6`,
      { headers: { "x-apisports-key": apiKey } }
    );
    const data = await res.json();
    return data.response || [];
  } catch {
    return [];
  }
}

// ─── CÁLCULO DE MERCADOS ─────────────────────────────────────────────────────

function calcularMercados(match, statsHome, statsAway, h2h, leagueName) {
  const homeName = match.teams?.home?.name || "Local";
  const awayName = match.teams?.away?.name || "Visitante";

  // Media de goles marcados y encajados
  const gmLocal   = parseFloat(statsHome?.goals?.for?.average?.total   || 1.3);
  const gcLocal   = parseFloat(statsHome?.goals?.against?.average?.total || 1.1);
  const gmVisit   = parseFloat(statsAway?.goals?.for?.average?.total   || 1.1);
  const gcVisit   = parseFloat(statsAway?.goals?.against?.average?.total || 1.3);

  // Goles esperados en el partido
  const golesEsperados = ((gmLocal + gcVisit) / 2 + (gmVisit + gcLocal) / 2) / 2;

  // % victorias local y visitante en liga
  const pjLocal  = statsHome?.fixtures?.played?.total || 1;
  const pvLocal  = statsHome?.fixtures?.wins?.total   || 0;
  const peLocal  = statsHome?.fixtures?.draws?.total  || 0;
  const pdLocal  = statsHome?.fixtures?.loses?.total  || 0;

  const pjVisit  = statsAway?.fixtures?.played?.total || 1;
  const pvVisit  = statsAway?.fixtures?.wins?.total   || 0;
  const peVisit  = statsAway?.fixtures?.draws?.total  || 0;

  const pctVLocal  = Math.round((pvLocal / pjLocal) * 100);
  const pctEmpate  = Math.round(((peLocal / pjLocal) + (peVisit / pjVisit)) / 2 * 100);
  const pctVVisit  = Math.round((pvVisit / pjVisit) * 100);

  // H2H: cuántos tuvieron más de 2.5 goles
  const h2hTotal = h2h.length || 1;
  const h2hOver25 = h2h.filter(p => {
    const goles = (p.goals?.home || 0) + (p.goals?.away || 0);
    return goles > 2.5;
  }).length;
  const h2hAmbos = h2h.filter(p =>
    (p.goals?.home || 0) > 0 && (p.goals?.away || 0) > 0
  ).length;

  const pctOver25H2H  = Math.round((h2hOver25 / h2hTotal) * 100);
  const pctAmbosH2H   = Math.round((h2hAmbos  / h2hTotal) * 100);

  // Liga femenina → suelen tener más goles
  const esFemenino = leagueName.toLowerCase().includes("women") ||
                     leagueName.toLowerCase().includes("femin") ||
                     leagueName.toLowerCase().includes("liga f");

  const bonusFem = esFemenino ? 5 : 0;

  // Media de corners y tarjetas de la temporada
  const cornersLocal = parseFloat(statsHome?.cards?.yellow?.total || 4);
  const cornersVisit = parseFloat(statsAway?.cards?.yellow?.total || 4);
  const tarjetasEsperadas = Math.round(cornersLocal / pjLocal + cornersVisit / pjVisit);

  // ─── MERCADOS FINALES ─────────────────────────────────────────────────────

  const mercados = [];

  // 1. Resultado 1X2
  const maxResult = Math.max(pctVLocal, pctEmpate, pctVVisit);
  if (pctVLocal >= 70) {
    mercados.push({ mercado: `Victoria ${homeName}`, confianza: pctVLocal, tipo: "resultado" });
  }
  if (pctVVisit >= 70) {
    mercados.push({ mercado: `Victoria ${awayName}`, confianza: pctVVisit, tipo: "resultado" });
  }
  if (pctEmpate >= 70) {
    mercados.push({ mercado: "Empate", confianza: pctEmpate, tipo: "resultado" });
  }

  // 2. Doble oportunidad
  const pctDO_1X = Math.min(pctVLocal + pctEmpate, 99);
  const pctDO_X2 = Math.min(pctEmpate + pctVVisit, 99);
  if (pctDO_1X >= 70) {
    mercados.push({ mercado: `Doble oportunidad 1X (${homeName} o Empate)`, confianza: pctDO_1X, tipo: "doble_oportunidad" });
  }
  if (pctDO_X2 >= 70) {
    mercados.push({ mercado: `Doble oportunidad X2 (Empate o ${awayName})`, confianza: pctDO_X2, tipo: "doble_oportunidad" });
  }

  // 3. Goles
  const pctOver15 = Math.min(Math.round((golesEsperados > 1.5 ? 75 : 45) + bonusFem + pctOver25H2H * 0.1), 98);
  const pctOver25 = Math.min(Math.round(pctOver25H2H * 0.6 + (golesEsperados > 2.5 ? 30 : 10) + bonusFem), 98);
  const pctUnder25 = Math.min(100 - pctOver25, 98);

  if (pctOver15 >= 70) {
    mercados.push({ mercado: "Más de 1.5 goles", confianza: pctOver15, tipo: "goles" });
  }
  if (pctOver25 >= 70) {
    mercados.push({ mercado: "Más de 2.5 goles", confianza: pctOver25, tipo: "goles" });
  }
  if (pctUnder25 >= 70) {
    mercados.push({ mercado: "Menos de 2.5 goles", confianza: pctUnder25, tipo: "goles" });
  }

  // 4. Ambos marcan
  const pctAmbos = Math.min(Math.round(pctAmbosH2H * 0.7 +
    (gmLocal > 1 && gmVisit > 1 ? 25 : 10) + bonusFem), 98);
  if (pctAmbos >= 70) {
    mercados.push({ mercado: "Ambos equipos marcan", confianza: pctAmbos, tipo: "ambos_marcan" });
  }

  // 5. Córners (estimado por estadísticas de ataques)
  const ataqueLocal = parseFloat(statsHome?.biggest?.goals?.for?.total  || 2);
  const ataqueVisit = parseFloat(statsAway?.biggest?.goals?.for?.total  || 2);
  const cornersEsp  = Math.round((ataqueLocal + ataqueVisit) * 1.8);
  const pctCorners8 = cornersEsp >= 9 ? Math.min(65 + bonusFem, 90) : 40;
  const pctCorners10 = cornersEsp >= 11 ? Math.min(60 + bonusFem, 88) : 35;
  if (pctCorners8 >= 70) {
    mercados.push({ mercado: "Más de 8.5 córners", confianza: pctCorners8, tipo: "corners" });
  }
  if (pctCorners10 >= 70) {
    mercados.push({ mercado: "Más de 9.5 córners", confianza: pctCorners10, tipo: "corners" });
  }

  // 6. Tarjetas
  const tarjLocal = statsHome?.cards?.yellow?.total || 40;
  const tarjVisit = statsAway?.cards?.yellow?.total || 35;
  const mediaT    = Math.round((tarjLocal / pjLocal + tarjVisit / pjVisit));
  const pctT3     = mediaT >= 3 ? Math.min(62 + bonusFem, 89) : 38;
  if (pctT3 >= 70) {
    mercados.push({ mercado: "Más de 3.5 tarjetas", confianza: pctT3, tipo: "tarjetas" });
  }

  // Ordenar por confianza y quedarse solo con los >= 70%
  const mejores = mercados
    .filter(m => m.confianza >= 70)
    .sort((a, b) => b.confianza - a.confianza);

  return {
    fixture: match.fixture,
    league:  match.league,
    teams:   match.teams,
    mercados: mejores,
    resumen: {
      golesEsperados: golesEsperados.toFixed(2),
      pctVictoriaLocal:    pctVLocal,
      pctEmpate:           pctEmpate,
      pctVictoriaVisitante: pctVVisit,
      esFemenino,
    }
  };
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
