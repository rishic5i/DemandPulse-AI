"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AppView } from "@/types/domain";

const NEXT: Array<{ view: AppView; title: string; body: string }> = [
  {
    view: "signals",
    title: "Signal Explorer",
    body: "Inspect evidence, confidence, and lineage for each extracted event.",
  },
  {
    view: "features",
    title: "Feature Store",
    body: "Review deterministic SKU/retailer features, then export CSV or JSON.",
  },
  {
    view: "copilot",
    title: "AI Copilot",
    body: "Ask questions grounded only in the processed dataset.",
  },
];

export function WorkflowNext({
  onNavigate,
}: {
  onNavigate: (view: AppView) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Continue the demo flow</CardTitle>
        <CardDescription>
          Extraction finished. Walk judges through evidence, features, and export.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {NEXT.map((item) => (
          <div
            key={item.view}
            className="rounded-lg border border-slate-800 bg-slate-950/50 p-4"
          >
            <p className="text-sm font-medium text-slate-100">{item.title}</p>
            <p className="mt-1 text-xs text-slate-400">{item.body}</p>
            <Button
              className="mt-3"
              size="sm"
              variant="secondary"
              onClick={() => onNavigate(item.view)}
            >
              Open
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
