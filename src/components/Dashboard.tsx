import React from "react";
import { motion } from "motion/react";
import { 
  TrendingUp, 
  AlertTriangle, 
  Maximize, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Lightbulb, 
  Target, 
  Users, 
  Search, 
  ShieldAlert, 
  Zap,
  ArrowRight
} from "lucide-react";
import { StartupAnalysis } from "../types";
import { cn } from "../lib/utils";

interface DashboardProps {
  analysis: StartupAnalysis;
}

export function Dashboard({ analysis }: DashboardProps) {
  const getMetricColor = (val: string) => {
    switch (val) {
      case "High": return "text-emerald-500 bg-emerald-50";
      case "Medium": return "text-amber-500 bg-amber-50";
      case "Low": return "text-rose-500 bg-rose-50";
      default: return "text-slate-500 bg-slate-50";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-rose-600";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 max-w-7xl mx-auto"
    >
      {/* Hero Metric: Viability Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        whileHover={{
          y: -2,
          boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.1)",
          transition: { duration: 0.2, ease: "easeOut" }
        }}
        className="col-span-1 md:col-span-2 lg:col-span-4 bg-white rounded-2xl p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300"
      >
        <div className="flex-1">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Startup Viability Score</h2>
          <p className="text-slate-600 text-lg leading-relaxed">{analysis.idea_summary}</p>
        </div>
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100 min-w-[200px]">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3, type: "spring" }}
            className={cn("text-6xl font-bold tracking-tighter", getScoreColor(analysis.viability_score))}
          >
            {analysis.viability_score}
          </motion.span>
          <span className="text-slate-400 font-medium mt-1">out of 100</span>
        </div>
      </motion.div>

      {/* Core Metrics */}
      <MetricCard
        label="Market Demand"
        value={analysis.market_demand}
        icon={<TrendingUp className="w-5 h-5" />}
        colorClass={getMetricColor(analysis.market_demand)}
        delay={0.2}
      />
      <MetricCard
        label="Risk Level"
        value={analysis.risk_level}
        icon={<AlertTriangle className="w-5 h-5" />}
        colorClass={getMetricColor(analysis.risk_level)}
        delay={0.3}
      />
      <MetricCard
        label="Scalability"
        value={analysis.scalability}
        icon={<Maximize className="w-5 h-5" />}
        colorClass={getMetricColor(analysis.scalability)}
        delay={0.4}
      />
      <MetricCard
        label="Monetization"
        value={analysis.monetization_potential}
        icon={<DollarSign className="w-5 h-5" />}
        colorClass={getMetricColor(analysis.monetization_potential)}
        delay={0.5}
      />

      {/* SWOT Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        whileHover={{
          y: -2,
          boxShadow: "0 15px 35px -8px rgba(0, 0, 0, 0.12), 0 8px 15px -4px rgba(0, 0, 0, 0.08)",
          transition: { duration: 0.2, ease: "easeOut" }
        }}
        className="col-span-1 md:col-span-2 lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all duration-300"
      >
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-500" />
          SWOT Analysis
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <SWOTSection title="Strengths" items={analysis.swot_analysis.strengths} type="positive" />
          <SWOTSection title="Weaknesses" items={analysis.swot_analysis.weaknesses} type="negative" />
          <SWOTSection title="Opportunities" items={analysis.swot_analysis.opportunities} type="positive" />
          <SWOTSection title="Threats" items={analysis.swot_analysis.threats} type="negative" />
        </div>
      </motion.div>

      {/* Market Insight */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        whileHover={{
          y: -2,
          boxShadow: "0 15px 35px -8px rgba(0, 0, 0, 0.12), 0 8px 15px -4px rgba(0, 0, 0, 0.08)",
          transition: { duration: 0.2, ease: "easeOut" }
        }}
        className="col-span-1 md:col-span-2 lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all duration-300"
      >
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-500" />
          Market Insight
        </h3>
        <p className="text-slate-600 leading-relaxed">{analysis.market_insight}</p>
      </motion.div>

      {/* Competitor Insight */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        whileHover={{
          y: -2,
          boxShadow: "0 15px 35px -8px rgba(0, 0, 0, 0.12), 0 8px 15px -4px rgba(0, 0, 0, 0.08)",
          transition: { duration: 0.2, ease: "easeOut" }
        }}
        className="col-span-1 md:col-span-2 lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all duration-300"
      >
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-500" />
          Competitor Insight
        </h3>
        <p className="text-slate-600 leading-relaxed">{analysis.competitor_insight}</p>
      </motion.div>

      {/* Target Audience */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        whileHover={{
          y: -2,
          boxShadow: "0 15px 35px -8px rgba(0, 0, 0, 0.12), 0 8px 15px -4px rgba(0, 0, 0, 0.08)",
          transition: { duration: 0.2, ease: "easeOut" }
        }}
        className="col-span-1 md:col-span-2 lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all duration-300"
      >
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-green-500" />
          Target Audience
        </h3>
        <ul className="space-y-2">
          {analysis.target_audience.map((audience, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 1 + index * 0.1 }}
              className="flex items-center gap-2 text-slate-600"
            >
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              {audience}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Revenue Model */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
        whileHover={{
          y: -2,
          boxShadow: "0 15px 35px -8px rgba(0, 0, 0, 0.12), 0 8px 15px -4px rgba(0, 0, 0, 0.08)",
          transition: { duration: 0.2, ease: "easeOut" }
        }}
        className="col-span-1 md:col-span-2 lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all duration-300"
      >
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-yellow-500" />
          Revenue Model
        </h3>
        <ul className="space-y-2">
          {analysis.revenue_model.map((model, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 1.1 + index * 0.1 }}
              className="flex items-center gap-2 text-slate-600"
            >
              <Zap className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              {model}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Key Risks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.1 }}
        whileHover={{
          y: -2,
          boxShadow: "0 15px 35px -8px rgba(0, 0, 0, 0.12), 0 8px 15px -4px rgba(0, 0, 0, 0.08)",
          transition: { duration: 0.2, ease: "easeOut" }
        }}
        className="col-span-1 md:col-span-2 lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all duration-300"
      >
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          Key Risks
        </h3>
        <ul className="space-y-2">
          {analysis.key_risks.map((risk, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 1.2 + index * 0.1 }}
              className="flex items-center gap-2 text-slate-600"
            >
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              {risk}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Improvement Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        whileHover={{
          y: -2,
          boxShadow: "0 15px 35px -8px rgba(0, 0, 0, 0.12), 0 8px 15px -4px rgba(0, 0, 0, 0.08)",
          transition: { duration: 0.2, ease: "easeOut" }
        }}
        className="col-span-1 md:col-span-2 lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all duration-300"
      >
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-orange-500" />
          Improvement Suggestions
        </h3>
        <ul className="space-y-2">
          {analysis.improvement_suggestions.map((suggestion, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 1.3 + index * 0.1 }}
              className="flex items-center gap-2 text-slate-600"
            >
              <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0" />
              {suggestion}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Final Verdict */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.3 }}
        whileHover={{
          y: -2,
          boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.1)",
          transition: { duration: 0.2, ease: "easeOut" }
        }}
        className="col-span-1 md:col-span-2 lg:col-span-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100 shadow-sm transition-all duration-300"
      >
        <h3 className="text-xl font-bold text-slate-800 mb-4">Final Verdict</h3>
        <p className="text-lg leading-relaxed italic text-slate-700">&ldquo;{analysis.final_verdict}&rdquo;</p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.4 }}
          className="mt-4"
        >
          <p className="text-slate-600">Improved Idea: <span className="font-semibold text-slate-800">{analysis.improved_idea}</span></p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function MetricCard({ label, value, icon, colorClass, delay }: { label: string, value: string, icon: React.ReactNode, colorClass: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{
        y: -3,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 6px 12px -4px rgba(0, 0, 0, 0.08)",
        transition: { duration: 0.15, ease: "easeOut" }
      }}
      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 transition-all duration-300 cursor-pointer"
    >
      <div className={cn("p-3 rounded-xl", colorClass)}>
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-slate-800 font-bold text-lg">{value}</p>
      </div>
    </motion.div>
  );
}

function SWOTSection({ title, items, type }: { title: string, items: string[], type: 'positive' | 'negative' }) {
  return (
    <div className="space-y-2">
      <h4 className={cn("text-xs font-bold uppercase tracking-widest", type === 'positive' ? 'text-emerald-600' : 'text-rose-600')}>
        {title}
      </h4>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-slate-600 text-xs flex items-start gap-1.5">
            {type === 'positive' ? <CheckCircle2 className="w-3 h-3 mt-0.5 text-emerald-400 shrink-0" /> : <XCircle className="w-3 h-3 mt-0.5 text-rose-400 shrink-0" />}
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
