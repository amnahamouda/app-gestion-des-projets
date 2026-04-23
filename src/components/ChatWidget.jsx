/**
 * components/ChatWidget.jsx
 * ==========================
 * Widget de chat flottant à intégrer dans ta plateforme React.
 *
 * Fonctionnalités :
 * - Icône flottante en bas à droite
 * - Fenêtre de chat qui s'ouvre/ferme
 * - Historique des messages
 * - Indicateur de frappe (animation "...")
 * - Bouton "Nouvelle conversation"
 * - Gestion des erreurs
 *
 * Utilisation dans App.jsx ou Layout.jsx :
 *     import ChatWidget from './components/ChatWidget';
 *     <ChatWidget />
 *
 * Prérequis :
 *     npm install axios   (ou utilise fetch natif)
 */

import React, { useState, useRef, useEffect } from "react";

// Icône simple en SVG — pas besoin d'une librairie externe
const ChatIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path
      d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
      fill="white"
      stroke="white"
      strokeWidth="1"
    />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Bonjour ! Je suis votre assistant de gestion de projets. Comment puis-je vous aider ?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus sur l'input quand la fenêtre s'ouvre
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    // Ajoute le message de l'utilisateur immédiatement
    const userMsg = { role: "user", content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Récupère le token depuis localStorage (adapte selon ton système d'auth)
      const token = localStorage.getItem("mdw-token") || sessionStorage.getItem("mdw-token");
      const user = JSON.parse(localStorage.getItem("user"));
      const response = await fetch("http://localhost:5001/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
          user_id: user?.id,      // ✅ هذا هو الحل
          role: user?.role,
        }),
      });

      const data = await response.json();

      // Sauvegarde le session_id pour la continuité de la conversation
      if (data.session_id && !sessionId) {
        setSessionId(data.session_id);
      }

      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response,
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response || "⚠️ Une erreur s'est produite. Réessayez.",
            timestamp: new Date(),
            isError: true,
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Impossible de contacter le service. Vérifiez votre connexion.",
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = async () => {
    // Efface côté serveur
    if (sessionId) {
      try {
        const token = localStorage.getItem("mdw-token");
        await fetch("/api/chatbot/clear", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ session_id: sessionId }),
        });
      } catch (_) {}
    }

    // Réinitialise côté client
    setSessionId(null);
    setMessages([
      {
        role: "assistant",
        content: "Nouvelle conversation démarrée. Comment puis-je vous aider ?",
        timestamp: new Date(),
      },
    ]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) =>
    date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  // Suggestions rapides
  const quickReplies = [
    "Quels projets sont en cours ?",
    "Quelles tâches sont en retard ?",
    "Montre-moi mes tâches",
    "Quel est l'avancement global ?",
  ];

  return (
    <>
      {/* ── Bouton flottant ── */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(102, 126, 234, 0.5)",
          zIndex: 9999,
          transition: "transform 0.2s",
        }}
        title="Assistant IA"
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </button>

      {/* ── Fenêtre de chat ── */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            right: "24px",
            width: "380px",
            height: "560px",
            background: "var(--color-background-primary, #fff)",
            borderRadius: "16px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            zIndex: 9998,
            overflow: "hidden",
            border: "1px solid var(--color-border-tertiary, #e5e5e5)",
          }}
        >
          {/* En-tête */}
          <div
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                }}
              >
                🤖
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: "600", fontSize: "14px" }}>
                  Assistant Projets
                </div>
                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "12px" }}>
                  {isLoading ? "En train de répondre..." : "En ligne"}
                </div>
              </div>
            </div>
            <button
              onClick={clearConversation}
              title="Nouvelle conversation"
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: "8px",
                padding: "6px 8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: "#fff",
                fontSize: "12px",
              }}
            >
              <TrashIcon />
              Nouveau
            </button>
          </div>

          {/* Zone des messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "88%",
                    padding: "10px 14px",
                    borderRadius:
                      msg.role === "user"
                        ? "18px 18px 4px 18px"
                        : "18px 18px 18px 4px",
                    background:
                      msg.role === "user"
                        ? "linear-gradient(135deg, #667eea, #764ba2)"
                        : msg.isError
                        ? "var(--color-background-danger, #fff0f0)"
                        : "var(--color-background-secondary, #f5f5f5)",
                    color:
                      msg.role === "user"
                        ? "#fff"
                        : "var(--color-text-primary, #333)",
                    fontSize: "13.5px",
                    lineHeight: "1.55",
                    whiteSpace: "pre-wrap",     // préserve les sauts de ligne du LLM
                    wordBreak: "break-word",
                  }}
                >
                  {msg.content}
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--color-text-tertiary, #999)",
                    marginTop: "3px",
                    padding: "0 4px",
                  }}
                >
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            ))}

            {/* Indicateur de frappe */}
            {isLoading && (
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "18px 18px 18px 4px",
                    background: "var(--color-background-secondary, #f5f5f5)",
                    display: "flex",
                    gap: "4px",
                    alignItems: "center",
                  }}
                >
                  {[0, 1, 2].map((n) => (
                    <span
                      key={n}
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        background: "#999",
                        animation: `bounce 1.2s ${n * 0.2}s ease-in-out infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions rapides (affichées seulement au début) */}
          {messages.length <= 1 && (
            <div
              style={{
                padding: "0 12px 8px",
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
              }}
            >
              {quickReplies.map((qr) => (
                <button
                  key={qr}
                  onClick={() => {
                    setInput(qr);
                    setTimeout(sendMessage, 0);
                  }}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "12px",
                    border: "1px solid #667eea",
                    background: "transparent",
                    color: "#667eea",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* Zone de saisie */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: "1px solid var(--color-border-tertiary, #eee)",
              display: "flex",
              gap: "8px",
              alignItems: "flex-end",
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question..."
              rows={1}
              style={{
                flex: 1,
                border: "1px solid var(--color-border-secondary, #ddd)",
                borderRadius: "12px",
                padding: "9px 12px",
                fontSize: "13.5px",
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                lineHeight: "1.4",
                maxHeight: "100px",
                overflowY: "auto",
                background: "var(--color-background-primary, #fff)",
                color: "var(--color-text-primary, #333)",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background:
                  !input.trim() || isLoading
                    ? "var(--color-border-secondary, #ddd)"
                    : "linear-gradient(135deg, #667eea, #764ba2)",
                border: "none",
                cursor: !input.trim() || isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: !input.trim() || isLoading ? "#999" : "#fff",
                flexShrink: 0,
              }}
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}

      {/* Animation bounce pour l'indicateur de frappe */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}
