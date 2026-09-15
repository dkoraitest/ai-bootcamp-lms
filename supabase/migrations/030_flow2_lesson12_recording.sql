-- Запись демо-дня flow-2, урок 12 от 15.09.2026.
-- Тот же порядок, что и в 021: только контент, роли/RLS, ДЗ и flow-1 не трогаем.
-- materials.id не имеет default/sequence: выделяем ID под блокировкой.
lock table public.materials, public.cohort_lesson_settings,
  public.cohort_material_settings in share row exclusive mode;
do $$
declare
  r record;
  v_id integer;
  v_existing_lesson integer;
begin
  for r in select * from (values
    (12,6,'Demo Day — Защита проектов','15.09.2026','https://drive.google.com/file/d/1qoPppC7iNklsRNHGWQzzjoXAcVSHgHH0/view?usp=drive_link')
  ) as x(lesson_number,week,title,recorded_on,url)
  loop
    if exists(select 1 from public.cohort_lesson_settings
      where cohort_id='flow-2' and lesson_number=r.lesson_number
        and nullif(trim(video_url),'') is not null and video_url<>r.url) then
      raise exception 'Lesson % already has another URL; review before overwrite',r.lesson_number;
    end if;
    insert into public.cohort_lesson_settings(cohort_id,lesson_number,video_url,is_released,released_at)
      values('flow-2',r.lesson_number,r.url,true,now())
      on conflict(cohort_id,lesson_number) do update
        set video_url=excluded.video_url,is_released=true,
            released_at=coalesce(public.cohort_lesson_settings.released_at,excluded.released_at);

    if (select count(*) from public.materials where url=r.url)>1 then
      raise exception 'Recording URL matches multiple materials';
    end if;
    select id,lesson_id into v_id,v_existing_lesson from public.materials where url=r.url;
    if v_id is not null then
      if v_existing_lesson is distinct from r.lesson_number or not exists(
        select 1 from public.cohort_material_settings where cohort_id='flow-2' and material_id=v_id
      ) then raise exception 'Recording URL already belongs to another material'; end if;
    else
      select coalesce(max(id),0)+1 into v_id from public.materials;
      insert into public.materials(id,title,type,week,lesson_id,lesson_topic,url,description)
        values(v_id,r.title,'video',r.week,r.lesson_number,r.title,r.url,
          'Запись урока '||r.lesson_number||' · '||r.recorded_on);
    end if;
    insert into public.cohort_material_settings(cohort_id,material_id,is_visible,url,released_at)
      values('flow-2',v_id,true,r.url,now())
      on conflict(cohort_id,material_id) do update
        set is_visible=true,url=excluded.url,
            released_at=coalesce(public.cohort_material_settings.released_at,excluded.released_at);
    insert into public.cohort_material_settings(cohort_id,material_id,is_visible,url,released_at)
      values('flow-1',v_id,false,null,null)
      on conflict(cohort_id,material_id) do nothing;
    if exists(select 1 from public.cohort_material_settings
      where material_id=v_id and cohort_id<>'flow-2' and is_visible) then
      raise exception 'Recording unexpectedly visible in another cohort';
    end if;
  end loop;
end $$;
