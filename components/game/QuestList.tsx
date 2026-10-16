import { quests } from "@/lib/quests";

function Box({ checked }: { checked: boolean }) {
  return (
    <svg viewBox="0 0 9 9" width={14} height={14} className="shrink-0" shapeRendering="crispEdges" aria-hidden>
      <rect x="0" y="0" width="9" height="9" fill="#f8f8f8" />
      <rect x="1" y="1" width="7" height="7" fill="#101850" />
      {checked && (
        <g fill="#30c030">
          <rect x="2" y="4" width="1" height="2" />
          <rect x="3" y="5" width="1" height="2" />
          <rect x="4" y="4" width="1" height="2" />
          <rect x="5" y="3" width="1" height="2" />
          <rect x="6" y="2" width="1" height="2" />
        </g>
      )}
    </svg>
  );
}

// done = antal klarede opgaver (i rækkefølge)
export default function QuestList({ done, className = "" }: { done: number; className?: string }) {
  return (
    <div className={`zelda-box font-readable px-3 py-2 text-lg leading-none sm:text-xl ${className}`}>
      <p className="text-[#30c030]">- OPGAVER -</p>
      <ol className="mt-1.5 space-y-1">
        {quests.map((q, i) => (
          <li
            key={q.id}
            className={`flex items-center gap-2 ${
              i < done ? "text-[#888] line-through" : i === done ? "text-[#f8d848]" : "text-[#f8f8f8]"
            }`}
          >
            <Box checked={i < done} />
            <span>
              {i + 1}. {q.label}
              {i === done && <span className="ml-1 animate-[blink_0.8s_steps(2,start)_infinite] no-underline">◀</span>}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
