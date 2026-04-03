import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
// DB file-based persistence (simple local JSON store for prototypes)
const DB_FILE = path.resolve(process.cwd(), "db.json");
const generateId = () => Math.random().toString(36).substr(2, 9);
const generateLabel = (user_input, ai_response) => {
    const input = user_input.toLowerCase();
    if (input.includes('improve') || input.includes('better'))
        return 'Improved Version';
    if (input.includes('add') || input.includes('include'))
        return 'Added Features';
    if (input.includes('change') || input.includes('modify'))
        return 'Modified Idea';
    if (input.includes('refine'))
        return 'Refined Concept';
    if (input.includes('scale') || input.includes('grow'))
        return 'Scalability Focus';
    if (input.includes('monetize') || input.includes('revenue'))
        return 'Monetization Update';
    if (input.includes('risk') || input.includes('problem'))
        return 'Risk Mitigation';
    return 'Updated Idea';
};
const loadDB = () => {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ users: [] }, null, 2));
    }
    const content = fs.readFileSync(DB_FILE, "utf-8");
    try {
        return JSON.parse(content);
    }
    catch {
        return { users: [] };
    }
};
const saveDB = (db) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
};
const getUserByToken = (token, db) => {
    if (!token || !mockTokens.has(token))
        return null;
    const email = mockTokens.get(token);
    return db.users.find((u) => u.email === email) || null;
};
function createEmptyChat(type, title) {
    const now = new Date().toISOString();
    return {
        chat_id: generateId(),
        title,
        type,
        created_at: now,
        updated_at: now,
        revisions: [],
    };
}
// Mock auth data (in production, use a real database)
const mockUsers = new Map();
const mockTokens = new Map();
function generateToken() {
    return `token_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
}
const app = express();
app.use(cors());
app.use(express.json());
// Serve favicon
app.get('/favicon.ico', (req, res) => res.status(204).end());
dotenv.config({ path: ".env.local" });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
console.log('GEMINI_API_KEY loaded:', !!GEMINI_API_KEY);
if (!GEMINI_API_KEY) {
    console.error("Missing GEMINI_API_KEY environment variable. Set it in .env.local (GEMINI_API_KEY=...) and restart.");
    process.exit(1);
}
const SYSTEM_PROMPT = `You are an AI-powered Startup Viability and Market Intelligence Assistant.

Your task is to analyze startup ideas and return highly structured, clear, and actionable insights in a simple, user-friendly format designed for a modern, minimal, Copilot-style UI experience.

IMPORTANT INSTRUCTIONS:
- Always respond in STRICT JSON format.
- Keep responses concise, structured, and visually scannable.
- Avoid complex jargon — make it beginner-friendly.
- Prioritize clarity over depth.
- Ensure outputs are optimized for a clean dashboard UI.

UI/UX INTELLIGENCE:
- Minimal, clean, distraction-free
- Card-based layout
- Clear hierarchy (important → less important)
- Short text blocks (no long paragraphs)
- Easy to scan within 5–10 seconds
- Professional and modern tone

STRUCTURE OUTPUT SO THAT:
- "viability_score" is the most prominent (hero metric)
- Other metrics are short labels (easy to convert into cards)
- Lists are concise (max 2–4 points per section)
- Insights are sharp and actionable (not generic)

Think like: “This will be shown in a premium product UI”

BEHAVIOR RULES:
1. Always return ALL fields.
2. Keep outputs compact and UI-friendly.
3. Avoid long paragraphs — prefer short structured points.
4. Make insights feel premium and intelligent.
5. Always provide constructive suggestions.
6. Maintain consistency for frontend rendering.
7. Act as a decision-support system, not just text generator.`;
const RESPONSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        idea_summary: { type: Type.STRING },
        viability_score: { type: Type.NUMBER },
        market_demand: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
        risk_level: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
        scalability: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
        monetization_potential: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
        swot_analysis: {
            type: Type.OBJECT,
            properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                threats: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["strengths", "weaknesses", "opportunities", "threats"],
        },
        target_audience: { type: Type.ARRAY, items: { type: Type.STRING } },
        market_insight: { type: Type.STRING },
        competitor_insight: { type: Type.STRING },
        revenue_model: { type: Type.ARRAY, items: { type: Type.STRING } },
        key_risks: { type: Type.ARRAY, items: { type: Type.STRING } },
        improvement_suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        improved_idea: { type: Type.STRING },
        final_verdict: { type: Type.STRING },
    },
    required: [
        "idea_summary",
        "viability_score",
        "market_demand",
        "risk_level",
        "scalability",
        "monetization_potential",
        "swot_analysis",
        "target_audience",
        "market_insight",
        "competitor_insight",
        "revenue_model",
        "key_risks",
        "improvement_suggestions",
        "improved_idea",
        "final_verdict",
    ],
};
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
// Auth endpoints
app.post("/api/auth/signup", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        const db = loadDB();
        if (db.users.some((u) => u.email === email)) {
            return res.status(409).json({ error: "Email already registered" });
        }
        const userId = `user_${Date.now()}`;
        const newUser = {
            user_id: userId,
            email,
            password,
            chats: [],
        };
        db.users.push(newUser);
        try {
            saveDB(db);
        }
        catch (saveError) {
            console.error("Failed to save DB:", saveError);
            return res.status(500).json({ error: "Failed to save user data" });
        }
        mockUsers.set(email, { id: userId, email, password });
        const token = generateToken();
        mockTokens.set(token, email);
        return res.json({ token, userId, email });
    }
    catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
app.post("/api/auth/login", async (req, res) => {
    const { email, password, rememberMe } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }
    const db = loadDB();
    const user = db.users.find((u) => u.email === email);
    if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = generateToken();
    mockTokens.set(token, email);
    return res.json({ token, userId: user.user_id, email: user.email });
});
app.post("/api/auth/logout", (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
        mockTokens.delete(token);
    }
    return res.json({ success: true });
});
app.get("/api/auth/me", (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token || !mockTokens.has(token)) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const db = loadDB();
    const user = getUserByToken(token, db);
    if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    return res.json({ email: user.email, userId: user.user_id });
});
// Chat Persistence API
app.get("/api/chats", (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    const db = loadDB();
    const user = getUserByToken(token, db);
    if (!user)
        return res.status(401).json({ error: "Unauthorized" });
    return res.json({ chats: user.chats });
});
app.post("/api/chats", (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    const db = loadDB();
    const user = getUserByToken(token, db);
    if (!user)
        return res.status(401).json({ error: "Unauthorized" });
    const { title, type } = req.body;
    if (!title || !type) {
        return res.status(400).json({ error: "title and type are required" });
    }
    const newChat = createEmptyChat(type, title);
    user.chats.push(newChat);
    saveDB(db);
    return res.status(201).json({ chat: newChat });
});
app.post("/api/chats/:chatId/revisions", (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    const db = loadDB();
    const user = getUserByToken(token, db);
    if (!user)
        return res.status(401).json({ error: "Unauthorized" });
    const { chatId } = req.params;
    const { user_input, ai_response, structured_output } = req.body;
    const chat = user.chats.find((c) => c.chat_id === chatId);
    if (!chat)
        return res.status(404).json({ error: "Chat not found" });
    const version_number = chat.revisions.length + 1;
    const revision = {
        revision_id: generateId(),
        version_number,
        created_at: new Date().toISOString(),
        user_input,
        ai_response,
        structured_output,
        summary_label: generateLabel(user_input, ai_response)
    };
    chat.revisions.push(revision);
    chat.updated_at = new Date().toISOString();
    if (structured_output) {
        chat.last_analysis_result = structured_output;
        if (!chat.title || chat.title.startsWith("New")) {
            chat.title = `${structured_output.idea_summary.slice(0, 30)}...`;
        }
    }
    saveDB(db);
    return res.json({ chat });
});
app.get("/api/chats/:chatId", (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    const db = loadDB();
    const user = getUserByToken(token, db);
    if (!user)
        return res.status(401).json({ error: "Unauthorized" });
    const chat = user.chats.find((c) => c.chat_id === req.params.chatId);
    if (!chat)
        return res.status(404).json({ error: "Chat not found" });
    return res.json({ chat });
});
app.post("/api/analyze", async (req, res) => {
    const { idea, history } = req.body;
    if (!idea || !idea.trim()) {
        return res.status(400).json({ error: "Idea text is required" });
    }
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
                ...(history ?? []),
                { role: "user", parts: [{ text: `Startup Idea: ${idea}` }] },
            ],
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
                responseSchema: RESPONSE_SCHEMA,
            },
        });
        if (!response.text) {
            return res.status(500).json({ error: "Empty response from Gemini" });
        }
        const analysis = JSON.parse(response.text);
        return res.json(analysis);
    }
    catch (error) {
        console.error("Gemini analysis error:", error);
        const message = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: message });
    }
});
const port = Number(process.env.PORT || 3333);
function startServer(port) {
    const server = app.listen(port, () => {
        console.log(`Server API running: http://localhost:${port}/api/analyze`);
    });
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is busy, trying ${port + 1}...`);
            startServer(port + 1);
        }
        else {
            console.error('Server error:', err);
        }
    });
}
// Only start server locally, not in Vercel production
if (process.env.NODE_ENV !== 'production') {
    startServer(port);
}
// Export for Vercel serverless functions
export default app;
