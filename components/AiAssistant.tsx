import React, { useState, useRef, useEffect } from 'react';
import { Club } from '../types';
import { chatWithAi } from '../services/geminiService';
import { getOrCreateLatestConversation, getMessages, addMessage, Message } from '../services/conversationService';
import { Send, X, Bot, Loader2, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface AiAssistantProps {
  club: Club;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ club }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversation history when component mounts or club changes
  useEffect(() => {
    const loadConversation = async () => {
      try {
        const conversation = await getOrCreateLatestConversation(club.id);

        if (!conversation) {
          setConversationId('local');
          setMessages([
            { id: 'welcome', conversation_id: 'local', role: 'assistant', content: `Hey! I'm The Gaffer, your AI assistant. How can I help with ${club.name} today?`, created_at: new Date().toISOString() }
          ]);
          setIsLoadingHistory(false);
          return;
        }

        setConversationId(conversation.id);

        const history = await getMessages(conversation.id);
        if (history.length > 0) {
          setMessages(history);
        } else {
          setMessages([
            { id: 'welcome', conversation_id: conversation.id, role: 'assistant', content: `Hey! I'm The Gaffer, your AI assistant. How can I help with ${club.name} today?`, created_at: new Date().toISOString() }
          ]);
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
        setConversationId('local');
        setMessages([
          { id: 'welcome', conversation_id: 'local', role: 'assistant', content: `Hey! I'm The Gaffer, your AI assistant. How can I help with ${club.name} today?`, created_at: new Date().toISOString() }
        ]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadConversation();
  }, [club.id, club.name]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isFullscreen]);

  // Focus input when opening or switching modes
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isFullscreen]);

  // Handle escape key to close fullscreen
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else if (isOpen) {
          setIsOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isFullscreen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !conversationId) return;

    const userText = input.trim();
    setInput('');
    setIsLoading(true);

    const isLocalMode = conversationId === 'local';

    try {
      const userMsg: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        role: 'user',
        content: userText,
        created_at: new Date().toISOString(),
      };

      if (!isLocalMode) {
        const savedUserMsg = await addMessage(conversationId, 'user', userText);
        if (savedUserMsg) {
          userMsg.id = savedUserMsg.id;
        }
      }
      setMessages(prev => [...prev, userMsg]);

      const historyForAI = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }))
        .slice(-10);
      historyForAI.push({ role: 'user', content: userText });

      const response = await chatWithAi(club, userText, historyForAI);

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        role: 'assistant',
        content: response,
        created_at: new Date().toISOString(),
      };

      if (!isLocalMode) {
        const savedAiMsg = await addMessage(conversationId, 'assistant', response);
        if (savedAiMsg) {
          aiMsg.id = savedAiMsg.id;
        }
      }
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Error in chat:', error);
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Fullscreen Chat UI
  if (isFullscreen && isOpen) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0a0a0f] flex flex-col animate-fade-in">
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Bot size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold">The Gaffer</h1>
              <p className="text-xs text-slate-500">AI Assistant for {club.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Exit fullscreen"
            >
              <Minimize2 size={20} />
            </button>
            <button
              onClick={() => { setIsOpen(false); setIsFullscreen(false); }}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Close chat"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto py-8 px-4">
            {isLoadingHistory ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 size={24} className="animate-spin text-green-500" />
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                        : 'bg-gradient-to-br from-green-500 to-emerald-600'
                    }`}>
                      {msg.role === 'user' ? (
                        <span className="text-white text-sm font-bold">You</span>
                      ) : (
                        <Bot size={20} className="text-white" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={`flex-1 max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-medium ${msg.role === 'user' ? 'text-blue-400 ml-auto' : 'text-green-400'}`}>
                          {msg.role === 'user' ? 'You' : 'The Gaffer'}
                        </span>
                        <span className="text-xs text-slate-600">{formatTime(msg.created_at)}</span>
                      </div>
                      <div className={`rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-blue-600/20 border border-blue-500/30 text-slate-200 ml-auto'
                          : 'bg-white/5 border border-white/10 text-slate-300'
                      }`}>
                        {msg.role === 'user' ? (
                          <p className="text-sm">{msg.content || (msg as any).text}</p>
                        ) : (
                          <MarkdownRenderer
                            content={msg.content || (msg as any).text || ''}
                            className="text-sm prose-invert"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <Bot size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-green-400">The Gaffer</span>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 inline-flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin text-green-500" />
                        <span className="text-sm text-slate-400">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-white/10 bg-[#0a0a0f] p-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-14 py-4 text-white placeholder-slate-500 focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:hover:bg-green-600 rounded-lg flex items-center justify-center text-white transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
            <p className="text-center text-xs text-slate-600 mt-3">
              Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-slate-400">Esc</kbd> to exit fullscreen
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Compact Chat UI (original)
  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-20 md:bottom-6 right-4 md:right-6 h-14 w-14 rounded-full bg-green-500 text-white shadow-xl flex items-center justify-center transition-all hover:scale-105 hover:bg-green-600 z-40
          ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}
        `}
      >
        <Bot size={28} />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
      </button>

      {/* Compact Chat Interface */}
      <div className={`
        fixed bottom-20 md:bottom-6 right-4 md:right-6 left-4 md:left-auto w-auto md:w-[400px] max-h-[75vh] md:max-h-[600px] h-[75vh] md:h-[600px] bg-[#0a0a0f] rounded-2xl shadow-2xl border border-white/10 z-50 flex flex-col transition-all duration-300 transform origin-bottom-right overflow-hidden
        ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10 pointer-events-none'}
      `}>
        {/* Header */}
        <div className="bg-[#0a0a0f] border-b border-white/10 p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">The Gaffer</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsFullscreen(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Fullscreen mode"
            >
              <Maximize2 size={18} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0a0f]">
          {isLoadingHistory ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 size={20} className="animate-spin text-green-500" />
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Mini Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  msg.role === 'user'
                    ? 'bg-blue-600/30'
                    : 'bg-green-600/30'
                }`}>
                  {msg.role === 'user' ? (
                    <span className="text-blue-400 text-xs font-bold">U</span>
                  ) : (
                    <Sparkles size={14} className="text-green-400" />
                  )}
                </div>

                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600/20 border border-blue-500/30 text-slate-200 rounded-br-none'
                    : 'bg-white/5 border border-white/10 text-slate-300 rounded-bl-none'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="text-sm">{msg.content || (msg as any).text}</p>
                  ) : (
                    <MarkdownRenderer content={msg.content || (msg as any).text || ''} className="text-sm" />
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-600/30 flex items-center justify-center">
                <Sparkles size={14} className="text-green-400" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-green-500" />
                <span className="text-xs text-slate-400">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 bg-[#0a0a0f] border-t border-white/10">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for a tweet, email, idea..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-slate-500 focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:hover:bg-green-600 rounded-lg flex items-center justify-center text-white transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AiAssistant;
