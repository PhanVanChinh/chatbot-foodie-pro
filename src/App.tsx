import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, RefreshCw, Info, ChevronRight, MessageSquare, Utensils, MapPin, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatBot } from './services/ChatBotService';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  debugInfo?: any;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Chào mừng bạn đến với Foodie Deluxe! Tôi là trợ lý ảo của nhà hàng. Tôi có thể giúp gì cho bạn hôm nay?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [bot, setBot] = useState<ChatBot | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const instance = new ChatBot();
    setBot(instance);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !bot) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate bot processing
    setTimeout(() => {
      let responseText = '';
      let debugData = null;

      if (input.startsWith('/debug ')) {
        const query = input.slice(7);
        const prediction = bot.predict(query);
        debugData = prediction;
        responseText = `Chế độ Debug cho: "${query}"\n\nTop 3 dự đoán:\n${prediction.top3.map(p => `${p.tag}: ${(p.score * 100).toFixed(1)}%`).join('\n')}`;
      } else {
        responseText = bot.reply(input);
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'bot',
        timestamp: new Date(),
        debugInfo: debugData,
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 600);
  };

  const quickActions = [
    { label: 'Thực đơn', icon: <Utensils size={16} />, query: 'Cho tôi xem thực đơn' },
    { label: 'Đặt bàn', icon: <MessageSquare size={16} />, query: 'Tôi muốn đặt bàn' },
    { label: 'Địa chỉ', icon: <MapPin size={16} />, query: 'Nhà hàng ở đâu?' },
    { label: 'Giờ mở cửa', icon: <Clock size={16} />, query: 'Mấy giờ đóng cửa?' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans text-neutral-900">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center text-white shadow-md">
            <Utensils size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Foodie Deluxe</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-neutral-500 font-medium">Trợ lý ảo đang trực tuyến</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowDebug(!showDebug)}
          className={`p-2 rounded-full transition-colors ${showDebug ? 'bg-amber-100 text-amber-700' : 'hover:bg-neutral-100 text-neutral-400'}`}
          title="Chế độ Debug"
        >
          <Info size={20} />
        </button>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-3xl mx-auto w-full">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${
                  msg.sender === 'user' ? 'bg-neutral-800 text-white' : 'bg-amber-100 text-amber-700'
                }`}>
                  {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className="space-y-1">
                  <div className={`rounded-2xl px-4 py-3 shadow-sm whitespace-pre-wrap ${
                    msg.sender === 'user' 
                      ? 'bg-neutral-800 text-white rounded-tr-none' 
                      : 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-none'
                  }`}>
                    {msg.text}
                    {msg.debugInfo && showDebug && (
                      <div className="mt-3 pt-3 border-t border-neutral-100 text-[10px] font-mono text-neutral-400">
                        DEBUG: {msg.debugInfo.bestTag} ({ (msg.debugInfo.bestScore * 100).toFixed(1) }%)
                      </div>
                    )}
                  </div>
                  <div className={`text-[10px] text-neutral-400 px-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="bg-white border border-neutral-200 rounded-2xl px-4 py-2 flex gap-1">
                <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Footer / Input Area */}
      <footer className="bg-white border-t border-neutral-200 p-4 md:p-6 sticky bottom-0 z-10">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Quick Actions */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => {
                  setInput(action.query);
                  // Optional: auto-send
                }}
                className="flex items-center gap-2 whitespace-nowrap px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-amber-50 hover:text-amber-700 border border-transparent hover:border-amber-200 text-xs font-medium transition-all"
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi của bạn tại đây..."
              className="w-full bg-neutral-100 border-none rounded-2xl pl-5 pr-14 py-4 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none text-sm"
            />
            <button
              type="submit"
              disabled={!input.trim() || !bot}
              className="absolute right-2 p-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50 disabled:hover:bg-amber-600 transition-all shadow-sm"
            >
              <Send size={18} />
            </button>
          </form>
          <p className="text-[10px] text-center text-neutral-400">
            Hệ thống sử dụng TF-IDF & Fuzzy Matching để hiểu ý định của bạn.
          </p>
        </div>
      </footer>

      {/* Debug Overlay */}
      {showDebug && (
        <div className="fixed top-20 right-6 w-64 bg-white/90 backdrop-blur-md border border-neutral-200 rounded-2xl shadow-2xl p-4 z-50 text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <span className="font-bold text-neutral-700">ChatBot Stats</span>
            <RefreshCw size={12} className="text-neutral-400 cursor-pointer" onClick={() => window.location.reload()} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-500">Intents:</span>
              <span className="font-mono font-bold">50+</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Algorithm:</span>
              <span className="font-mono">TF-IDF</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Similarity:</span>
              <span className="font-mono">Cosine</span>
            </div>
          </div>
          <div className="pt-2 border-t border-neutral-100">
            <p className="text-neutral-400 italic">Mẹo: Gõ "/debug [câu]" để xem chi tiết điểm số.</p>
          </div>
        </div>
      )}
    </div>
  );
}
