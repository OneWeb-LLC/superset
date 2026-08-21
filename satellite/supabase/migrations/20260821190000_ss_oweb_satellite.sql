-- Licensed to the Apache Software Foundation (ASF) under one
-- or more contributor license agreements.  See the NOTICE file
-- distributed with this work for additional information
-- regarding copyright ownership.  The ASF licenses this file
-- to you under the Apache License, Version 2.0 (the
-- "License"); you may not use this file except in compliance
-- with the License.  You may obtain a copy of the License at
--
--   http://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing,
-- software distributed under the License is distributed on an
-- "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
-- KIND, either express or implied.  See the License for the
-- specific language governing permissions and limitations
-- under the License.

/*
  Superset satellite on One OS (OWeb shared Supabase)

  - Namespaces domain tables as ss_* so they do not collide with
    One OS `profiles` / other constellation tables.
  - Auth remains shared Supabase Auth (auth.oweb.one / ebjzdcnphkfpxfldnatm).
  - Does not attach a global auth.users trigger (would fire for every OWeb user).
    The app upserts ss_profiles on first authenticated visit.
*/

CREATE TABLE IF NOT EXISTS public.ss_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  one_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ss_profiles_email_key ON public.ss_profiles (email);
CREATE UNIQUE INDEX IF NOT EXISTS ss_profiles_one_id_key ON public.ss_profiles (one_id)
  WHERE one_id IS NOT NULL;

ALTER TABLE public.ss_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ss_profiles_select_own ON public.ss_profiles;
CREATE POLICY ss_profiles_select_own ON public.ss_profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS ss_profiles_update_own ON public.ss_profiles;
CREATE POLICY ss_profiles_update_own ON public.ss_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS ss_profiles_insert_own ON public.ss_profiles;
CREATE POLICY ss_profiles_insert_own ON public.ss_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

GRANT SELECT, INSERT, UPDATE ON public.ss_profiles TO authenticated;
