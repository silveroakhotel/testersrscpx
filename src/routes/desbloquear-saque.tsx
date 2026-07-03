import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import videoAsset from "../assets/taxa-cadastro.mp4.asset.json";

export const Route = createFileRoute("/desbloquear-saque")({
  component: UnlockScreen,
  head: () => ({
    links: [
      { rel: "preload", as: "video", href: videoAsset.url, fetchpriority: "high" } as any,
    ],
  }),
});

function UnlockScreen() {
  const [secondsLeft, setSecondsLeft] = useState(44);
  const [unlocked, setUnlocked] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);

  const targetUrl = "/confirmar-saque" + window.location.search;

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
    window.location.href = targetUrl;
  };

  useEffect(() => {
    if (unlocked && videoEnded) {
      handleContinue();
    }
  }, [unlocked, videoEnded]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#f8f9fa",
        zIndex: 999999,
        display: "flex",
        flexDirection: "column",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        color: "#1a1a1a",
      }}
    >
      <header
        style={{
          background: "#ff0050",
          padding: "16px 20px",
          textAlign: "center",
          fontWeight: 700,
          fontSize: 18,
          color: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          flexShrink: 0,
        }}
      >
        Unlock Withdrawal
      </header>

      <main
        style={{
          flex: 1,
          padding: "24px 20px 100px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          maxWidth: 560,
          margin: "0 auto",
          width: "100%",
          overflowY: "auto",
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 800,
            textAlign: "center",
            margin: 0,
            lineHeight: 1.3,
            color: "#1a1a1a",
          }}
        >
          Assista ao vídeo abaixo para desbloquear seu saque
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#6c757d",
            textAlign: "center",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          É obrigatório assistir ao vídeo completo para continuar com o resgate da sua
          recompensa.
        </p>

        <div style={{ position: "relative", width: "100%" }}>
          {!videoReady && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "#e9ecef",
                borderRadius: 12,
                color: "#6c757d",
                fontSize: 14,
                gap: 12,
                minHeight: 200,
                zIndex: 1,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  border: "3px solid #dee2e6",
                  borderTopColor: "#ff0050",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span>Carregando vídeo...</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
          <video
            src={videoAsset.url}
            controls
            autoPlay
            playsInline
            preload="auto"
            onLoadedData={() => setVideoReady(true)}
            onCanPlay={() => setVideoReady(true)}
            onEnded={() => setVideoEnded(true)}
            style={{
              width: "100%",
              maxHeight: "calc(100vh - 280px)",
              display: "block",
              borderRadius: 12,
              background: "#e9ecef",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            }}
          />
        </div>
      </main>

      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "16px 20px calc(16px + env(safe-area-inset-bottom))",
          background: "#fff",
          borderTop: "1px solid #e9ecef",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.06)",
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: 560, margin: "0 auto", width: "100%" }}>
          <button
            onClick={handleContinue}
            disabled={!unlocked}
            style={{
              width: "100%",
              padding: "16px 20px",
              borderRadius: 999,
              border: "none",
              background: unlocked ? "#ff0050" : "#dee2e6",
              color: unlocked ? "#fff" : "#6c757d",
              fontSize: 16,
              fontWeight: 700,
              cursor: unlocked ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
              boxShadow: unlocked ? "0 4px 16px rgba(255,0,80,0.35)" : "none",
            }}
          >
            {unlocked
              ? "Desbloquear Saque"
              : `Aguarde ${secondsLeft}s para desbloquear...`}
          </button>
        </div>
      </div>
    </div>
  );
}
