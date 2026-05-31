import { useEffect, useState } from "react";

export default function Picks() {

  const [picks, setPicks] =
    useState([]);

  const [livePicks, setLivePicks] =
    useState([]);

  const [surebets, setSurebets] =
    useState([]);

  const [filter, setFilter] =
    useState("all");

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

  const totalTop =
    picks.filter(
      p =>
        p.confianza >= 90
    ).length;

  const totalAlta =
    picks.filter(
      p =>
        p.confianza >= 80
    ).length;

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
          fontSize:
            "40px",
          marginBottom:
            "30px"
        }}
      >
        🔥 SPORTS PICKS IA PRO
      </h1>

      <div
        style={{
          display:
            "flex",
          gap:
            "15px",
          marginBottom:
            "30px",
          flexWrap:
            "wrap"
        }}
      >

        <button
          onClick={() =>
            setFilter("all")
          }
        >
          TODOS
        </button>

        <button
          onClick={() =>
            setFilter("top")
          }
        >
          PICKS TOP
        </button>

        <button
          onClick={() =>
            setFilter("live")
          }
        >
          LIVE
        </button>

        <button
          onClick={() =>
            setFilter("surebets")
          }
        >
          SUREBETS
        </button>

      </div>

      <div
        style={{
          display:
            "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap:
            "20px",
          marginBottom:
            "40px"
        }}
      >

        <div
          style={{
            background:
              "#0f172a",
            padding:
              "20px",
            borderRadius:
              "15px",
            border:
              "2px solid #22c55e"
          }}
        >

          <h3>
            🚀 PICKS TOP
          </h3>

          <h1>
            {totalTop}
          </h1>

        </div>

        <div
          style={{
            background:
              "#0f172a",
            padding:
              "20px",
            borderRadius:
              "15px",
            border:
              "2px solid #f59e0b"
          }}
        >

          <h3>
            ⭐ PICKS ALTOS
          </h3>

          <h1>
            {totalAlta}
          </h1>

        </div>

        <div
          style={{
            background:
              "#0f172a",
            padding:
              "20px",
            borderRadius:
              "15px",
            border:
              "2px solid #38bdf8"
          }}
        >

          <h3>
            🔴 LIVE
          </h3>

          <h1>
            {livePicks.length}
          </h1>

        </div>

        <div
          style={{
            background:
              "#0f172a",
            padding:
              "20px",
            borderRadius:
              "15px",
            border:
              "2px solid #f43f5e"
          }}
        >

          <h3>
            💰 SUREBETS
          </h3>

          <h1>
            {surebets.length}
          </h1>

        </div>

      </div>

      {
        (filter === "all" ||
        filter === "top") &&

        picks
          .filter(
            p =>
              filter !== "top" ||
              p.confianza >= 90
          )
          .map(
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
                  ⭐ Calidad:
                  {" "}
                  {pick.calidad}
                </p>

                <p>
                  📈 Forma local:
                  {" "}
                  {pick.formaHome}
                </p>

                <p>
                  📈 Forma visitante:
                  {" "}
                  {pick.formaAway}
                </p>

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
                      "10px"
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

                <p
                  style={{
                    marginTop:
                      "10px"
                  }}
                >
                  🚀 Confianza:
                  {" "}
                  {pick.confianza}%
                </p>

              </div>
            )
          )
      }

      {
        filter === "live" &&

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

              <h2>
                ⚽ {pick.partido}
              </h2>

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

      {
        filter === "surebets" &&

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

              <h2>
                ⚽ {bet.partido}
              </h2>

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

    </div>
  );
}
