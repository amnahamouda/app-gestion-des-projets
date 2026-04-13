import { useState } from "react";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Salut 👋 كيف نجم نعاونك؟" }
  ]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [
      ...messages,
      { role: "user", text: input }
    ];

    setMessages(newMessages);
    setInput("");

    // هنا تربط backend متاعك
    const res = await fetch("http://localhost:5000/api/chatbot/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input })
    });

    const data = await res.json();

    setMessages([
      ...newMessages,
      { role: "bot", text: data.reply }
    ]);
  };

  return (
    <>
   <button
  onClick={() => setOpen(!open)}
  className="fixed bottom-5 right-5 bg-white p-3 rounded-full shadow-lg hover:scale-110 transition border"
>
  <img
    src="https://cdn-icons-png.flaticon.com/512/4712/4712027.png"
    className="w-10 h-10"
  />
</button>

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
    <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-gray-50">
      {messages.map((m, i) => (
        <div
          key={i}
          className={`p-3 rounded-xl text-sm max-w-[80%] ${
            m.role === "user"
              ? "bg-blue-500 text-white ml-auto"
              : "bg-white shadow"
          }`}
        >
          {m.text}
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
      />
      <button
        onClick={sendMessage}
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