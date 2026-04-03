import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Send,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Mic,
  Plus,
  Trash2
} from "lucide-react";
import { StartupAnalysis } from "../types";

const initialMessages: Message[] = [
  {
    id: '1',
    text: "Hi! I'm Buddi, your startup companion. I can help you understand your idea, suggest improvements, and guide you through your startup journey. What would you like to know?",
    sender: 'buddi',
    timestamp: new Date()
  }
];

interface Revision {
  revision_id: string;
  version_number: number;
  created_at: string;
  user_input: string;
  ai_response: string;
  structured_output?: StartupAnalysis;
  summary_label: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'buddi';
  timestamp: Date;
}

interface BuddiProps {
  startupData?: {
    idea_summary?: string;
    viability_score?: number;
    market_demand?: string;
    risk_level?: string;
    key_risks?: string[];
    improvement_suggestions?: string[];
  };
  authToken?: string;
  chatId?: string;
  onPersistMessage?: (chatId: string, user_input: string, ai_response: string) => Promise<void>;
  revisions?: Revision[];
}

export function Buddi({ startupData, authToken: _authToken, chatId, onPersistMessage, revisions }: BuddiProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [iconMood, setIconMood] = useState<'happy' | 'thinking' | 'winking' | 'surprised'>('happy');
  const [isLogoClicked, setIsLogoClicked] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const moodMap: Record<'happy' | 'thinking' | 'winking' | 'surprised', string> = {
    happy: '🤖',
    thinking: '🤔',
    winking: '😉',
    surprised: '😲'
  };

  const moodColorMap: Record<'happy' | 'thinking' | 'winking' | 'surprised', string> = {
    happy: 'from-indigo-500 to-purple-500',
    thinking: 'from-amber-500 to-orange-500',
    winking: 'from-cyan-500 to-blue-500',
    surprised: 'from-rose-500 to-pink-500'
  };

  const determineMood = (text: string, action?: string) => {
    if (action === 'pitch' || (text && /fun|playful|joke|casual/i.test(text))) return 'winking';
    if (action === 'improve' || action === 'score' || action === 'risks') return 'thinking';
    if (/surpris|wow|unexpected|shock/i.test(text)) return 'surprised';
    return 'happy';
  };

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setInputValue('');
    setIconMood('happy');
    setIsTyping(false);
  }, []);

  const handleClearChat = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all chat messages? This action cannot be undone.')) {
      setMessages([]);
      setInputValue('');
      setIsTyping(false);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: Event) => {
      const ke = e as KeyboardEvent;
      if (ke.ctrlKey || ke.metaKey) {
        if (ke.key === 'n' || ke.key === 'N') {
          ke.preventDefault();
          handleNewChat();
        } else if (ke.key === 'l' || ke.key === 'L') {
          ke.preventDefault();
          handleClearChat();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleNewChat, handleClearChat]);

  useEffect(() => {
    if (revisions && revisions.length > 0) {
      const loadedMessages: Message[] = [];
      revisions.forEach((r) => {
        loadedMessages.push({
          id: `user-${r.revision_id}`,
          text: r.user_input,
          sender: 'user',
          timestamp: new Date(r.created_at)
        });
        loadedMessages.push({
          id: `buddi-${r.revision_id}`,
          text: r.ai_response,
          sender: 'buddi',
          timestamp: new Date(r.created_at)
        });
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages(loadedMessages);
    }
    // If revisions is undefined, keep the current message history (user is in non-buddi chat context)
  }, [revisions]); // eslint-disable-line react-hooks/set-state-in-effect

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isTyping]);

  const quickActions = [
    { label: "Improve Idea", icon: Lightbulb, action: "improve" },
    { label: "Explain Score", icon: TrendingUp, action: "score" },
    { label: "Find Risks", icon: AlertTriangle, action: "risks" },
    { label: "Pitch Help", icon: Mic, action: "pitch" }
  ];

  const generateResponse = (userMessage: string, action?: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Handle quick actions
    if (action === "improve") {
      if (startupData?.improvement_suggestions?.length) {
        return `Based on your analysis, here are key improvements: ${startupData.improvement_suggestions.slice(0, 2).join(", ")}. Focus on these to boost your viability score.`;
      }
      return "To improve your startup idea, focus on solving a real problem, understanding your market, and building something people actually need. What's your current idea?";
    }

    if (action === "score") {
      if (startupData?.viability_score) {
        return `Your viability score of ${startupData.viability_score}/100 indicates ${startupData.viability_score >= 80 ? 'strong potential' : startupData.viability_score >= 60 ? 'moderate potential with room for improvement' : 'significant challenges to address'}. ${startupData.market_demand === 'High' ? 'The high market demand is a great sign!' : 'Consider ways to increase market demand.'}`;
      }
      return "Your viability score measures market potential, risk level, scalability, and monetization potential. Higher scores indicate better startup prospects.";
    }

    if (action === "risks") {
      if (startupData?.key_risks?.length) {
        return `Key risks to address: ${startupData.key_risks.slice(0, 2).join(", ")}. Start by creating mitigation strategies for these challenges.`;
      }
      return "Common startup risks include market competition, funding challenges, team issues, and product-market fit. What's concerning you most?";
    }

    if (action === "pitch") {
      return "For a great pitch: Start with the problem, show your solution, share market opportunity, and end with your ask. Keep it under 2 minutes and focus on benefits over features.";
    }

    // Handle natural language queries
    if (lowerMessage.includes("idea") && lowerMessage.includes("good")) {
      if (startupData?.viability_score) {
        return `Your idea scores ${startupData.viability_score}/100. ${startupData.viability_score >= 70 ? 'It has strong potential!' : 'There are opportunities to strengthen it.'} What aspects would you like me to help improve?`;
      }
      return "Every great startup starts with a good idea, but execution matters most. Focus on solving a real problem for a specific audience. What's your idea?";
    }

    if (lowerMessage.includes("improve") || lowerMessage.includes("better")) {
      return "To improve your startup: 1) Validate the problem, 2) Talk to potential customers, 3) Build a minimum viable product, 4) Iterate based on feedback. What's your biggest challenge right now?";
    }

    if (lowerMessage.includes("next") || lowerMessage.includes("step")) {
      return "Next steps: 1) Validate your idea with real users, 2) Build a simple prototype, 3) Test your assumptions, 4) Consider your business model. What's your current stage?";
    }

    if (lowerMessage.includes("pitch") || lowerMessage.includes("investor")) {
      return "When pitching: Focus on the problem, your solution, market size, and competitive advantage. Practice your 30-second elevator pitch. Need help crafting one?";
    }

    // Default responses
    if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
      return "Hello! I'm here to help you build a successful startup. What would you like to know about your idea or next steps?";
    }

    if (lowerMessage.includes("thank")) {
      return "You're welcome! Remember, every successful startup started somewhere. Keep building and learning. What else can I help with?";
    }

    return "That's an interesting question! I'd love to help. Could you tell me more about your startup idea or what specific aspect you'd like guidance on?";
  };

  const messageIdRef = useRef(1);

  const handleSendMessage = async (text: string, action?: string) => {
    if (!text.trim() && !action) return;

    const userMessageText = action ? `${quickActions.find(a => a.action === action)?.label}` : text;
    const userMessage: Message = {
      id: `msg-${messageIdRef.current++}`,
      text: userMessageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setIconMood(determineMood(text, action));

    // Persist user message into backend if supported
    if (onPersistMessage && chatId) {
      try {
        // For user, perhaps not yet, wait for response
      } catch (error) {
        console.error('Failed to persist user message to chat history:', error);
      }
    }

    // Simulate AI thinking time (fixed delay for consistency)
    setTimeout(async () => {
      const response = generateResponse(text, action);
      const buddiMessage: Message = {
        id: `msg-${messageIdRef.current++}`,
        text: response,
        sender: 'buddi',
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, buddiMessage]);

      // Persist Buddi assistant message
      if (onPersistMessage && chatId) {
        try {
          await onPersistMessage(chatId, userMessageText, response);
        } catch (error) {
          console.error('Failed to persist assistant message to chat history:', error);
        }
      }

      // Emotion logic based on response
      if (/great|awesome|nice|good/i.test(response)) {
        setIconMood('happy');
      } else if (/improve|challenge|risk|problem/i.test(response)) {
        setIconMood('thinking');
      } else if (/pitch|fun|playful/i.test(response)) {
        setIconMood('winking');
      } else {
        setIconMood('surprised');
      }

      setIsTyping(false);
    }, 1000); // Fixed 1 second delay for consistent feel
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <motion.button
          onClick={() => {
            setIsOpen(prev => !prev);
            setIsLogoClicked(true);
            setIconMood('winking');
            setTimeout(() => {
              setIsLogoClicked(false);
              setIconMood('happy');
            }, 600);
          }}
          className={`relative w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center group bg-gradient-to-br ${moodColorMap[iconMood]}`}
          whileHover={{
            scale: 1.06,
            boxShadow: "0 12px 28px -7px rgba(99, 102, 241, 0.45)"
          }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Pulse animation */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: 'rgba(255,255,255,0.12)' }}
            animate={{
              scale: [1, 1.18, 1],
              opacity: [0.35, 0, 0.35]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Robo Emoji Face */}
          <motion.div
            key={`${iconMood}-${isLogoClicked}`}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: isLogoClicked ? 1.15 : 1, opacity: 1, rotate: isLogoClicked ? 12 : 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 240, damping: 18 }}
            className="relative w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold"
          >
            <span role="img" aria-label="Buddi mood" className="text-2xl select-none">
              {moodMap[iconMood]}
            </span>
          </motion.div>
        </motion.button>


        {/* Hover tooltip */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-slate-800 text-white text-sm rounded-lg whitespace-nowrap"
            >
              Ask Buddi
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/5 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Chat Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed bottom-24 right-6 w-80 max-w-[calc(100vw-3rem)] z-50 bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl flex flex-col"
              style={{ maxHeight: '70vh', height: '70vh' }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Sparkles className="w-6 h-6" />
                      <motion.div
                        className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Buddi</h3>
                      <p className="text-indigo-100 text-sm">Your startup companion</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100">
                <div className="flex gap-2">
                  <motion.button
                    onClick={handleNewChat}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-full transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="New Chat (Ctrl+N)"
                  >
                    <Plus className="w-3 h-3" />
                    New Chat
                  </motion.button>
                  <motion.button
                    onClick={handleClearChat}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-xs rounded-full transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Clear Chat (Ctrl+L)"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </motion.button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                        message.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-md'
                          : 'bg-slate-100 text-slate-800 rounded-bl-md'
                      }`}
                    >
                      {message.text}
                    </div>
                  </motion.div>
                ))}

                {/* Typing Indicator */}
                <AnimatePresence>
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex justify-start"
                    >
                      <div className="bg-slate-100 px-4 py-2 rounded-2xl rounded-bl-md">
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-slate-600">Buddi is thinking</span>
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-1 h-1 bg-slate-400 rounded-full"
                                animate={{ y: [0, -3, 0] }}
                                transition={{
                                  duration: 0.8,
                                  repeat: Infinity,
                                  delay: i * 0.2
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action) => (
                    <motion.button
                      key={action.action}
                      onClick={() => handleSendMessage('', action.action)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs rounded-full transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={isTyping}
                    >
                      <action.icon className="w-3 h-3" />
                      {action.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-slate-100">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask Buddi anything about your startup..."
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={isTyping}
                  />
                  <motion.button
                    onClick={() => handleSendMessage(inputValue)}
                    disabled={!inputValue.trim() || isTyping}
                    className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-full flex items-center justify-center transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}