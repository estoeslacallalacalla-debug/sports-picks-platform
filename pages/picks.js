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

  const getColor = (
    confianza
  ) => {

    if (
      confianza >= 90
    ) return "#22c55e";

    if (
      confianza >= 80
    ) return "#f59e0b";

    return "#ef4444";
  };

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
          marginBottom:
            "40px",
          color:
            "#38bdf8",
          fontSize:
            "40px"
        }}
      >
        🔥 SPORTS PICKS IA PRO
      </h1>

      <section
        style={{
          marginBottom:
            "60px"
        }}
      >

        <h2
          style={{
            color:
              "#22c55e",
            marginBottom:
              "20px"
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
                    "#0f172a",
                  padding:
                    "20px",
                  borderRadius:
                    "15px",
                  marginBottom:
                    "20px",
                  border:
                    `2px solid ${getColor(
                      pick.confianza
                    )}`
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
                  📊 Promedio goles:
                  {" "}
                  {pick.promedio}
                </p>

                <p>
                  ⚔️ Ataque local:
                  {" "}
                  {pick.golesLocal}
                </p>

                <p>
                  ⚔️ Ataque visitante:
                  {" "}
                  {pick.golesVisitante}
                </p>

                <div
                  style={{
                    marginTop:
                      "15px"
                  }}
                >

                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between"
                    }}
                  >

                    <span>
                      🚀 Confianza
                    </span>

                    <span>
                      {pick.confianza}%
                    </span>

                  </div>

                  <div
                    style={{
                      width:
                        "100%",
                      height:
                        "12px",
                      background:
                        "#1e293b",
                      borderRadius:
                        "20px",
                      overflow:
                        "hidden",
                      marginTop:
                        "5px"
                    }}
                  >

                    <div
                      style={{
                        width:
                          `${pick.confianza}%`,
                        height:
                          "100%",
                        background:
                          getColor(
                            pick.confianza
                          )
                      }}
                    />

                  </div>

                </div>

              </div>
            )
          )
        }

      </section>

      <section
        style={{
          marginBottom:
            "60px"
        }}
      >

        <h2
          style={{
            color:
              "#f59e0b",
            marginBottom:
              "20px"
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
                    "#0f172a",
                  padding:
                    "20px",
                  borderRadius:
                    "15px",
                  marginBottom:
                    "20px",
                  border:
                    "2px solid #f59e0b"
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
              "#f43f5e",
            marginBottom:
              "20px"
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
                    "#0f172a",
                  padding:
                    "20px",
                  borderRadius:
                    "15px",
                  marginBottom:
                    "20px",
                  border:
                    "2px solid #f43f5e"
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
