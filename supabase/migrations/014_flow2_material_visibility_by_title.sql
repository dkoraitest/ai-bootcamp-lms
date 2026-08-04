-- Flow 2 reuses every material except entries explicitly named as lesson recordings.
-- Lesson recordings are identified by their title, not by the material type.

update public.cohort_material_settings flow2
set
  is_visible = (btrim(m.title) not ilike 'Запись урока%'),
  url = case
    when btrim(m.title) not ilike 'Запись урока%' then flow1.url
    else null
  end,
  released_at = case
    when btrim(m.title) not ilike 'Запись урока%' then coalesce(flow2.released_at, now())
    else null
  end
from public.materials m
left join public.cohort_material_settings flow1
  on flow1.cohort_id = 'flow-1'
 and flow1.material_id = m.id
where flow2.cohort_id = 'flow-2'
  and flow2.material_id = m.id;
