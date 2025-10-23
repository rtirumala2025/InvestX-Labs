-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Create user_profiles table
create table if not exists public.user_profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint username_length check (char_length(username) >= 3)
);

-- Create chat_sessions table
create table if not exists public.chat_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  model_used text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create chat_messages table
create table if not exists public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references chat_sessions(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create analytics_events table
create table if not exists public.analytics_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  event_data jsonb,
  user_agent text,
  page_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better query performance
create index if not exists idx_chat_sessions_user_id on public.chat_sessions(user_id);
create index if not exists idx_chat_messages_session_id on public.chat_messages(session_id);
create index if not exists idx_analytics_events_user_id on public.analytics_events(user_id);
create index if not exists idx_analytics_events_event_type on public.analytics_events(event_type);
create index if not exists idx_analytics_events_created_at on public.analytics_events(created_at);

-- Enable Row Level Security
alter table public.user_profiles enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.analytics_events enable row level security;

-- User profiles RLS policies
create policy "Users can view their own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

-- Chat sessions RLS policies
create policy "Users can view their own chat sessions"
  on public.chat_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own chat sessions"
  on public.chat_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own chat sessions"
  on public.chat_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own chat sessions"
  on public.chat_sessions for delete
  using (auth.uid() = user_id);

-- Chat messages RLS policies
create policy "Users can view messages in their own sessions"
  on public.chat_messages for select
  using (exists (
    select 1 from public.chat_sessions 
    where chat_sessions.id = chat_messages.session_id 
    and chat_sessions.user_id = auth.uid()
  ));

create policy "Users can insert messages in their own sessions"
  on public.chat_messages for insert
  with check (exists (
    select 1 from public.chat_sessions 
    where chat_sessions.id = chat_messages.session_id 
    and chat_sessions.user_id = auth.uid()
  ));

-- Analytics events RLS policies
create policy "Users can view their own analytics events"
  on public.analytics_events for select
  using (auth.uid() = user_id);

create policy "Service role can insert analytics events"
  on public.analytics_events for insert
  to service_role
  with check (true);

-- Create a function to handle new user signups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, username, full_name)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger to handle new user signups
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create a function to get the current user's profile
create or replace function public.get_user_profile()
returns json as $$
  select json_build_object(
    'id', u.id,
    'email', u.email,
    'username', p.username,
    'full_name', p.full_name,
    'avatar_url', p.avatar_url,
    'created_at', u.created_at
  )
  from auth.users u
  left join public.user_profiles p on u.id = p.id
  where u.id = auth.uid();
$$ language sql security definer;
