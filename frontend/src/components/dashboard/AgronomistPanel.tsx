import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Bot, User } from "lucide-react";
import Card from "./Shared/Card";

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

const GREETING: ChatMessage = {
  role: "ai",
  text: "Xin chào!\n\nTôi là AI Agronomist.\n\nTôi có thể hỗ trợ:\n\n• Nhận biết bệnh.\n• Giải thích triệu chứng.\n• Đưa ra khuyến nghị chăm sóc.\n• Phân tích dữ liệu trang trại.",
};

const AI_FALLBACK = "Hệ thống AI sẽ được tích hợp ở phiên bản tiếp theo.";

interface RecommendationRow {
  id: number;
  treeId: string;
  riskScore: number;
  status: string;
  farm: string;
  zone: string;
  disease: string;
}

interface AgronomistPanelProps {
  priorityTrees: RecommendationRow[];
  farmStatus: string;
  kpiHealthyCount: number;
  kpiMonitoringCount: number;
  kpiDiseasedCount: number;
  alertCounts: { high: number; medium: number; low: number };
  highRiskCount: number;
}

export default function AgronomistPanel(_props: AgronomistPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text },
      { role: "ai", text: AI_FALLBACK },
    ]);
    setInput("");
  };

  const handleClear = () => {
    setMessages([GREETING]);
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden" padding={false} hover={false}>
      <div className="flex flex-col h-full p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-[18px]" aria-hidden="true">🤖</span>
            <div>
              <h3 className="text-[16px] font-bold text-gray-900 tracking-tight">AI Agronomist</h3>
              <p className="text-[11px] text-gray-400 font-medium">Chuyên gia AI hỗ trợ nông nghiệp</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-[8px] text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-200"
            aria-label="Xóa hội thoại"
            title="Xóa hội thoại"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-3 pb-2"
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "ai" && (
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-emerald-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-[12px] px-3 py-2 text-[12px] leading-relaxed whitespace-pre-line ${
                  msg.role === "user"
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {msg.text}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-100">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            placeholder="Hỏi AI về cây sầu riêng..."
            className="flex-1 px-3 py-2 rounded-[10px] border border-gray-200 text-[12px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300"
          />
          <button
            type="button"
            onClick={handleSend}
            className="px-3 py-2 rounded-[10px] bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold transition-colors duration-200 flex items-center gap-1.5 flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            Gửi
          </button>
        </div>
      </div>
    </Card>
  );
}
