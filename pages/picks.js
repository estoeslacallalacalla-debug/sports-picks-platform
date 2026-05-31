import { useEffect, useState } from "react";

export default function Picks() {

  const [picks, setPicks] =
    useState([]);

  const [livePicks, setLivePicks] =
    useState([]);

  const [surebets, setSurebets] =
    useState([]);

  useEffect(() => {

    fetch("/api/analisis-ia")
      .then(res => res.json())
      .then(data =>
        setPicks(
          data.picks || []
        )
      );

    fetch("/api/live-picks")
      .then(res => res.json())
      .then(data =>
        setLivePicks(
          data.picks || []
        )
      );

    fetch("/api/apuestas-seguras")
      .then(res => res.json())
      .then(data =>
        setSurebets(
          data.surebets || []
        )
      );

  }, []);

  return (

    <div
      style={{
        background:
          "#0f172a",
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
          marginBottom:
            "40px",
          color:
            "#38bdf8"
        }}
      >
        🔥 SPORTS PICKS IA
      </h1>

      <section
        style={{
          marginBottom:
            "50px"
        }}
      >

        <h2
          style={{
            color:
              "#22c55e"
          }}
        >
          🚀 PICKS IA
        </h2>

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
                    "#1e293b",
                  padding:
                    "20px",
                  borderRadius:
                    "12px",
                  marginBottom:
                    "15px",
                  border:
                    "1px solid #334155"
                }}
              >

                <h3>
                  ⚽ {pick.partido}
                </h3>

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

              </div>
            )
          )
        }

      </section>

      <section
        style={{
          marginBottom:
            "50px"
        }}
      >

        <h2
          style={{
            color:
              "#f59e0b"
          }}
        >
          🔴 PICKS LIVE
        </h2>

        {
          livePicks.map(
            (
              pick,
              index
            ) => (

              <div
                key={index}
                style={{
                  background:
                    "#1e293b",
                  padding:
                    "20px",
                  borderRadius:
                    "12px",
                  marginBottom:
                    "15px",
                  border:
                    "1px solid #334155"
                }}
              >

                <h3>
                  ⚽ {pick.partido}
                </h3>

                <p>
                  ⏱️ Minuto:
                  {" "}
                  {pick.minuto}
                </p>

                <p>
                  🎯 {pick.mercado}
                </p>

                <p>
                  🚀 Confianza:
                  {" "}
                  {pick.confianza}%
                </p>

              </div>
            )
          )
        }

      </section>

      <section>

        <h2
          style={{
            color:
              "#f43f5e"
          }}
        >
          💰 TRUE SUREBETS
        </h2>

        {
          surebets.map(
            (
              bet,
              index
            ) => (

              <div
                key={index}
                style={{
                  background:
                    "#1e293b",
                  padding:
                    "20px",
                  borderRadius:
                    "12px",
                  marginBottom:
                    "15px",
                  border:
                    "1px solid #334155"
                }}
              >

                <h3>
                  ⚽ {bet.partido}
                </h3>

                <p>
                  📈 Beneficio:
                  {" "}
                  {bet.beneficio}
                </p>

                <p>
                  💵 Ganancia:
                  {" "}
                  {bet.ganancia}
                </p>

              </div>
            )
          )
        }

      </section>

    </div>
  );
}
