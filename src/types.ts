export interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface StartupAnalysis {
  idea_summary: string;
  viability_score: number;
  market_demand: "Low" | "Medium" | "High";
  risk_level: "Low" | "Medium" | "High";
  scalability: "Low" | "Medium" | "High";
  monetization_potential: "Low" | "Medium" | "High";
  swot_analysis: SWOTAnalysis;
  target_audience: string[];
  market_insight: string;
  competitor_insight: string;
  revenue_model: string[];
  key_risks: string[];
  improvement_suggestions: string[];
  improved_idea: string;
  final_verdict: string;
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  analysis?: StartupAnalysis;
}
