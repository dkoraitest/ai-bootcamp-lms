"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

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

export function useMaterialUrls(): Record<number, string> {
  const [urls, setUrls] = useState<Record<number, string>>({});

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("material_urls")
      .select("material_id, url")
      .then(({ data }) => {
        if (!data) return;
        const map: Record<number, string> = {};
        for (const row of data) {
          if (row.url) map[row.material_id as number] = row.url as string;
        }
        setUrls(map);
      });
  }, []);

  return urls;
}
