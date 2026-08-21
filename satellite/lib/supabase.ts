/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { createClient } from '@supabase/supabase-js';
import { OWEB_SESSION_STORAGE_KEY } from '@/lib/constants';

/**
 * Shared One OS / OWeb Supabase Auth (OneID).
 * Prefer auth.oweb.one custom domain; fall back to project URL.
 * storageKey matches OWeb (`ao-supabase-auth`) so same-browser SSO
 * can share session storage when domains allow it; cross-domain launches
 * use /sso?launch_token=… from the OWeb App Store.
 */
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  '';

const isBrowser = typeof window !== 'undefined';

export const supabase = createClient(
  supabaseUrl || 'https://auth.oweb.one',
  supabaseAnonKey || 'public-anon-key',
  {
    auth: {
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
      detectSessionInUrl: isBrowser,
      storage: isBrowser ? window.localStorage : undefined,
      storageKey: OWEB_SESSION_STORAGE_KEY,
    },
  },
);
