import React, { useState, useRef, useEffect } from 'react';
import { Club } from '../types';
import { chatWithAi } from '../services/geminiService';
import { getOrCreateLatestConversation, getMessages, addMessage, Message } from '../services/conversationService';
import { MessageSquare, Send, X, Bot, Loader2, Sparkles } from 'lucide-react';

interface AiAssistantProps {
  club: Club;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ club }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation history when component mounts or club changes
  useEffect(() => {
    const loadConversation = async () => {
      try {
        const conversation = await getOrCreateLatestConversation(club.id);

        // If no conversation (Supabase not configured), use local-only mode
        if (!conversation) {
          setConversationId('local');
          setMessages([
            { id: 'welcome', conversation_id: 'local', role: 'assistant', content: `Morning! I'm The Gaffer. Need a quick caption, email draft, or some ideas?`, created_at: new Date().toISOString() }
          ]);
          setIsLoadingHistory(false);
          return;
        }

        setConversationId(conversation.id);

        const history = await getMessages(conversation.id);
        if (history.length > 0) {
          setMessages(history);
        } else {
          // Show welcome message if no history
          setMessages([
            { id: 'welcome', conversation_id: conversation.id, role: 'assistant', content: `Morning! I'm The Gaffer. Need a quick caption, email draft, or some ideas?`, created_at: new Date().toISOString() }
          ]);
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
        setConversationId('local');
        setMessages([
          { id: 'welcome', conversation_id: 'local', role: 'assistant', content: `Morning! I'm The Gaffer. Need a quick caption, email draft, or some ideas?`, created_at: new Date().toISOString() }
        ]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadConversation();
  }, [club.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !conversationId) return;

    const userText = input.trim();
    setInput('');
    setIsLoading(true);

    const isLocalMode = conversationId === 'local';

    try {
      // Create user message
      const userMsg: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        role: 'user',
        content: userText,
        created_at: new Date().toISOString(),
      };

      // Save user message to database if not in local mode
      if (!isLocalMode) {
        const savedUserMsg = await addMessage(conversationId, 'user', userText);
        if (savedUserMsg) {
          userMsg.id = savedUserMsg.id;
        }
      }
      setMessages(prev => [...prev, userMsg]);

      // Get conversation history for AI context
      const historyForAI = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }))
        .slice(-10); // Last 10 messages for context
      historyForAI.push({ role: 'user', content: userText });

      // Get AI response
      const response = await chatWithAi(club, userText, historyForAI);

      // Create AI message
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        role: 'assistant',
        content: response,
        created_at: new Date().toISOString(),
      };

      // Save AI response to database if not in local mode
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

  return (
    <>
      {/* Trigger Button - positioned above mobile bottom nav */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
                fixed bottom-20 md:bottom-6 right-4 md:right-6 h-14 w-14 rounded-full bg-green-500 text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105 hover:bg-green-600 z-40
                ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
            `}
      >
        <Bot size={28} />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
      </button>

      {/* Chat Interface - positioned above mobile bottom nav */}
      <div className={`
            fixed bottom-20 md:bottom-6 right-4 md:right-6 left-4 md:left-auto w-auto md:w-[380px] max-h-[70vh] md:max-h-[550px] h-[70vh] md:h-[550px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col transition-all duration-300 transform origin-bottom-right overflow-hidden
            ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10 pointer-events-none'}
        `}>
        {/* Header */}
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-purple-500 flex items-center justify-center">
              <Bot size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm">The Gaffer</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-pitch-500 rounded-full"></span> Online
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {isLoadingHistory ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 size={20} className="animate-spin text-brand-500" />
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                                max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm
                                ${msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-br-none'
                    : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'}
                            `}>
                  {msg.content || (msg as any).text}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-brand-500" />
                <span className="text-xs text-slate-400">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-slate-100">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for a tweet, email, idea..."
              className="w-full bg-slate-100 border-none rounded-full pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-1 top-1 bottom-1 w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center text-white hover:bg-brand-700 disabled:opacity-50 disabled:hover:bg-brand-600 transition-colors"
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