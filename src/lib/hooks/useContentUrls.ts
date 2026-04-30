"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { type Material } from "@/components/materials/MaterialCard";

export function useLessonUrls(): Record<number, string> {
  const [urls, setUrls] = useState<Record<number, string>>({});

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("lessons")
      .select("lesson_number, video_url")
      .then(({ data }) => {
        if (!data) return;
        const map: Record<number, string> = {};
        for (const row of data) {
          if (row.video_url) map[row.lesson_number as number] = row.video_url as string;
        }
        setUrls(map);
      });
  }, []);

  return urls;
}

export function useMaterials(): { data: Material[]; loading: boolean } {
  const [data, setData] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("materials")
      .select("id, title, type, week, lesson_id, lesson_topic, url, description, markdown_content")
      .order("id")
      .then(({ data: rows }) => {
        if (rows) {
          setData(
            rows.map((r) => ({
              id:              r.id as number,
              title:           r.title as string,
              type:            r.type as Material["type"],
              week:            r.week as number,
              lessonId:        r.lesson_id as number,
              lessonTopic:     r.lesson_topic as string,
              url:             (r.url as string) ?? "",
              description:     (r.description as string) ?? undefined,
              markdownContent: (r.markdown_content as string) ?? undefined,
            }))
          );
        }
        setLoading(false);
      });
  }, []);

  return { data, loading };
}
