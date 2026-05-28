export default async function handler(req, res) {
  const TOKEN =
    "8653728311:AAEK-cg-tcNjB1gF3HFA8HLRbOpb35OaF-U";

  const CHAT_ID =
    "-1003814547497";

  const picks = [
    {
      liga: "Libertadores",
      partido:
        "Boca Juniors vs River Plate",
      mercado: "Más de 2.5 goles",
      confianza: "92%"
    },
    {
      liga: "Liga F",
      partido:
        "Barcelona F vs Madrid F",
      mercado:
        "Ambos equipos marcan",
      confianza: "90%"
    }
  ];

  try {
    for (const pick of picks) {
      const mensaje = `
🔥 PICK TOP

🏆 ${pick.liga}

⚽ ${pick.partido}

🎯 ${pick.mercado}

📊 Confianza: ${pick.confianza}
`;

      await fetch(
        `https://api.telegram.org/bot${TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            chat_id: CHAT_ID,
            text: mensaje
          })
        }
      );
    }

    res.status(200).json({
      ok: true
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
}
