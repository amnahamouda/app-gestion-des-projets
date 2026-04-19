import { useState } from "react";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Salut 👋 كيف نجم نعاونك؟" }
  ]);
  const [input, setInput] = useState("");

  // ================= SEND MESSAGE =================
  const sendMessage = async (customText?: string) => {
    const text = customText || input;

    if (!text.trim()) return;

    const newMessages = [...messages, { role: "user", text }];

    setMessages(newMessages);
    setInput("");

    try {
      const res = await fetch("http://localhost:5000/api/chatbot/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });

      const data = await res.json();

      setMessages([
        ...newMessages,
        {
          role: "bot",
          text: data.reply || "❌ Pas de réponse",
          suggestions: data.suggestions || []
        }
      ]);

    } catch (err) {
      setMessages([
        ...newMessages,
        { role: "bot", text: "❌ Erreur serveur" }
      ]);
    }
  };

  return (
    <>
      {/* BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 bg-white p-3 rounded-full shadow-lg hover:scale-110 transition border"
      >
        <img
          src="https://cdn-icons-png.flaticon.com/512/4712/4712027.png"
          className="w-10 h-10"
        />
      </button>

      {/* CHAT WINDOW */}
      {open && (
        <div className="fixed bottom-24 right-5 w-[420px] h-[600px] bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden border">

          {/* HEADER */}
          <div className="bg-blue-600 text-white p-3 flex items-center gap-2">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4712/4712027.png"
              className="w-8 h-8"
            />
            <span className="font-bold">AI Chatbot</span>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {messages.map((msg, index) => (
              <div key={index}>
                
                {/* MESSAGE */}
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white ml-auto"
                      : "bg-white border"
                  }`}
                >
                  {msg.text}
                </div>

                {/* SUGGESTIONS */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {msg.suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(s)}
                        className="bg-gray-200 px-2 py-1 rounded text-xs hover:bg-gray-300"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* INPUT */}
          <div className="p-3 border-t flex gap-2 bg-white">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 border rounded-xl px-3 py-2 text-sm"
              placeholder="Écrire un message..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={() => sendMessage()}
              className="bg-blue-600 text-white px-4 rounded-xl"
            >
              Envoyer
            </button>
          </div>

        </div>
      )}
    </>
  );
}