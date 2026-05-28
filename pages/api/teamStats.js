export default function handler(req, res) {
  const {
    team
  } = req.query;

  const resultados = [
    "✅",
    "✅",
    "➖",
    "❌",
    "✅"
  ];

  const goles =
    (
      Math.random() * 2 +
      1
    ).toFixed(1);

  res.status(200).json({
    team,
    resultados,
    promedioGoles: goles
  });
}
