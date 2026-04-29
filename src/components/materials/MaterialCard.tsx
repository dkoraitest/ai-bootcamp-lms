"use client";

import { useState } from "react";

type MaterialType = "video" | "template" | "technique";

export interface Material {
  id: number;
  title: string;
  type: MaterialType;
  week: number;
  lessonId: number;
  lessonTopic: string;
  url: string;
  markdownContent?: string;
  description?: string;
}

type Props = {
  material: Material;
};

const TYPE_CONFIG: Record<
  MaterialType,
  { label: string; emoji: string; classes: string }
> = {
  video:     { label: "Видео",   emoji: "📹", classes: "bg-purple-100 text-purple-700" },
  template:  { label: "Шаблон",  emoji: "📄", classes: "bg-orange-100 text-orange-700" },
  technique: { label: "Техника", emoji: "💡", classes: "bg-blue-100 text-blue-700" },
};

export default function MaterialCard({ material }: Props) {
  const [copied, setCopied] = useState(false);
  const cfg = TYPE_CONFIG[material.type];

  const handleCopy = () => {
    navigator.clipboard.writeText(material.markdownContent ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col">
      {/* Type badge + week pill */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${cfg.classes}`}>
          {cfg.emoji} {cfg.label}
        </span>
        <span className="bg-zinc-100 text-zinc-500 text-xs rounded-full px-2 py-0.5">
          Неделя {material.week}
        </span>
      </div>

      {/* Title */}
      <p className="font-medium text-zinc-900 text-sm mt-2 leading-snug">
        {material.title}
      </p>

      {/* Description / lesson topic */}
      <p className="text-xs text-zinc-500 mt-1 flex-1">
        {material.description ?? material.lessonTopic}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-100">
        {material.type === "technique" ? (
          <>
            <button
              onClick={handleCopy}
              className="flex-1 border border-zinc-300 bg-white text-zinc-700 text-xs rounded-md px-3 py-1.5 hover:bg-zinc-50 transition-colors"
            >
              {copied ? "✅ Скопировано" : "📋 Скопировать markdown"}
            </button>
            {material.url && (
              <a
                href={material.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2563eb] text-xs hover:underline whitespace-nowrap shrink-0"
              >
                Открыть →
              </a>
            )}
          </>
        ) : material.url ? (
          <a
            href={material.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs rounded-md px-3 py-1.5 text-center transition-colors"
          >
            Открыть →
          </a>
        ) : (
          <span className="w-full bg-zinc-100 text-zinc-400 text-xs rounded-md px-3 py-1.5 text-center">
            Скоро
          </span>
        )}
      </div>
    </div>
  );
}
