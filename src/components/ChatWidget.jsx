import React, { useState, useRef, useEffect } from "react";

const ChatIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="white" stroke="white" strokeWidth="1" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const FileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const getToken = () =>
  localStorage.getItem("mdw-token") ||
  sessionStorage.getItem("mdw-token") ||
  localStorage.getItem("token");

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Bonjour ! Je suis votre assistant de gestion de projets. Vous pouvez me poser des questions ou 📎 uploader un document pour l'analyser.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null); // fichier sélectionné
  const [isUploading, setIsUploading] = useState(false);
  const [docLoaded, setDocLoaded] = useState(null); // nom du doc chargé en mémoire
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  // ─── Envoyer message texte ───────────────────────────────────────────────
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", content: text, timestamp: new Date() }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/chatbot/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.ok ? (data.reply || "⚠️ Pas de réponse.") : (data.error || "⚠️ Erreur."),
          timestamp: new Date(),
          isError: !response.ok,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Impossible de contacter le service.", timestamp: new Date(), isError: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Upload + analyser document ──────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file);
    // reset input file pour permettre re-upload du même fichier
    e.target.value = "";
  };

  const sendDocument = async () => {
    if (!uploadedFile || isUploading) return;

    const question = input.trim() || "Fais un résumé de ce document en français.";
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: `📎 Document envoyé : **${uploadedFile.name}**\n❓ ${question}`,
        timestamp: new Date(),
        isDoc: true,
      },
    ]);
    setInput("");
    setIsUploading(true);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("question", question);

      const response = await fetch("http://localhost:5000/api/documents/analyze", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setDocLoaded(uploadedFile.name);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `✅ Document **${uploadedFile.name}** chargé et analysé !\n\n${data.reply}`,
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `❌ Erreur : ${data.error || "Impossible d'analyser le document."}`,
            timestamp: new Date(),
            isError: true,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Erreur lors de l'envoi du document.", timestamp: new Date(), isError: true },
      ]);
    } finally {
      setUploadedFile(null);
      setIsUploading(false);
      setIsLoading(false);
    }
  };

  // ─── Clear conversation ──────────────────────────────────────────────────
  const clearConversation = async () => {
    try {
      await fetch("http://localhost:5000/api/chatbot/history", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch (_) {}
    setDocLoaded(null);
    setUploadedFile(null);
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
      uploadedFile ? sendDocument() : sendMessage();
    }
  };

  const formatTime = (date) =>
    date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

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
          position: "fixed", bottom: "24px", right: "24px",
          width: "56px", height: "56px", borderRadius: "50%",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(102,126,234,0.5)",
          zIndex: 9999, transition: "transform 0.2s",
        }}
        title="Assistant IA"
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </button>

      {/* ── Fenêtre chat ── */}
      {isOpen && (
        <div style={{
          position: "fixed", bottom: "90px", right: "24px",
          width: "380px", height: "580px",
          background: "var(--color-background-primary, #fff)",
          borderRadius: "16px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column",
          zIndex: 9998, overflow: "hidden",
          border: "1px solid var(--color-border-tertiary, #e5e5e5)",
        }}>

          {/* ── Header ── */}
          <div style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "14px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
              }}>🤖</div>
              <div>
                <div style={{ color: "#fff", fontWeight: "600", fontSize: "14px" }}>Assistant Projets</div>
                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "12px" }}>
                  {isLoading ? "En train de répondre..." : docLoaded ? `📄 ${docLoaded}` : "En ligne"}
                </div>
              </div>
            </div>
            <button onClick={clearConversation} title="Nouvelle conversation" style={{
              background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px",
              padding: "6px 8px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "4px",
              color: "#fff", fontSize: "12px",
            }}>
              <TrashIcon /> Nouveau
            </button>
          </div>

          {/* ── Bannière doc chargé ── */}
          {docLoaded && (
            <div style={{
              background: "#f0fdf4", borderBottom: "1px solid #bbf7d0",
              padding: "6px 14px",
              display: "flex", alignItems: "center", gap: "6px",
              fontSize: "12px", color: "#15803d",
            }}>
              <FileIcon />
              <span>Document actif : <strong>{docLoaded}</strong> — posez vos questions !</span>
            </div>
          )}

          {/* ── Messages ── */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "12px",
            display: "flex", flexDirection: "column", gap: "10px",
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex", flexDirection: "column",
                alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "88%", padding: "10px 14px",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, #667eea, #764ba2)"
                    : msg.isError ? "#fff0f0"
                    : "var(--color-background-secondary, #f5f5f5)",
                  color: msg.role === "user" ? "#fff" : "var(--color-text-primary, #333)",
                  fontSize: "13.5px", lineHeight: "1.55",
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  {msg.content}
                </div>
                <span style={{ fontSize: "11px", color: "var(--color-text-tertiary, #999)", marginTop: "3px", padding: "0 4px" }}>
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <div style={{
                  padding: "12px 16px", borderRadius: "18px 18px 18px 4px",
                  background: "var(--color-background-secondary, #f5f5f5)",
                  display: "flex", gap: "4px", alignItems: "center",
                }}>
                  {[0, 1, 2].map((n) => (
                    <span key={n} style={{
                      width: "7px", height: "7px", borderRadius: "50%", background: "#999",
                      animation: `bounce 1.2s ${n * 0.2}s ease-in-out infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Quick replies ── */}
          {messages.length <= 1 && (
            <div style={{ padding: "0 12px 8px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {quickReplies.map((qr) => (
                <button key={qr} onClick={() => { setInput(qr); setTimeout(() => sendMessage(), 0); }} style={{
                  padding: "5px 10px", borderRadius: "12px",
                  border: "1px solid #667eea", background: "transparent",
                  color: "#667eea", fontSize: "12px", cursor: "pointer",
                }}>
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* ── Preview fichier sélectionné ── */}
          {uploadedFile && (
            <div style={{
              margin: "0 12px 6px",
              padding: "8px 12px",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              fontSize: "12px", color: "#1d4ed8",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FileIcon />
                <span style={{ fontWeight: 500 }}>{uploadedFile.name}</span>
                <span style={{ color: "#93c5fd" }}>({(uploadedFile.size / 1024).toFixed(0)} Ko)</span>
              </div>
              <button onClick={() => setUploadedFile(null)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#93c5fd", fontSize: "16px", lineHeight: 1,
              }}>×</button>
            </div>
          )}

          {/* ── Zone de saisie ── */}
          <div style={{
            padding: "10px 12px",
            borderTop: "1px solid var(--color-border-tertiary, #eee)",
            display: "flex", gap: "8px", alignItems: "flex-end",
          }}>
            {/* Bouton upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Uploader un document (PDF, DOCX, TXT)"
              style={{
                width: "38px", height: "38px", borderRadius: "10px",
                background: uploadedFile ? "#eff6ff" : "var(--color-background-secondary, #f0f0f0)",
                border: uploadedFile ? "1px solid #667eea" : "1px solid transparent",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: uploadedFile ? "#667eea" : "#888",
                flexShrink: 0,
              }}
            >
              <UploadIcon />
            </button>

            {/* Textarea */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={uploadedFile ? "Question sur le document (optionnel)..." : "Posez votre question..."}
              rows={1}
              style={{
                flex: 1, border: "1px solid var(--color-border-secondary, #ddd)",
                borderRadius: "12px", padding: "9px 12px",
                fontSize: "13.5px", resize: "none", outline: "none",
                fontFamily: "inherit", lineHeight: "1.4",
                maxHeight: "100px", overflowY: "auto",
                background: "var(--color-background-primary, #fff)",
                color: "var(--color-text-primary, #333)",
              }}
            />

            {/* Bouton envoyer */}
            <button
              onClick={uploadedFile ? sendDocument : sendMessage}
              disabled={(!input.trim() && !uploadedFile) || isLoading || isUploading}
              title={uploadedFile ? "Envoyer le document" : "Envoyer"}
              style={{
                width: "38px", height: "38px", borderRadius: "10px",
                background: ((!input.trim() && !uploadedFile) || isLoading || isUploading)
                  ? "#ddd"
                  : "linear-gradient(135deg, #667eea, #764ba2)",
                border: "none",
                cursor: ((!input.trim() && !uploadedFile) || isLoading || isUploading) ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: ((!input.trim() && !uploadedFile) || isLoading || isUploading) ? "#999" : "#fff",
                flexShrink: 0,
              }}
            >
              {isUploading ? (
                <span style={{ fontSize: "16px", animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
              ) : (
                <SendIcon />
              )}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}