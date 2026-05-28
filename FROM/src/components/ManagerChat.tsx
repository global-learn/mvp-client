import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Manager, ChatMessage } from '../types';
import { Send, PhoneCall, HelpCircle, Shield, ArrowRight, MessageSquare, Menu, Clock, ChevronDown, CheckCheck } from 'lucide-react';
import { sound } from '../utils/audio';
import { quickChatQuestions } from '../data/onboardingData';

interface ManagerChatProps {
  manager: Manager;
  messages: ChatMessage[];
  isTyping: boolean;
  onSendMessage: (text: string) => void;
  onQuickQuestion: (question: string) => void;
}

export default function ManagerChat({
  manager,
  messages,
  isTyping,
  onSendMessage,
  onQuickQuestion,
}: ManagerChatProps) {
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    sound.playClick();
    onSendMessage(inputText);
    setInputText('');
  };

  const handleQuickQuestionClick = (q: string) => {
    sound.playClick();
    onQuickQuestion(q);
  };

  return (
    <div className="bg-white border border-slate-250 rounded-2xl flex flex-col h-[580px] shadow-sm overflow-hidden text-left select-none">
      
      {/* Manager Info Ribbon */}
      <div className="bg-slate-50 border-b border-slate-150 py-3.5 px-4.5 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          
          {/* Circular Initials with Custom Department Gradient */}
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12.5px] font-extrabold shadow-sm flex-shrink-0"
            style={{ background: manager.avatarGradient }}
          >
            {manager.name.split(' ').map(n => n[0]).join('')}
          </div>

          <div className="min-w-0 flex flex-col leading-tight">
            <h4 className="text-[13px] font-extrabold text-slate-850 truncate">
              {manager.name}
            </h4>
            <span className="text-[10px] text-slate-500 truncate leading-none mt-0.5">
              {manager.role}
            </span>
          </div>
        </div>

        {/* Live Indicator Pillar */}
        <div className="flex items-center gap-1.5 shrink-0 bg-white border border-slate-200 py-1.5 px-2.5 rounded-xl shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          <span className="text-[10.5px] font-extrabold uppercase tracking-wide text-emerald-600">Онлайн</span>
        </div>
      </div>

      {/* Warnings & Help headers */}
      <div className="bg-blue-50/50 px-4 py-2 border-b border-slate-100 flex items-center gap-2 text-slate-500 flex-shrink-0">
        <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span className="text-[10px] sm:text-[10.5px] text-slate-650 font-semibold leading-tight">
          Чат модерируется комплаенс-службой ООО «Джи Эм Трейд»
        </span>
      </div>

      {/* Scrollable Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 bg-slate-50/20 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSystem = msg.sender === 'system';

            if (isSystem) {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center"
                >
                  <span className="text-[11px] text-slate-450 bg-slate-100/80 px-3 py-1 rounded-full border border-slate-150/40 text-center leading-snug">
                    {msg.text}
                  </span>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.98, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] shadow-2xs relative leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white font-medium rounded-tr-none border border-blue-700/30'
                    : 'bg-white border border-slate-200 text-slate-750 font-normal rounded-tl-none'
                }`}>
                  <p className="whitespace-pre-line">{msg.text}</p>
                  
                  <div className={`flex items-center gap-1.5 justify-end mt-1.5 font-mono text-[9px] leading-none ${
                    isUser ? 'text-blue-200' : 'text-slate-400'
                  }`}>
                    <span>{msg.timestamp}</span>
                    {isUser && <CheckCheck className="w-3.5 h-3.5 text-blue-100 stroke-[2.5]" />}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing Bubble */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start items-center gap-2"
          >
            {/* Tiny manager circle fallback */}
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[7px] font-extrabold flex-shrink-0"
              style={{ background: manager.avatarGradient }}
            >
              {manager.name.split(' ').map(n => n[0]).join('')}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-2.5 flex items-center gap-1">
              <span className="text-[11px] text-slate-450 mr-1.5 font-medium">{manager.name.split(' ')[0]} пишет</span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Inputs Container */}
      <div className="p-3 bg-white border-t border-slate-150 space-y-2.5 flex-shrink-0">
        
        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-track-transparent select-none no-scrollbar">
          <HelpCircle className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide shrink-0 mr-1">Быстрые вопросы:</span>
          {quickChatQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickQuestionClick(q)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-650 hover:text-blue-700 rounded-full text-[11px] font-semibold transition-all shrink-0 cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Text Entry form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isTyping}
            placeholder="Задать вопрос руководителю..."
            className="flex-1 h-10 px-3.5 text-[12.5px] bg-slate-50 border border-slate-250 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs active:scale-95 disabled:bg-slate-150 disabled:text-slate-400 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
