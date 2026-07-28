import React, { useState, useEffect, useRef } from "react";
import { X, Send, Sparkles, Bot, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { parseJsonResponse } from "../lib/safeFetch";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatBotProps {
  role: "manager" | "yl";
  userName: string;
  botName?: string;
}

function AIChatBotInner({ role, userName, botName = "AI Jember 1 Pro" }: AIChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const isDraggingRef = useRef(false);

  // Update initial welcome message when role, userName, or botName changes
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Halo ${role === "manager" ? "Manager Ahmad" : "Ibu " + userName}! Saya adalah **${botName}** 🚀. Saya terhubung langsung dengan database Jember 1 Anda.\n\nAnda bisa meminta saya untuk **menganalisa penjualan**, **mengevaluasi kinerja rute**, atau bahkan **bertanya apa saja di luar pekerjaan** seperti resep makanan, tips kesehatan, atau topik lainnya secara bebas. Ada yang bisa saya bantu hari ini?`,
        timestamp: new Date(),
      }
    ]);
  }, [role, userName, botName]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick suggestions based on user role
  const quickPrompts = role === "manager" ? [
    { label: "📊 Analisa Penjualan Tim", text: "Tolong berikan analisa mendalam performa penjualan tim Jember 1 bulan ini" },
    { label: "🏆 Siapa YL Terbaik?", text: "Siapa saja Yakult Lady dengan performa atau rata-rata penjualan harian tertinggi?" },
    { label: "⚠️ Evaluasi Retur (BB)", text: "Apakah ada YL yang memiliki tingkat retur balik botol (BB) terlalu tinggi?" },
    { label: "💡 Tanya Hal Bebas", text: "Berikan saya resep masakan sarapan pagi yang praktis, sehat, dan lezat!" }
  ] : [
    { label: "📈 Capaian Target Saya", text: "Bagaimana capaian target penjualan bulanan saya sejauh ini?" },
    { label: "💰 Estimasi Bonus Saya", text: "Berapa estimasi kompensasi atau bonus harian & bulanan saya bulan ini?" },
    { label: "🚀 Tips Pelanggan Baru", text: "Berikan tips cara efektif mendapatkan pelanggan baru saat canvassing di lapangan" },
    { label: "🌱 Tips Kesehatan Bebas", text: "Apa saja manfaat minum air hangat di pagi hari saat bangun tidur?" }
  ];

  // Auto scroll to bottom when messages list changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Prepare history formatted for API
      const history = (messages || []).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text,
          history: history,
          role: role,
          user_name: userName
        })
      });

      const data = await parseJsonResponse(response);

      if (response.ok && data && data.reply) {
        const assistantMessage: Message = {
          id: Math.random().toString(36).substring(7),
          role: "assistant",
          content: data.reply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || "Gagal memperoleh balasan dari AI.");
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage: Message = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: `⚠️ Maaf, terjadi kesalahan koneksi. Pastikan koneksi internet Anda stabil atau silakan coba lagi beberapa saat lagi.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button (Draggable) */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.05}
        onDragStart={() => { isDraggingRef.current = true; }}
        onDragEnd={() => {
          setTimeout(() => { isDraggingRef.current = false; }, 100);
        }}
        className="fixed bottom-24 right-4 z-[9999] touch-none cursor-grab active:cursor-grabbing"
        id="ai-chatbot-toggle-btn-container"
      >
        <button
          onClick={(e) => {
            if (isDraggingRef.current) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            setIsOpen(prev => !prev);
          }}
          id="ai-chatbot-toggle-btn"
          className={`p-3.5 rounded-full shadow-lg border text-white cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 touch-none ${
            isOpen 
              ? "bg-slate-800 border-slate-700 rotate-90" 
              : "bg-gradient-to-r from-red-600 to-rose-700 border-rose-500 hover:shadow-rose-500/20"
          }`}
          title={`Tanya ${botName} (Bisa Digeser)`}
        >
          {isOpen ? <X className="w-5 h-5" /> : (
            <div className="flex items-center gap-1.5 font-bold text-xs tracking-wider uppercase px-0.5">
              <Sparkles className="w-4 h-4 animate-pulse text-yellow-300" />
              <span>{botName}</span>
            </div>
          )}
        </button>
      </motion.div>

      {/* Expanded Chat Window (Draggable by Header) */}
      {isOpen && (
        <motion.div
          drag
          dragHandleClassName="chat-drag-handle"
          dragMomentum={false}
          dragElastic={0.05}
          id="ai-chatbot-window"
          className="fixed bottom-36 right-4 z-[9999] w-[92vw] sm:w-[380px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-150 flex flex-col overflow-hidden animate-fadeInUp touch-none"
          style={{
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 40px rgba(127, 29, 29, 0.15)"
          }}
        >
          {/* Header (Drag Handle) */}
          <div className="chat-drag-handle p-3.5 bg-gradient-to-r from-red-800 to-rose-950 border-b border-red-700 flex justify-between items-center text-white cursor-grab active:cursor-grabbing shrink-0 touch-none">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-600 rounded-lg">
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </div>
              <div>
                <h3 className="text-xs font-black tracking-wide uppercase">{botName}</h3>
                <p className="text-[9px] text-red-250 font-bold">Asisten Pintar & Analis Data</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg text-red-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-3.5 overflow-y-auto bg-slate-50 space-y-3.5">
            {(messages || []).map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 max-w-[85%] ${m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {m.role === "assistant" && (
                  <div className="w-6 h-6 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0 border border-red-200">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-2.5 rounded-xl text-[11px] leading-relaxed shadow-sm border ${
                    m.role === "user"
                      ? "bg-red-600 text-white border-red-500 rounded-tr-none"
                      : "bg-white text-slate-800 border-slate-150 rounded-tl-none"
                  }`}
                >
                  {/* Simplistic markdown bold parser to keep code fully static and robust */}
                  {m.content.split("\n").map((para, pIdx) => (
                    <p key={pIdx} className={pIdx > 0 ? "mt-1.5" : ""}>
                      {para.split("**").map((text, tIdx) => 
                        tIdx % 2 === 1 ? <strong key={tIdx} className="font-extrabold text-red-950 bg-red-50 px-0.5 rounded">{text}</strong> : text
                      )}
                    </p>
                  ))}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 max-w-[80%] mr-auto items-center">
                <div className="w-6 h-6 rounded-lg bg-red-100 text-red-700 flex items-center justify-center border border-red-200">
                  <Bot className="w-3.5 h-3.5 animate-bounce" />
                </div>
                <div className="p-3 bg-white text-slate-500 rounded-xl rounded-tl-none shadow-sm border border-slate-150 text-[10px] font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  <span>AI sedang menganalisis...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto whitespace-nowrap flex gap-1.5 scrollbar-thin">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p.text)}
                disabled={isLoading}
                className="inline-flex items-center gap-1 bg-slate-50 hover:bg-red-50 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded-lg px-2.5 py-1 text-[10px] font-bold text-slate-600 transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="p-2 border-t border-slate-100 bg-white flex gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Tanya ${botName} (Contoh: analisa penjualan / resep bakso)...`}
              disabled={isLoading}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      )}
    </>
  );
}

export default React.memo(AIChatBotInner);

