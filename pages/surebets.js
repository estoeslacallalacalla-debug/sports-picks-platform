import { useEffect, useState } from "react";

export default function Surebets() {
  const [surebets, setSurebets] =
    useState([]);

  useEffect(() => {
    fetch("/api/surebets")
      .then((res) => res.json())
      .then((data) => {
        setSurebets(data);
      });
  }, []);

  return (
    <div
      style={{
        backgroundColor: "#f0fff4",
        minHeight: "100vh",
        padding: "20px",
        fontFamily: "Arial"
      }}
    >
      <h1
        style={{
          color: "#16a34a"
        }}
      >
        💎 Surebets Detectadas
      </h1>

      {surebets.map((bet, index) => (
        <div
          key={index}
          style={{
            background: "white",
            padding: "15px",
            borderRadius: "12px",
            marginTop: "15px",
            border:
              bet.surebet
                ? "3px solid green"
                : "none"
          }}
        >
          <h3>
            ⚽ {bet.partido}
          </h3>

          <p>
            🎯 Mercado:{" "}
            {bet.mercado}
          </p>

          <p>
            🏦 {bet.casa1}:{" "}
            {bet.cuota1}
          </p>

          <p>
            🏦 {bet.casa2}:{" "}
            {bet.cuota2}
          </p>

          <p>
            🏦 {bet.casa3}:{" "}
            {bet.cuota3}
          </p>

          <p
            style={{
              color:
                bet.surebet
                  ? "green"
                  : "red",
              fontWeight: "bold"
            }}
          >
            {bet.surebet
              ? "✅ Surebet detectada"
              : "❌ No hay surebet"}
          </p>

          <p>
            💰 Ganancia
            estimada:{" "}
            {bet.ganancia}%
          </p>
        </div>
      ))}
    </div>
  );
}
