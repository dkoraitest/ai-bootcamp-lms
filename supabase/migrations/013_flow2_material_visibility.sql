-- Flow 2 reuses course materials but must not expose lesson recordings.
-- Keep this migration idempotent so it can be safely replayed in a preview.

update public.cohorts
set name = case id
  when 'flow-1' then 'Поток 1'
  when 'flow-2' then 'Поток 2'
  else name
end
where id in ('flow-1', 'flow-2');

update public.cohort_material_settings flow2
set
  is_visible = (m.type <> 'video'),
  url = case
    when m.type <> 'video' then flow1.url
    else null
  end,
  released_at = case
    when m.type <> 'video' then coalesce(flow2.released_at, now())
    else null
  end
from public.materials m
left join public.cohort_material_settings flow1
  on flow1.cohort_id = 'flow-1'
 and flow1.material_id = m.id
where flow2.cohort_id = 'flow-2'
  and flow2.material_id = m.id;
