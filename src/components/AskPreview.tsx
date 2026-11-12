"use client";

import Link from "next/link";
import { useState } from "react";
import { VERIFIED_RUN } from "@/lib/verified-run";

const DEMO = VERIFIED_RUN.question ?? "What's moving in the crypto and ETH ETF market this week?";
const recordedTopics = VERIFIED_RUN.calls.map((c) => c.topic).filter(Boolean);

/**
 * Landing preview: the recorded question shows the SERV topics from the run.
 * A different question shows a built-in guess only, and the public demo still
 * replays the recorded run rather than fetching a live briefing.
 */
export default function AskPreview() {
  const [question, setQuestion] = useState(DEMO);
  const recorded = question.trim() === DEMO.trim();

  return (
    <form
      className="mt-10"
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <label htmlFor="landing-question" className="text-[14px] font-medium text-bone">
        Your question
      </label>
      <textarea
        id="landing-question"
        rows={3}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a full question — a short topic is picked for each call"
        className="mt-3 block w-full resize-none rounded-[18px] border border-[rgba(196, 148, 100,0.45)] bg-white px-4 py-3.5 text-[16px] leading-[1.55] text-bone outline-none placeholder:text-dim focus:border-cent sm:px-5"
      />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="min-w-0 text-[14.5px] leading-[1.55] text-mute">
          {question.trim() ? (
            recorded ? (
              <>
                SERV topics in the recorded run:{" "}
                <span className="font-medium text-bone">{recordedTopics.map((tp) => `“${tp}”`).join(", then ")}</span>
                <span className="mt-1 block text-[13px] text-dim">
                  The public demo replays that run, one call at a time. No money moves.
                </span>
              </>
            ) : (
              <span className="mt-1 block text-[13px] leading-[1.55] text-dim">
                The public demo always replays the recorded 12 Nov 19:38 WAT run for the question above. It will not fetch a live briefing, invent an answer, or show a new payment for what you typed. No money moves.
              </span>
            )
          ) : (
            <span className="text-dim">Type a question — the demo still replays the recorded run, and says so.</span>
          )}
        </p>
        <Link href="/app?ask=1" className="pill pill-cent h-12 shrink-0 px-7 text-[15px]">
          Replay the recorded run
        </Link>
      </div>
    </form>
  );
}
