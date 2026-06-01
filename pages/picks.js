import { useEffect, useState } from "react";

export default function Picks() {

  const [picks, setPicks] =
    useState([]);

  const [historial, setHistorial] =
    useState([]);

  useEffect(() => {

    fetch("/api/analisis-ia")
      .then(res => res.json())
      .then(data =>
        setPicks(
          data.picks || []
        )
      );

    fetch("/api/historial")
      .then(res => res.json())
      .then(data =>
        setHistorial(data)
      );

  }, []);

  const total =
    historial.length;

  const pendientes =
    historial.filter(
      h =>
        h.resultado ===
        "pendiente"
    ).length;

  const acertados =
    historial.filter(
      h =>
        h.resultado ===
        "acierto"
    ).length;

  const fallados =
    historial.filter(
      h =>
        h.resultado ===
        "fallo"
    ).length;

  const porcentaje =
    acertados + fallados > 0

      ? (
          (
            acertados /
            (
              acertados +
              fallados
            )
          ) * 100
        ).toFixed(1)

      : 0;

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
              "2px solid #38bdf8"
          }}
        >

          <h3>
            📊 TOTAL PICKS
          </h3>

          <h1>
            {total}
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
              "2px solid #22c55e"
          }}
        >

          <h3>
            ✅ ACIERTOS
          </h3>

          <h1>
            {acertados}
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
              "2px solid #ef4444"
          }}
        >

          <h3>
            ❌ FALLOS
          </h3>

          <h1>
            {fallados}
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
              "2px solid #f59e0b"
          }}
        >

          <h3>
            🚀 % ACIERTO
          </h3>

          <h1>
            {porcentaje}%
          </h1>

        </div>

      </div>

      <h2
        style={{
          marginBottom:
            "20px"
        }}
      >
        📜 HISTÓRICO PICKS
      </h2>

      {
        historial
          .slice()
          .reverse()
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
                    "1px solid #1e293b"
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
                  📅 {pick.fecha}
                </p>

                <p>
                  🚀 Confianza:
                  {" "}
                  {pick.confianza}%
                </p>

                <p>
                  📌 Estado:
                  {" "}

                  {
                    pick.resultado
                  }
                </p>

              </div>
            )
          )
      }

    </div>
  );
}
