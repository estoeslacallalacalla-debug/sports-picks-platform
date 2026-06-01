export default function handler(
  req,
  res
) {

  const premiumPicks = [

    {
      partido:
        "Manchester City vs Arsenal",

      mercado:
        "Over 2.5 goles",

      confianza: 94,

      tipo:
        "PREMIUM"
    },

    {
      partido:
        "Barcelona vs Sevilla",

      mercado:
        "Ambos marcan",

      confianza: 91,

      tipo:
        "PREMIUM"
    }

  ];

  res.status(200).json({

    ok: true,

    premium:
      premiumPicks
  });
}
