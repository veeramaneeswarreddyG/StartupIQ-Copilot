import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  Sparkles, 
  RefreshCcw, 
  History, 
  ChevronRight,
  Rocket,
  BrainCircuit,
  MessageSquare,
  Target,
  DollarSign,
  LogOut
} from "lucide-react";
import { StartupAnalysis, ChatMessage } from "./types";
import { Dashboard } from "./components/Dashboard";
import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import { Buddi } from "./components/Buddi";
import { cn } from "./lib/utils";

interface Revision {
  revision_id: string;
  version_number: number;
  created_at: string;
  user_input: string;
  ai_response: string;
  structured_output?: StartupAnalysis;
  summary_label: string;
}

interface ChatEntry {
  chat_id: string;
  title: string;
  type: "analysis" | "buddi";
  created_at: string;
  updated_at: string;
  revisions: Revision[];
  last_analysis_result?: StartupAnalysis;
  context_summary?: string;
}


export default function App() {
  // Auth state
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem("authToken");
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userId, setUserId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authView, setAuthView] = useState<"login" | "signup">("login");

  // Conversation state
  const [chats, setChats] = useState<ChatEntry[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Analysis state
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<StartupAnalysis | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedChat = selectedChatId ? chats.find((c) => c.chat_id === selectedChatId) : undefined;
  const buddiRevisions = selectedChat?.type === 'buddi' ? selectedChat.revisions : undefined;

  const handleAuthSuccess = async (data: { token: string; userId: string; email: string }) => {
    setAuthToken(data.token);
    setUserId(data.userId);
    setUserEmail(data.email);
    localStorage.setItem("authToken", data.token);

    // load chats
    try {
      const resp = await fetch("/api/chats", {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      if (resp.ok) {
        const json = await resp.json();
        const loadedChats = (json.chats as ChatEntry[]).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        setChats(loadedChats);
        if (loadedChats.length > 0) {
          setSelectedChatId(loadedChats[0].chat_id);
        }
      }
    } catch (err) {
      console.error("Failed to load chats", err);
    }
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("rememberedEmail");
    setAuthToken(null);
    setUserId(null);
    setUserEmail(null);
    setAnalysis(null);
    setHistory([]);
    setChats([]);
    setSelectedChatId(null);
    setInput("");
  }, []);

  const fetchChats = async (token: string) => {
    try {
      const resp = await fetch("/api/chats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error("Failed fetching chats");
      const { chats } = await resp.json();
      return chats as ChatEntry[];
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const createChat = async (token: string, type: "analysis" | "buddi", title: string) => {
    if (!token) return null;
    const resp = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type, title }),
    });
    if (resp.status === 401) {
      handleLogout();
      throw new Error("Unauthorized");
    }
    if (!resp.ok) throw new Error("Failed creating chat");
    const { chat } = await resp.json();
    setChats((prev) => [chat, ...prev]);
    return chat as ChatEntry;
  };

  const appendRevision = async (token: string, chatId: string, user_input: string, ai_response: string, structured_output?: StartupAnalysis) => {
    if (!token) return;
    const resp = await fetch(`/api/chats/${chatId}/revisions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_input, ai_response, structured_output }),
    });
    if (resp.status === 401) {
      handleLogout();
      throw new Error("Unauthorized");
    }
    if (!resp.ok) throw new Error("Failed saving revision");
    const { chat } = await resp.json();
    setChats((prev) => prev.map((c) => (c.chat_id === chat.chat_id ? chat : c)));
    return chat as ChatEntry;
  };

  const handlePersistMessage = async (chatId: string, user_input: string, ai_response: string) => {
    if (!authToken) return;
    await appendRevision(authToken, chatId, user_input, ai_response);
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);
    const userMessage: ChatMessage = { role: "user", content: input };
    setHistory(prev => [...prev, userMessage]);

    try {
      const payload = {
        idea: input,
        history: history.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        })),
      };

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call failed (${response.status}): ${errorText}`);
      }

      const result = await response.json() as StartupAnalysis;
      setAnalysis(result);

      const chatIdToUse = selectedChatId;
      const isNewChat = !chatIdToUse;
      let activeChat = null as ChatEntry | null;

      if (isNewChat && authToken) {
        const generatedTitle = input
          .trim()
          .split(" ")
          .slice(0, 3)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        activeChat = await createChat(authToken, "analysis", generatedTitle || "New Analysis" );
        setSelectedChatId(activeChat?.chat_id ?? null);
      } else if (chatIdToUse) {
        activeChat = chats.find((c) => c.chat_id === chatIdToUse) || null;
      }

      if (activeChat && authToken) {
        await appendRevision(authToken, activeChat.chat_id, input, JSON.stringify(result), result);
      }

      const aiMessage: ChatMessage = {
        role: "model",
        content: `Analysis complete for: ${result.idea_summary}`,
        analysis: result,
      };
      setHistory(prev => [...prev, aiMessage]);
      setInput("");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Analysis failed:", message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (!authToken) return;
    const load = async () => {
      try {
        const sessionResp = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (sessionResp.status === 401) {
          console.warn("Session unauthorized, logging out");
          handleLogout();
          return;
        }

        if (!sessionResp.ok) {
          throw new Error(`Auth session failed (${sessionResp.status})`);
        }

        const json = await sessionResp.json();
        setUserId(json.userId);
        setUserEmail(json.email);

        const loadedChats = await fetchChats(authToken);
        setChats(loadedChats.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
        if (loadedChats.length > 0) {
          setSelectedChatId(loadedChats[0].chat_id);
          if (loadedChats[0].last_analysis_result) {
            setAnalysis(loadedChats[0].last_analysis_result);
          }
          setHistory(loadedChats[0].revisions.flatMap((r) => [
            { role: "user" as const, content: r.user_input },
            { role: "model" as const, content: r.ai_response, analysis: r.structured_output }
          ]));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn("Failed to rehydrate session", message);
        handleLogout();
      }
    };
    load();
  }, [authToken, handleLogout]);

  // Auth flow
  if (!authToken) {
    return authView === "login" ? (
      <Login 
        onSuccess={handleAuthSuccess}
        onSwitchToSignup={() => setAuthView("signup")}
      />
    ) : (
      <Signup
        onSuccess={handleAuthSuccess}
        onSwitchToLogin={() => setAuthView("login")}
      />
    );
  }

  // Dashboard view
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Rocket className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Startup Copilot</h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-none">Market Intelligence AI</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-200",
                showHistory ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              )}
            >
              <History className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                setAnalysis(null);
                setHistory([]);
                setInput("");
              }}
              className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all duration-200"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
            <button
              onClick={async () => {
                if (!authToken) return;
                try {
                  const newChat = await createChat(authToken, "analysis", "New Startup Analysis");
                  if (newChat) {
                    setSelectedChatId(newChat.chat_id);
                    setAnalysis(null);
                    setHistory([]);
                    setInput("");
                  }
                } catch (err) {
                  console.error("Failed to create chat", err);
                }
              }}
              className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all duration-200"
              title="New Chat"
            >
              + New Chat
            </button>
            <button 
              onClick={handleLogout}
              className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all duration-200"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative pb-32">
        {/* History Sidebar */}
        <AnimatePresence>
          {showHistory && (
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed right-0 top-16 bottom-0 w-80 bg-white border-l border-slate-100 z-40 shadow-2xl p-4 overflow-y-auto"
            >
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{selectedChatId ? "Idea Revisions" : "Recent Analyses"}</h3>
              <div className="space-y-3">
                {selectedChatId ? (
                  (() => {
                    const chat = chats.find(c => c.chat_id === selectedChatId);
                    return chat ? chat.revisions.map((r) => (
                      <button
                        key={r.revision_id}
                        onClick={() => {
                          if (chat.type === "analysis" && r.structured_output) {
                            setAnalysis(r.structured_output);
                            setHistory([
                              { role: "user", content: r.user_input },
                              { role: "model", content: r.ai_response, analysis: r.structured_output }
                            ]);
                          }
                          setShowHistory(false);
                        }}
                        className="w-full text-left p-4 rounded-xl border border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group"
                      >
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="text-xs font-semibold text-indigo-600">v{r.version_number}</span>
                          <span className="text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 mb-1">{r.summary_label} {r.version_number === 1 ? "(Simple idea)" : r.version_number === 2 ? "(Improved)" : r.version_number === 3 ? "(Refined)" : ""}</p>
                        <div className="text-xs text-slate-600">
                          <p><strong>User:</strong> {r.user_input.slice(0, 50)}...</p>
                          <p><strong>AI:</strong> {r.ai_response.slice(0, 50)}...</p>
                        </div>
                      </button>
                    )) : null;
                  })()
                ) : chats.length > 0 ? (
                  chats.map((chat) => (
                    <button
                      key={chat.chat_id}
                      onClick={() => {
                        setSelectedChatId(chat.chat_id);
                        setAnalysis(chat.last_analysis_result || null);
                        setHistory(chat.revisions.flatMap((r) => [
                          { role: "user", content: r.user_input },
                          { role: "model", content: r.ai_response, analysis: r.structured_output }
                        ]));
                      }}
                      className={`w-full text-left p-4 rounded-xl border hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group ${selectedChatId === chat.chat_id ? "border-indigo-300 bg-indigo-50/20" : "border-slate-50"}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm font-semibold text-slate-800 line-clamp-2 mb-1 group-hover:text-indigo-600">{chat.title}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide text-white text-[10px] font-semibold ${chat.type === "analysis" ? "bg-indigo-500" : "bg-emerald-500"}`}>{chat.type === "analysis" ? "Analysis" : "Buddi"}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Last updated: {new Date(chat.updated_at).toLocaleString()}</span>
                        <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-400" />
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-center text-slate-400 text-sm py-12 italic">Start your first startup analysis 🚀</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-7xl mx-auto px-4 pt-8">
          {!analysis && !isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto text-center py-20"
            >
              <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <BrainCircuit className="w-10 h-10 text-indigo-600" />
              </div>
              <h2 className="text-4xl font-bold tracking-tight mb-4 text-slate-900">
                Validate your startup idea <br />
                <span className="text-indigo-600">in seconds.</span>
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed mb-10">
                Enter your vision below. Our AI analyzes market demand, risks, 
                and scalability to provide a comprehensive viability report.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <FeatureSmall icon={<Sparkles className="w-4 h-4" />} text="Market Insights" />
                <FeatureSmall icon={<Target className="w-4 h-4" />} text="SWOT Analysis" />
                <FeatureSmall icon={<DollarSign className="w-4 h-4" />} text="Revenue Models" />
              </div>
            </motion.div>
          )}

          {error && (
            <div className="max-w-4xl mx-auto py-4 text-center bg-red-50 border border-red-200 rounded-xl text-red-700 mb-4">
              <strong>Analysis failed:</strong> {error}
            </div>
          )}

          {isLoading && (
            <div className="max-w-4xl mx-auto py-24 text-center">
              <motion.div 
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-200"
              >
                <Sparkles className="w-12 h-12 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Analyzing Market Intelligence...</h3>
              <p className="text-slate-500 animate-pulse">Scanning competitors, evaluating demand, and calculating viability score.</p>
            </div>
          )}

          {analysis && !isLoading && (
            <Dashboard analysis={analysis} />
          )}
        </div>
      </main>

      {/* Floating Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto">
          <form 
            onSubmit={handleAnalyze}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
            <div className="relative flex items-center bg-white rounded-2xl shadow-2xl shadow-indigo-100 border border-slate-100 p-2 pl-6">
              <MessageSquare className="w-5 h-5 text-slate-300 mr-4" />
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={analysis ? "Refine idea or ask a follow-up..." : "Describe your startup idea..."}
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 placeholder:text-slate-400 py-3"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className={cn(
                  "ml-2 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all duration-300",
                  input.trim() && !isLoading 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5" 
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <RefreshCcw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Analyze</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
          <p className="text-center text-[10px] text-slate-400 mt-4 font-medium uppercase tracking-widest">
            Powered by Gemini 3 Flash • Real-time Market Intelligence
          </p>
        </div>
      </div>

      {/* Buddi AI Assistant */}
      <Buddi
        startupData={analysis || undefined}
        authToken={authToken ?? undefined}
        chatId={selectedChat?.type === 'buddi' ? selectedChatId ?? undefined : undefined}
        onPersistMessage={selectedChat?.type === 'buddi' ? handlePersistMessage : undefined}
        revisions={buddiRevisions}
      />
    </div>
  );
}

function FeatureSmall({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm">
      <div className="text-indigo-500">{icon}</div>
      <span className="text-xs font-semibold text-slate-600">{text}</span>
    </div>
  );
}
