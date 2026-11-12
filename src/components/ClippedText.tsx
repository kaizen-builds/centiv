"use client";

import { useState } from "react";
import { clipAtSentence } from "@/lib/clip";

export default function ClippedText({
  text,
  max = 320,
  className = "",
}: {
  text: string;
  max?: number;
  className?: string;
}) {
  const { preview, clipped } = clipAtSentence(text, max);
  const [open, setOpen] = useState(false);
  if (!clipped) return <p className={className}>{text}</p>;

  return (
    <div>
      <p className={className}>{open ? text : preview}</p>
      <button
        type="button"
        className="mt-1 text-[12px] font-medium text-cent underline decoration-cent/30 underline-offset-2 transition hover:decoration-cent"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Show less" : "Show full"}
      </button>
    </div>
  );
}
