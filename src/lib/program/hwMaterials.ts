// Какие материалы курса нужны для каждого ДЗ. Ссылки на них показываются
// прямо в карточке задания, чтобы за артефактом не нужно было уходить
// в раздел материалов и искать его там глазами.
//
// Значения — id из таблицы materials. Сама ссылка берётся из материала
// и может отличаться от потока к потоку: cohort_material_settings.url
// перекрывает materials.url. Материал, скрытый для потока, просто не
// попадёт в карточку.
export const HW_MATERIAL_IDS: Record<number, number[]> = {
  1: [101, 13, 19],
  2: [104, 103, 15],
  3: [105, 106, 107, 108, 45],
  4: [17, 47, 25, 55, 26],
  5: [39],
  6: [37, 38, 40],
  7: [],
};

const FLOW2_HW_MATERIAL_IDS = {
  ...HW_MATERIAL_IDS,
  4: [17, 47, 25, 55],
  5: [90001, 90002, 90003, 90004, 110, 26, 39],
};

export function getHwMaterialIds(cohortId: string | null): Record<number, number[]> {
  return cohortId === "flow-2" ? FLOW2_HW_MATERIAL_IDS : HW_MATERIAL_IDS;
}

export type HwMaterial = {
  id: number;
  title: string;
  url: string;
  type: "video" | "template" | "technique";
};
