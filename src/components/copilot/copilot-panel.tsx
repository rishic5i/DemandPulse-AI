"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MarkdownAnswer } from "@/components/copilot/markdown-answer";
import type { AnalysisResult } from "@/types/domain";

const SUGGESTIONS = [
  "Which products have the strongest positive demand signals?",
  "Which retailers are experiencing the most supply risk?",
  "Why is demand expected to increase for SKU001?",
  "Which products are affected by competitor promotions?",
  "What are the most important signals in the North region?",
];

export function CopilotPanel({ analysis }: { analysis: AnalysisResult }) {
  const [question, setQuestion] = useState(SUGGESTIONS[0]);
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = async () => {
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          signals: analysis.signals,
          features: analysis.features,
          demoMode: analysis.demoMode,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message || "Assistant failed");
      }
      setAnswer(payload.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assistant failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Copilot</CardTitle>
        <CardDescription>
          Answers use only the currently processed dataset. No invented evidence.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setQuestion(item);
                setAnswer(null);
                setError(null);
              }}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900"
            >
              {item}
            </button>
          ))}
        </div>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-cyan-600/30"
        />
        <Button disabled={loading || !question.trim()} onClick={() => void ask()}>
          {loading ? "Asking Groq…" : "Ask Copilot"}
        </Button>
        {error && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </p>
        )}
        {answer && <MarkdownAnswer content={answer} />}
      </CardContent>
    </Card>
  );
}
