import { useEffect, useState } from "react";

export default function Picks() {

  const [picks, setPicks] =
    useState([]);

  useEffect(() => {

    fetch("/api/analisis-ia")
      .then(res => res.json())
      .then(data =>
        setPicks(
          data.picks || []
        )
      );

    if (
      "serviceWorker"
      in navigator
    ) {

      navigator.serviceWorker
        .register("/sw.js");
    }

  }, []);

  return (

    <div
      style={{
        background:
          "#020617",
        minHeight:
          "100vh",
        padding:
          "20px",
        color:
          "white",
        fontFamily:
          "Arial"
      }}
    >

      <h1
        style={{
          textAlign:
            "center",
          color:
            "#38bdf8",
          marginBottom:
            "30px"
        }}
      >
        🔥 SPORTS PICKS IA PREMIUM
      </h1>

      {
        picks.map(
          (
            pick,
            index
          ) => (

            <div
              key={index}
              style={{
                background:
                  "#0f172a",

                padding:
                  "20px",

                borderRadius:
                  "20px",

                marginBottom:
                  "20px",

                border:
                  pick.premium

                    ? "2px solid gold"

                    : "2px solid #38bdf8"
              }}
            >

              <h2>
                ⚽ {pick.partido}
              </h2>

              <p>
                🏆 {pick.liga}
              </p>

              <p>
                🎯 {pick.mercado}
              </p>

              <p>
                📊 Promedio:
                {" "}
                {pick.promedio}
              </p>

              <p>
                🚀 Confianza:
                {" "}
                {pick.confianza}%
              </p>

              {
                pick.premium && (

                  <p
                    style={{
                      color:
                        "gold"
                    }}
                  >
                    💎 PREMIUM PICK
                  </p>
                )
              }

            </div>
          )
        )
      }

    </div>
  );
}
