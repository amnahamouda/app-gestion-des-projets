import React, { useState, useRef, useEffect } from "react";

// ─── Icons ────────────────────────────────────────────────────────────────────
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
const ImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
    <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2" />
    <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Token ────────────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("mdw-token") ||
  sessionStorage.getItem("mdw-token") ||
  localStorage.getItem("token");

const API = "http://localhost:5000/api";

// ─── Markdown simple renderer ─────────────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ChatWidget() {
  const [isOpen, setIsOpen]           = useState(false);
  const [messages, setMessages]       = useState([
    {
      role: "assistant",
      content: "Bonjour ! Je suis votre assistant de gestion de projets 🤖\n\nVous pouvez :\n📝 Poser des questions sur vos projets\n📎 Uploader un document PDF/DOCX\n🖼️ Envoyer une image pour analyse",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput]             = useState("");
  const [isLoading, setIsLoading]     = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview]   = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [docLoaded, setDocLoaded]     = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const fileInputRef   = useRef(null);
  const imageInputRef  = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const addMessage = (msg) =>
    setMessages((prev) => [...prev, { timestamp: new Date(), ...msg }]);

  // ─── Send text ──────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    addMessage({ role: "user", content: text });
    setInput("");
    setIsLoading(true);

    try {
      const res  = await fetch(`${API}/chatbot/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      addMessage({
        role: "assistant",
        content: res.ok ? (data.reply || "⚠️ Pas de réponse.") : (data.error || "⚠️ Erreur."),
        isError: !res.ok,
      });
    } catch {
      addMessage({ role: "assistant", content: "⚠️ Impossible de contacter le service.", isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Send document ──────────────────────────────────────────────────────────
  const sendDocument = async () => {
    if (!uploadedFile || isUploading) return;

    const question = input.trim() || "Fais un résumé de ce document en français.";
    addMessage({
      role: "user",
      content: `📎 **${uploadedFile.name}**\n❓ ${question}`,
      isDoc: true,
    });
    setInput("");
    setIsUploading(true);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("message", question);

      const res  = await fetch(`${API}/chatbot/document`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setDocLoaded(uploadedFile.name);
        addMessage({
          role: "assistant",
          content: `✅ Document **${uploadedFile.name}** analysé !\n\n${data.reply}`,
        });
      } else {
        addMessage({
          role: "assistant",
          content: `❌ ${data.error || "Impossible d'analyser le document."}`,
          isError: true,
        });
      }
    } catch {
      addMessage({ role: "assistant", content: "⚠️ Erreur lors de l'envoi du document.", isError: true });
    } finally {
      setUploadedFile(null);
      setIsUploading(false);
      setIsLoading(false);
    }
  };

  // ─── Send image ─────────────────────────────────────────────────────────────
  const sendImage = async () => {
    if (!uploadedImage || isUploading) return;

    const question = input.trim() || "Décris cette image en français.";
    addMessage({
      role: "user",
      content: `🖼️ **${uploadedImage.name}**\n❓ ${question}`,
      isImage: true,
      imagePreview,
    });
    setInput("");
    setIsUploading(true);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadedImage);
      formData.append("message", question);

      const res  = await fetch(`${API}/chatbot/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();

      addMessage({
        role: "assistant",
        content: res.ok
          ? `🖼️ Analyse de l'image :\n\n${data.reply}`
          : `❌ ${data.error || "Impossible d'analyser l'image."}`,
        isError: !res.ok,
      });
    } catch {
      addMessage({ role: "assistant", content: "⚠️ Erreur lors de l'envoi de l'image.", isError: true });
    } finally {
      setUploadedImage(null);
      setImagePreview(null);
      setIsUploading(false);
      setIsLoading(false);
    }
  };

  // ─── File handlers ──────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file);
    setUploadedImage(null);
    setImagePreview(null);
    e.target.value = "";
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedImage(file);
    setUploadedFile(null);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ─── Clear ──────────────────────────────────────────────────────────────────
  const clearConversation = async () => {
    try {
      await fetch(`${API}/chatbot/history`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch (_) {}
    setDocLoaded(null);
    setUploadedFile(null);
    setUploadedImage(null);
    setImagePreview(null);
    setMessages([{
      role: "assistant",
      content: "Nouvelle conversation démarrée. Comment puis-je vous aider ?",
      timestamp: new Date(),
    }]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (uploadedImage) sendImage();
      else if (uploadedFile) sendDocument();
      else sendMessage();
    }
  };

  const handleSendClick = () => {
    if (uploadedImage) sendImage();
    else if (uploadedFile) sendDocument();
    else sendMessage();
  };

  const formatTime = (date) =>
    date?.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) || "";

  const quickReplies = [
    "Projets en cours ?",
    "Tâches en retard ?",
    "Avancement global ?",
    "Liste de l'équipe ?",
  ];

  const isSendDisabled =
    (!input.trim() && !uploadedFile && !uploadedImage) || isLoading || isUploading;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Bouton flottant */}
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

      {/* Fenêtre chat */}
      {isOpen && (
        <div style={{
          position: "fixed", bottom: "90px", right: "24px",
          width: "385px", height: "600px",
          background: "var(--color-background-primary, #fff)",
          borderRadius: "16px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column",
          zIndex: 9998, overflow: "hidden",
          border: "1px solid var(--color-border-tertiary, #e5e5e5)",
        }}>

          {/* Header */}
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
                  {isLoading ? "⏳ En train de répondre..." : docLoaded ? `📄 ${docLoaded}` : "🟢 En ligne"}
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

          {/* Bannière doc actif */}
          {docLoaded && (
            <div style={{
              background: "#f0fdf4", borderBottom: "1px solid #bbf7d0",
              padding: "6px 14px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              fontSize: "12px", color: "#15803d",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FileIcon />
                <span>Document actif : <strong>{docLoaded}</strong></span>
              </div>
              <button onClick={() => setDocLoaded(null)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#15803d", fontSize: "16px",
              }}>×</button>
            </div>
          )}

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "12px",
            display: "flex", flexDirection: "column", gap: "10px",
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex", flexDirection: "column",
                alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                {/* Image preview dans message */}
                {msg.imagePreview && (
                  <img
                    src={msg.imagePreview}
                    alt="uploaded"
                    style={{
                      maxWidth: "200px", maxHeight: "150px",
                      borderRadius: "10px", marginBottom: "4px",
                      objectFit: "cover",
                    }}
                  />
                )}
                <div
                  style={{
                    maxWidth: "88%", padding: "10px 14px",
                    borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, #667eea, #764ba2)"
                      : msg.isError ? "#fff0f0"
                      : "var(--color-background-secondary, #f5f5f5)",
                    color: msg.role === "user" ? "#fff" : "var(--color-text-primary, #333)",
                    fontSize: "13.5px", lineHeight: "1.55",
                    wordBreak: "break-word",
                  }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
                <span style={{ fontSize: "11px", color: "#999", marginTop: "3px", padding: "0 4px" }}>
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
                      display: "inline-block",
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          {messages.length <= 1 && (
            <div style={{ padding: "0 12px 8px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {quickReplies.map((qr) => (
                <button key={qr} onClick={() => {
                  setInput(qr);
                  setTimeout(() => {
                    setMessages((prev) => [...prev, { role: "user", content: qr, timestamp: new Date() }]);
                    setInput("");
                    setIsLoading(true);
                    fetch(`${API}/chatbot/message`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getToken()}`,
                      },
                      body: JSON.stringify({ message: qr }),
                    })
                      .then((r) => r.json())
                      .then((data) => {
                        addMessage({ role: "assistant", content: data.reply || "⚠️ Pas de réponse." });
                      })
                      .catch(() => {
                        addMessage({ role: "assistant", content: "⚠️ Erreur.", isError: true });
                      })
                      .finally(() => setIsLoading(false));
                  }, 0);
                }} style={{
                  padding: "5px 10px", borderRadius: "12px",
                  border: "1px solid #667eea", background: "transparent",
                  color: "#667eea", fontSize: "12px", cursor: "pointer",
                  transition: "all 0.2s",
                }}>
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* Preview fichier / image sélectionné */}
          {(uploadedFile || uploadedImage) && (
            <div style={{
              margin: "0 12px 6px", padding: "8px 12px",
              background: uploadedImage ? "#fdf4ff" : "#eff6ff",
              border: `1px solid ${uploadedImage ? "#e9d5ff" : "#bfdbfe"}`,
              borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              fontSize: "12px", color: uploadedImage ? "#7e22ce" : "#1d4ed8",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {uploadedImage && imagePreview ? (
                  <img src={imagePreview} alt="preview" style={{
                    width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover",
                  }} />
                ) : <FileIcon />}
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {uploadedImage ? `🖼️ ${uploadedImage.name}` : `📎 ${uploadedFile.name}`}
                  </div>
                  <div style={{ color: "#93c5fd", fontSize: "11px" }}>
                    {((uploadedImage || uploadedFile).size / 1024).toFixed(0)} Ko
                  </div>
                </div>
              </div>
              <button onClick={() => {
                setUploadedFile(null);
                setUploadedImage(null);
                setImagePreview(null);
              }} style={{
                background: "none", border: "none", cursor: "pointer", fontSize: "18px", lineHeight: 1,
              }}>×</button>
            </div>
          )}

          {/* Zone de saisie */}
          <div style={{
            padding: "10px 12px",
            borderTop: "1px solid var(--color-border-tertiary, #eee)",
            display: "flex", gap: "6px", alignItems: "flex-end",
          }}>
            {/* Hidden inputs */}
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileChange} style={{ display: "none" }} />
            <input ref={imageInputRef} type="file" accept="image/*"
              onChange={handleImageChange} style={{ display: "none" }} />

            {/* Btn document */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Uploader un document (PDF, DOCX, TXT)"
              style={{
                width: "34px", height: "34px", borderRadius: "9px",
                background: uploadedFile ? "#eff6ff" : "var(--color-background-secondary, #f0f0f0)",
                border: uploadedFile ? "1px solid #667eea" : "1px solid transparent",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: uploadedFile ? "#667eea" : "#888", flexShrink: 0,
              }}
            ><UploadIcon /></button>

            {/* Btn image */}
            <button
              onClick={() => imageInputRef.current?.click()}
              title="Envoyer une image"
              style={{
                width: "34px", height: "34px", borderRadius: "9px",
                background: uploadedImage ? "#fdf4ff" : "var(--color-background-secondary, #f0f0f0)",
                border: uploadedImage ? "1px solid #a855f7" : "1px solid transparent",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: uploadedImage ? "#a855f7" : "#888", flexShrink: 0,
              }}
            ><ImageIcon /></button>

            {/* Textarea */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                uploadedImage ? "Question sur l'image (optionnel)..." :
                uploadedFile  ? "Question sur le document (optionnel)..." :
                "Posez votre question..."
              }
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

            {/* Btn send */}
            <button
              onClick={handleSendClick}
              disabled={isSendDisabled}
              title="Envoyer"
              style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: isSendDisabled
                  ? "#ddd"
                  : "linear-gradient(135deg, #667eea, #764ba2)",
                border: "none",
                cursor: isSendDisabled ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: isSendDisabled ? "#999" : "#fff",
                flexShrink: 0,
              }}
            >
              {isUploading
                ? <span style={{ fontSize: "14px", animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
                : <SendIcon />
              }
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