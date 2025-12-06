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

  const getAccorriaResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    // Greetings
    if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
      return "Hello! I'm the Accorria AI assistant. I'm here to help you understand how Accorria can transform your car selling experience. What would you like to know about our platform?";
    }
    
    // What is Accorria
    if (lowerInput.includes('what is accorria') || lowerInput.includes('what does accorria do') || lowerInput.includes('tell me about accorria')) {
      return "Accorria is an AI-powered platform that transforms car selling from hours to minutes. We use advanced AI to analyze your car photos and automatically generate professional listings, handle negotiations, and facilitate secure transactions with instant payments.";
    }
    
    // How it works
    if (lowerInput.includes('how does it work') || lowerInput.includes('how it works') || lowerInput.includes('process')) {
      return "Here's how Accorria works:\n\n1. **Upload Photos** - Take photos of your car\n2. **AI Analysis** - Our AI analyzes your car and market data\n3. **Auto-Listing** - We generate a professional listing automatically\n4. **Smart Negotiations** - AI handles buyer inquiries and negotiations\n5. **Secure Payment** - Get paid instantly when the deal closes\n\nFrom photos to posted in minutes, from listing to closed deal in days!";
    }
    
    // Pricing
    if (lowerInput.includes('price') || lowerInput.includes('cost') || lowerInput.includes('fee') || lowerInput.includes('how much')) {
      return "Accorria offers transparent, performance-based pricing. We only succeed when you do! Our fees are competitive and clearly displayed. For specific pricing details, please sign up for early access and we'll notify you when we launch with our final pricing structure.";
    }
    
    // AI Technology
    if (lowerInput.includes('ai') || lowerInput.includes('artificial intelligence') || lowerInput.includes('technology')) {
      return "Accorria uses cutting-edge AI technology including:\n\n• **Computer Vision** - Analyzes car photos for condition, features, and value\n• **Natural Language Processing** - Generates compelling listing descriptions\n• **Market Intelligence** - Real-time pricing and demand analysis\n• **Automated Negotiations** - AI handles buyer communications\n• **Blockchain Payments** - Secure, instant settlements\n\nOur AI is trained on millions of car sales to provide accurate valuations and optimal selling strategies.";
    }
    
    // Speed/Time
    if (lowerInput.includes('fast') || lowerInput.includes('quick') || lowerInput.includes('speed') || lowerInput.includes('time') || lowerInput.includes('minutes')) {
      return "Accorria is designed for speed:\n\n• **10x Faster** than traditional selling methods\n• **Photos to listing** in minutes, not hours\n• **Listing to sale** in days, not weeks\n• **Instant payments** when deals close\n• **24/7 AI assistance** for buyers and sellers\n\nWhat used to take weeks of back-and-forth now happens in minutes!";
    }
    
    // Safety/Security
    if (lowerInput.includes('safe') || lowerInput.includes('secure') || lowerInput.includes('scam') || lowerInput.includes('fraud')) {
      return "Accorria prioritizes safety and security:\n\n• **Blockchain-powered payments** - Funds are locked until deal completion\n• **Identity verification** for all users\n• **Escrow protection** - Money is held securely until delivery\n• **No scams** - AI filters out suspicious buyers\n• **Instant settlements** - No waiting for bank transfers\n\nYour money and your car are protected throughout the entire process.";
    }
    
    // Payment
    if (lowerInput.includes('payment') || lowerInput.includes('paid') || lowerInput.includes('money') || lowerInput.includes('funds')) {
      return "Accorria's payment system is revolutionary:\n\n• **Instant payments** when deals close\n• **Blockchain settlements** in 23 hours\n• **No bank delays** or wire transfer fees\n• **Funds locked** until delivery confirmation\n• **Works for cars, homes, and high-value items**\n\nSkip the bank delays. Skip the scams. Get paid instantly!";
    }
    
    // Early Access
    if (lowerInput.includes('early access') || lowerInput.includes('beta') || lowerInput.includes('sign up') || lowerInput.includes('join')) {
      return "Get early access to Accorria! We're currently in beta and accepting early users. Sign up now to:\n\n• Be among the first to experience AI-powered car selling\n• Get priority access when we launch\n• Receive exclusive updates and features\n• Help shape the future of car sales\n\nClick 'Get Early Access' to join our beta program!";
    }
    
    // Support/Help
    if (lowerInput.includes('help') || lowerInput.includes('support') || lowerInput.includes('contact')) {
      return "I'm here to help! You can:\n\n• Ask me any questions about Accorria\n• Visit our FAQ page for detailed answers\n• Sign up for early access to get priority support\n• Check out our 'How It Works' page for more details\n\nWhat specific question can I answer for you?";
    }
    
    // Features
    if (lowerInput.includes('feature') || lowerInput.includes('what can') || lowerInput.includes('capabilities')) {
      return "Accorria's key features include:\n\n• **AI Photo Analysis** - Instant car condition assessment\n• **Auto-Listing Generation** - Professional listings in minutes\n• **Smart Pricing** - Real-time market-based valuations\n• **Automated Negotiations** - AI handles buyer communications\n• **Secure Payments** - Blockchain-powered instant settlements\n• **24/7 Availability** - Never miss a potential buyer\n• **Multi-Platform** - Works for cars, homes, and high-value items";
    }
    
    // Benefits
    if (lowerInput.includes('benefit') || lowerInput.includes('advantage') || lowerInput.includes('why')) {
      return "Why choose Accorria?\n\n• **10x Faster** - From hours to minutes\n• **Better Results** - AI-optimized listings and pricing\n• **Safer Deals** - Blockchain security and escrow protection\n• **No Hassle** - AI handles the heavy lifting\n• **Instant Payments** - No waiting for bank transfers\n• **24/7 Support** - AI assistance around the clock\n• **Transparent Pricing** - No hidden fees or surprises";
    }
    
    // Default response
    return "That's a great question! Accorria is an AI-powered platform that makes selling cars faster, safer, and more profitable. We use advanced AI to analyze photos, generate listings, handle negotiations, and facilitate secure payments.\n\nWould you like to know more about:\n• How the process works\n• Our AI technology\n• Payment and security features\n• Getting early access\n\nJust ask me anything about Accorria!";
  };

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
          Ask Accorria
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
                  src="/LOGOSYMBLOYBLUE.png" 
                  alt="Accorria" 
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full"
                />
                <div className="text-sm font-semibold text-slate-800">Accorria Agent</div>
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
                  <div className="text-sm font-medium">Hello! I'm the Accorria AI Assistant</div>
                  <div className="text-xs mt-2 text-slate-400">
                    Ask me anything about Accorria
                  </div>
                </div>
              )}
              
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} mb-4`}>
                  {m.role === "assistant" && (
                    <Image 
                      src="/LOGOSYMBLOYBLUE.png" 
                      alt="Accorria" 
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
                    src="/LOGOSYMBLOYBLUE.png" 
                    alt="Accorria" 
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
                      <span className="text-slate-500">Accorria is typing...</span>
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
