export default async function handler(req, res) {
  const base = `https://${process.env.VERCEL_URL || req.headers.host}`;
  const resultados = {};

  try {
    // 1. Actualizar resultados pendientes
    const r1 = await fetch(`${base}/api/actualizar-resultados`);
    resultados.resultados = await r1.json();
  } catch (e) {
    resultados.resultados = { error: e.message };
  }

  try {
    // 2. Surebets de tarde/noche
    const r2 = await fetch(`${base}/api/apuestas-seguras`);
    resultados.surebets = await r2.json();
  } catch (e) {
    resultados.surebets = { error: e.message };
  }

  try {
    // 3. Resumen del día a Telegram
    const r3 = await fetch(`${base}/api/resumen-diario`);
    resultados.resumen = await r3.json();
  } catch (e) {
    resultados.resumen = { error: e.message };
  }

  return res.status(200).json({ ok: true, resultados });
}
