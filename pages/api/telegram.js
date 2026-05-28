let enviados = [];

export default async function handler(req, res) {
  const TOKEN =
    "8653728311:AAEK-cg-tcNjB1gF3HFA8HLRbOpb35OaF-U";

  const CHAT_ID =
    "-1003814547497";

  const {
    liga,
    partido,
    mercado,
    confianza
  } = req.query;

  const idUnico =
    partido + mercado;

  if (enviados.includes(idUnico)) {
    return res.status(200).json({
      ok: true,
      repetido: true
    });
  }

  enviados.push(idUnico);

  if (enviados.length > 100) {
    enviados.shift();
  }

  const mensaje = `
🔥 PICK TOP

🏆 ${liga}

⚽ ${partido}

🎯 ${mercado}

📊 Confianza: ${confianza}
`;

  try {
    const response = await fetch(
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

    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
}
