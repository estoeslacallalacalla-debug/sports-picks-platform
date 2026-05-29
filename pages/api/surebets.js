export default function handler(req, res) {
  const surebets = [
    {
      partido:
        "Real Madrid vs Barcelona",

      mercado:
        "1X2",

      casa1: "Bet365",
      cuota1: 2.20,

      casa2: "Bwin",
      cuota2: 3.60,

      casa3: "1XBET",
      cuota3: 4.50
    },

    {
      partido:
        "Manchester City vs Arsenal",

      mercado:
        "Más/Menos goles",

      casa1: "Betano",
      cuota1: 2.05,

      casa2: "William Hill",
      cuota2: 2.10,

      casa3: "888sport",
      cuota3: 4.10
    }
  ];

  const analizadas =
    surebets.map((s) => {
      const inversa =
        1 / s.cuota1 +
        1 / s.cuota2 +
        1 / s.cuota3;

      const ganancia =
        (
          (1 - inversa) *
          100
        ).toFixed(2);

      return {
        ...s,
        surebet:
          inversa < 1,
        ganancia
      };
    });

  res.status(200).json(
    analizadas
  );
}
