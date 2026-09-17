import { useState, useRef, useEffect } from 'react';
import { Send, Cpu, User, Sparkles, MessageSquare, Bot } from 'lucide-react';
import api from '../api/axios';

const QUICK_PROMPTS = [
  'How can I fill my missing skill gaps?',
  'Generate 3 interview prep questions for this role',
  'Suggest portfolio project ideas for my resume',
  'How do I rewrite vague experience bullets?',
];

function ResumeChat({ analysisId, initialChatHistory = [] }) {
  const [messages, setMessages] = useState(initialChatHistory);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chatBoxRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  };

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg = { sender: 'user', text: query, createdAt: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setError('');
    setLoading(true);

    try {
      const res = await api.post(`/analyses/${analysisId}/chat`, { message: query });
      if (res.data && res.data.reply) {
        setMessages(res.data.chatHistory || []);
      }
    } catch (err) {
      console.error('Failed to send chat message:', err);
      setError('Failed to get response from AI. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-[#141416] border border-[#222226] rounded-2xl shadow-xl overflow-hidden flex flex-col h-[560px]">
      {/* Header */}
      <div className="px-6 py-4 bg-[#0D0D0E] border-b border-[#222226] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-sm tracking-tight flex items-center gap-2">
              ProfileIQ AI Assistant
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Context
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Ask questions about your resume, missing skills, bullet rewrites & interview prep
            </p>
          </div>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-6 py-3 bg-[#080809] border-b border-[#222226] overflow-x-auto flex items-center gap-2 scrollbar-none">
        <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Quick Ask:
        </span>
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="px-3 py-1 bg-[#141416] hover:bg-[#222226] border border-[#222226] text-slate-300 text-xs font-semibold rounded-full shrink-0 transition-all cursor-pointer disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div ref={chatBoxRef} className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#0A0A0C]">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-extrabold text-white">Ask Anything About Your Resume</h4>
            <p className="text-xs text-slate-400 max-w-md font-medium leading-relaxed">
              "How can I rephrase my project experience?", "What questions will an interviewer ask?", or click one of the quick prompts above!
            </p>
          </div>
        )}

        {messages.some((m) => m.isFallback) && (
          <div className="mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] font-semibold text-amber-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span>⚠️ AI models currently in offline mode. Responses are generated using your local resume context & ATS evaluation.</span>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : msg.isFallback
                  ? 'bg-gradient-to-tr from-amber-500 to-orange-600 text-white'
                  : 'bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-[80%] p-4 rounded-2xl text-xs font-medium leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-[#141416] text-slate-200 border border-[#222226] rounded-tl-none whitespace-pre-wrap'
              }`}
            >
              {msg.text}
              {msg.isFallback && (
                <div className="mt-2 text-[10px] text-amber-400 font-semibold flex items-center gap-1 border-t border-[#222226] pt-1.5">
                  ⚡ Generated via Context-Aware Offline Engine
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#141416] text-cyan-400 border border-[#222226] p-4 rounded-2xl rounded-tl-none text-xs font-semibold flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing resume context & generating answer...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
            {error}
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-[#0D0D0E] border-t border-[#222226]">
        <div className="relative flex items-center">
          <textarea
            rows="1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI about your resume or job fit... (Enter to send)"
            className="w-full bg-[#141416] text-white placeholder-slate-500 text-xs font-medium pl-4 pr-12 py-3 rounded-xl border border-[#222226] focus:outline-none focus:border-cyan-500 transition-all resize-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white disabled:opacity-30 transition-all hover:scale-105 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResumeChat;
