-- Project votes table for Demo Day voting
create table project_votes (
  id uuid primary key default gen_random_uuid(),
  voter_id uuid references users(id) on delete cascade not null,
  votee_id uuid references users(id) on delete cascade not null,
  score int check (score >= 0 and score <= 10) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(voter_id, votee_id)
);

-- Index for faster lookups
create index idx_project_votes_voter on project_votes(voter_id);
create index idx_project_votes_votee on project_votes(votee_id);

-- RPC function to submit votes in bulk
create or replace function submit_project_votes(votes jsonb)
returns jsonb as $$
declare
  v_voter_id uuid;
  v_vote jsonb;
  v_count int := 0;
begin
  select auth.uid() into v_voter_id;

  if v_voter_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Iterate through votes and upsert
  for v_vote in select jsonb_array_elements(votes) loop
    insert into project_votes (voter_id, votee_id, score)
    values (
      v_voter_id,
      (v_vote->>'votee_id')::uuid,
      (v_vote->>'score')::int
    )
    on conflict(voter_id, votee_id) do update
    set score = excluded.score,
        updated_at = now();

    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('success', true, 'votes_submitted', v_count);
end;
$$ language plpgsql security definer;

-- RPC function to get project votes results (for admin, excluding organizers)
create or replace function get_project_votes_results()
returns table (
  user_id uuid,
  name text,
  email text,
  avg_score numeric,
  total_votes int,
  min_score int,
  max_score int
) as $$
begin
  return query
  select
    u.id,
    u.name,
    u.email,
    round(avg(pv.score)::numeric, 1) as avg_score,
    count(pv.id)::int as total_votes,
    min(pv.score)::int as min_score,
    max(pv.score)::int as max_score
  from users u
  left join project_votes pv on u.id = pv.votee_id
  where u.name not in ('Дима К', 'Кира', 'Paul')
    and exists (
      select 1 from project_votes where votee_id = u.id
    )
  group by u.id, u.name, u.email
  order by avg_score desc nulls last, total_votes desc;
end;
$$ language plpgsql security definer;

-- RPC function to get students for voting (all except current user and organizers)
create or replace function get_students_for_voting()
returns table (
  user_id uuid,
  name text
) as $$
begin
  return query
  select u.id, u.name
  from users u
  where u.id != auth.uid()
    and u.name not in ('Дима К', 'Кира', 'Paul')
  order by u.name;
end;
$$ language plpgsql security definer;

-- RPC function to get current user's votes
create or replace function get_my_project_votes()
returns table (
  votee_id uuid,
  score int
) as $$
begin
  return query
  select pv.votee_id, pv.score
  from project_votes pv
  where pv.voter_id = auth.uid();
end;
$$ language plpgsql security definer;
