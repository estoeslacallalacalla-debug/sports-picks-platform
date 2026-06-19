export default async function handler(req, res) {
  const base = `https://${process.env.VERCEL_URL || req.headers.host}`;
  const resultados = {};

  try {
    // 1. Análisis de partidos
    const r1 = await fetch(`${base}/api/analisis-ia`);
    resultados.analisis = await r1.json();
  } catch (e) {
    resultados.analisis = { error: e.message };
  }

  try {
    // 2. Surebets
    const r2 = await fetch(`${base}/api/apuestas-seguras`);
    resultados.surebets = await r2.json();
  } catch (e) {
    resultados.surebets = { error: e.message };
  }

  return res.status(200).json({ ok: true, resultados });
}
