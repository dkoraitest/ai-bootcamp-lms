"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { type Material } from "@/components/materials/MaterialCard";
import { useCohort } from "@/lib/cohort/CohortProvider";
import { HW_MATERIAL_IDS, type HwMaterial } from "@/lib/program/hwMaterials";

export type CohortLessonSchedule = {
  lesson_number: number;
  lesson_date: string | null;
  starts_at: string | null;
  title_override: string | null;
  topic_override: string | null;
  is_released: boolean;
};

export type CohortAssignmentSchedule = {
  hw_number: number;
  deadline: string | null;
  is_released: boolean;
};

export function useLessonUrls(): Record<number, string> {
  const { activeCohortId } = useCohort();
  const [urls, setUrls] = useState<Record<number, string>>({});

  useEffect(() => {
    let cancelled = false;
    setUrls({});

    if (!activeCohortId) {
      return () => {
        cancelled = true;
      };
    }

    const supabase = createClient();
    supabase
      .from("cohort_lesson_settings")
      .select("lesson_number, video_url")
      .eq("cohort_id", activeCohortId)
      .eq("is_released", true)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const map: Record<number, string> = {};
        for (const row of data) {
          if (row.video_url) map[row.lesson_number as number] = row.video_url as string;
        }
        setUrls(map);
      });

    return () => {
      cancelled = true;
    };
  }, [activeCohortId]);

  return urls;
}

export function useMaterials(): { data: Material[]; loading: boolean } {
  const { activeCohortId } = useCohort();
  const [data, setData] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setData([]);

    if (!activeCohortId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const { data: settings, error: settingsError } = await supabase
        .from("cohort_material_settings")
        .select("material_id, url")
        .eq("cohort_id", activeCohortId)
        .eq("is_visible", true);

      if (cancelled) return;
      if (settingsError || !settings?.length) {
        setData([]);
        setLoading(false);
        return;
      }

      const settingsByMaterial = new Map(
        settings.map((setting) => [setting.material_id as number, setting.url as string | null])
      );
      const { data: rows } = await supabase
        .from("materials")
        .select("id, title, type, week, lesson_id, lesson_topic, url, description, markdown_content")
        .in("id", Array.from(settingsByMaterial.keys()))
        .order("id");

      if (cancelled) return;
      setData(
        (rows ?? []).map((r) => ({
          id: r.id as number,
          title: r.title as string,
          type: r.type as Material["type"],
          week: r.week as number,
          lessonId: r.lesson_id as number,
          lessonTopic: r.lesson_topic as string,
          url: settingsByMaterial.get(r.id as number) ?? (r.url as string) ?? "",
          description: (r.description as string) ?? undefined,
          markdownContent: (r.markdown_content as string) ?? undefined,
        }))
      );
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [activeCohortId]);

  return { data, loading };
}

// Материалы, разложенные по номерам ДЗ: карточка задания показывает их
// ссылками, чтобы артефакт открывался из самого задания.
export function useAssignmentMaterials(): Record<number, HwMaterial[]> {
  const { data } = useMaterials();

  return useMemo(() => {
    const byId = new Map(data.map((material) => [material.id, material]));
    const result: Record<number, HwMaterial[]> = {};

    for (const [hwNumber, materialIds] of Object.entries(HW_MATERIAL_IDS)) {
      const items = materialIds
        .map((id) => byId.get(id))
        .filter((material): material is Material => Boolean(material?.url))
        .map((material) => ({
          id: material.id,
          title: material.title.trim(),
          url: material.url,
          type: material.type,
        }));

      if (items.length > 0) result[Number(hwNumber)] = items;
    }

    return result;
  }, [data]);
}

export function useCohortSchedule() {
  const { activeCohortId } = useCohort();
  const [lessonSchedule, setLessonSchedule] = useState<CohortLessonSchedule[]>([]);
  const [assignmentSchedule, setAssignmentSchedule] = useState<CohortAssignmentSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLessonSchedule([]);
    setAssignmentSchedule([]);

    if (!activeCohortId) {
      setLessonSchedule([]);
      setAssignmentSchedule([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelled = false;
    const supabase = createClient();

    Promise.all([
      supabase
        .from("cohort_lesson_schedule")
        .select("lesson_number, lesson_date, starts_at, title_override, topic_override, is_released")
        .eq("cohort_id", activeCohortId)
        .order("lesson_number"),
      supabase
        .from("cohort_assignment_schedule")
        .select("hw_number, deadline, is_released")
        .eq("cohort_id", activeCohortId)
        .order("hw_number"),
    ]).then(([lessons, assignments]) => {
      if (cancelled) return;
      setLessonSchedule((lessons.data ?? []) as CohortLessonSchedule[]);
      setAssignmentSchedule((assignments.data ?? []) as CohortAssignmentSchedule[]);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeCohortId]);

  return { lessonSchedule, assignmentSchedule, loading };
}
