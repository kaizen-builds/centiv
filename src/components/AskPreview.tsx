"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { extractTopicFallback } from "@/lib/topic";
import { VERIFIED_RUN } from "@/lib/verified-run";

const DEMO = VERIFIED_RUN.question ?? "Is anything big happening with Ethereum ETFs this week?";

/**
 * Landing preview: type a full question, see the short Otto topic a built-in
 * picker would send. The public app uses SERV when a key is set.
 */
export default function AskPreview() {
  const [question, setQuestion] = useState(DEMO);
  const topic = useMemo(() => extractTopicFallback(question), [question]);
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
        className="mt-3 block w-full resize-none rounded-[18px] border border-[rgba(201,146,46,0.45)] bg-white px-4 py-3.5 text-[16px] leading-[1.55] text-bone outline-none placeholder:text-dim focus:border-cent sm:px-5"
      />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="min-w-0 text-[14.5px] leading-[1.55] text-mute">
          {question.trim() ? (
            <>
              Topic for Otto: <span className="font-medium text-bone">“{topic}”</span>
              <span className="mt-1 block text-[13px] text-dim">
                {recorded
                  ? "In the recorded run this topic was set directly, not chosen by SERV. Here, a built-in picker is showing what it would send. In the public demo, SERV picks the topic when a key is set."
                  : "Preview from a built-in picker, so you can see the short topic. In the public demo, SERV picks the topic when a key is set."}
              </span>
            </>
          ) : (
            <span className="text-dim">Type a full question to see the short topic.</span>
          )}
        </p>
        <Link href="/app?ask=1" className="pill pill-cent h-12 shrink-0 px-7 text-[15px]">
          Ask in the demo
        </Link>
      </div>
    </form>
  );
}
