"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Reset conversation when opening
  useEffect(() => {
    if (open) {
      setMsgs([]);
      
      // Focus the input field after a short delay to ensure it's rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  // Removed body scroll lock to prevent black screen issues



  const send = async () => {
    const text = inputRef.current?.value?.trim();
    
    if (!text || isLoading) return;
    
    inputRef.current!.value = "";
    setIsLoading(true);
    
    const next = [...msgs, { role: "user", content: text }];
    setMsgs(next);

    try {
      // Call the actual OpenAI API endpoint
      const response = await fetch('/api/chat/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: next,
          useWebSearch: false
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.response) {
        setMsgs((m) => [...m, { role: "assistant", content: data.response }]);
        
        // Track chatbot engagement for lead scoring
        trackChatbotEngagement(text, data.response);
      } else {
        throw new Error(data.error || 'No response from AI');
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMsgs((m) => [...m, { 
        role: "assistant", 
        content: "Sorry, I'm having trouble right now. Please try again or visit our FAQ page for more information."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const trackChatbotEngagement = async (userMessage: string, aiResponse: string) => {
    try {
      // Track engagement metrics
      const engagement = {
        timestamp: new Date().toISOString(),
        user_message: userMessage,
        ai_response: aiResponse,
        message_length: userMessage.length,
        response_length: aiResponse.length,
        session_id: Date.now().toString() // Simple session tracking
      };
      
      // Log engagement for lead scoring
      console.log('Chatbot engagement:', engagement);
      
      // You can send this to your analytics service or lead scoring system
      // For now, we'll just log it
    } catch (error) {
      console.error('Error tracking engagement:', error);
    }
  };

  // Removed getAccorriaResponse - now using API endpoint for all responses

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-40 rounded-full bg-amber-400 px-4 py-3 font-semibold text-slate-900 shadow-xl hover:bg-amber-300 transition-all duration-200 hover:scale-105"
      >
        <span className="inline-flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Ask GEP AI
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop overlay - removed to prevent black screen */}
            
            {/* Chat modal */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-4 right-4 left-4 sm:bottom-20 sm:right-5 sm:left-auto sm:w-[92vw] sm:max-w-sm z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center justify-between border-b px-4 py-3 bg-gradient-to-r from-amber-50 to-white">
              <div className="flex items-center gap-2">
                <Image 
                  src="/GEP LOGO.png" 
                  alt="Global Empowerment Platform" 
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full"
                />
                <div className="text-sm font-semibold text-slate-800">GEP AI Assistant</div>
              </div>
              <button 
                className="text-slate-500 hover:text-slate-800 transition-colors" 
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>

            <div 
              ref={boxRef} 
              className="h-80 sm:h-80 max-h-[60vh] space-y-4 overflow-y-auto bg-slate-50 p-4 sm:p-6 text-sm text-slate-800 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
            >
              {msgs.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  <div className="text-lg mb-2">🤖</div>
                  <div className="text-sm font-medium">Hello! I'm the GEP AI Assistant</div>
                  <div className="text-xs mt-2 text-slate-400">
                    Ask me anything about the Global Empowerment Platform
                  </div>
                </div>
              )}
              
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} mb-4`}>
                  {m.role === "assistant" && (
                    <Image 
                      src="/GEP LOGO.png" 
                      alt="Global Empowerment Platform" 
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full mr-3 mt-1 flex-shrink-0"
                    />
                  )}
                  <div className={`${
                    m.role === "user" 
                      ? "bg-amber-500 text-white" 
                      : "bg-white border border-slate-200"
                    } max-w-[80%] rounded-2xl px-4 py-3 shadow-sm leading-relaxed whitespace-pre-wrap`}
                  >
                    <div className="prose prose-sm max-w-none">
                      {m.content.split('\n').map((line, index) => {
                        // Handle numbered lists with better formatting
                        if (/^\d+\.\s/.test(line)) {
                          return (
                            <div key={index} className="flex items-start mb-2">
                              <span className="font-semibold text-amber-600 mr-2 min-w-[20px]">
                                {line.match(/^\d+/)?.[0]}.
                              </span>
                              <span className="flex-1">{line.replace(/^\d+\.\s/, '')}</span>
                            </div>
                          );
                        }
                        // Handle bullet points
                        if (line.startsWith('•') || line.startsWith('-')) {
                          return (
                            <div key={index} className="flex items-start mb-1 ml-4">
                              <span className="text-amber-500 mr-2">•</span>
                              <span className="flex-1">{line.replace(/^[•-]\s/, '')}</span>
                            </div>
                          );
                        }
                        // Handle headings (lines that end with :)
                        if (line.trim().endsWith(':') && line.length < 50) {
                          return (
                            <div key={index} className="font-semibold text-slate-800 mb-2 mt-3 first:mt-0">
                              {line}
                            </div>
                          );
                        }
                        // Regular text
                        return (
                          <div key={index} className="mb-1">
                            {line}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <Image 
                    src="/GEP LOGO.png" 
                    alt="GEP" 
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full mr-3 mt-1 flex-shrink-0"
                  />
                  <div className="bg-white border border-slate-200 max-w-[80%] rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-slate-500">GEP AI is typing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>


            <div className="flex items-center gap-2 border-t bg-white p-3">
              <input
                ref={inputRef}
                onKeyDown={(e) => e.key === "Enter" && !isLoading && send()}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent disabled:opacity-50 bg-white min-w-0 pointer-events-auto"
              />
              <button 
                onClick={send} 
                disabled={isLoading}
                className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap flex-shrink-0"
              >
                Send
              </button>
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
