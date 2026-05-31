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

  const [favorites, setFavorites] =
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

  const toggleFavorite = (
    partido
  ) => {

    if (
      favorites.includes(
        partido
      )
    ) {

      setFavorites(
        favorites.filter(
          f =>
            f !== partido
        )
      );

    } else {

      setFavorites([
        ...favorites,
        partido
      ]);
    }
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

  const rankingLigas = {};

  picks.forEach(
    pick => {

      if (
        !rankingLigas[
          pick.liga
        ]
      ) {

        rankingLigas[
          pick.liga
        ] = 0;
      }

      rankingLigas[
        pick.liga
      ] += 1;
    }
  );

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
            "42px",
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
            "12px",
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
            setFilter("favorites")
          }
        >
          FAVORITOS
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
              "20px",
            border:
              "2px solid #22c55e",
            boxShadow:
              "0 0 20px rgba(34,197,94,0.3)"
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
              "20px",
            border:
              "2px solid #f59e0b",
            boxShadow:
              "0 0 20px rgba(245,158,11,0.3)"
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
              "20px",
            border:
              "2px solid #38bdf8",
            boxShadow:
              "0 0 20px rgba(56,189,248,0.3)"
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
              "20px",
            border:
              "2px solid #f43f5e",
            boxShadow:
              "0 0 20px rgba(244,63,94,0.3)"
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

      <div
        style={{
          background:
            "#0f172a",
          padding:
            "20px",
          borderRadius:
            "20px",
          marginBottom:
            "40px"
        }}
      >

        <h2>
          🏆 Ranking ligas
        </h2>

        {
          Object.entries(
            rankingLigas
          ).map(
            (
              liga,
              index
            ) => (

              <p key={index}>
                {liga[0]}
                {" — "}
                {liga[1]} picks
              </p>
            )
          )
        }

      </div>

      {
        (filter === "all" ||
        filter === "top" ||
        filter === "favorites") &&

        picks
          .filter(
            p => {

              if (
                filter ===
                "top"
              ) {

                return (
                  p.confianza >= 90
                );
              }

              if (
                filter ===
                "favorites"
              ) {

                return favorites.includes(
                  p.partido
                );
              }

              return true;
            }
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
                    "20px",
                  marginBottom:
                    "20px",
                  border:
                    `2px solid ${getColor(
                      pick.confianza
                    )}`,
                  transition:
                    "0.3s",
                  boxShadow:
                    "0 0 20px rgba(0,0,0,0.4)"
                }}
              >

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center"
                  }}
                >

                  <h2>
                    ⚽ {pick.partido}
                  </h2>

                  <button
                    onClick={() =>
                      toggleFavorite(
                        pick.partido
                      )
                    }
                  >

                    {
                      favorites.includes(
                        pick.partido
                      )

                        ? "⭐"

                        : "☆"
                    }

                  </button>

                </div>

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

    </div>
  );
}
