export default async function handler(req, res) {
  const TOKEN =
    "8653728311:AAEK-cg-tcNjB1gF3HFA8HLRbOpb35OaF-U";

  const CHAT_ID = "@sportspicksia2026";

  const mensaje = `
🔥 PICK TOP DETECTADO

⚽ Partido recomendado
📊 Confianza alta
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
