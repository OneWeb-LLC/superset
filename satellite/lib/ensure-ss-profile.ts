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
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { SS } from '@/lib/ss-tables';
import { isValidOneId, normalizeOneId, oneIdFromAuthUser } from '@/lib/oneid';

/** Upsert the Superset profile projection for a shared OneID / One OS auth user. */
export async function ensureSsProfile(user: User) {
  const identity = oneIdFromAuthUser(user);
  let oneId = identity.oneId;
  let displayName = identity.displayName;
  let avatarUrl = identity.avatarUrl;

  if (!oneId || !isValidOneId(oneId)) {
    const { data } = await supabase
      .from('one_id_profiles')
      .select('one_id, display_name, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data?.one_id) {
      oneId = normalizeOneId(data.one_id);
      if (!displayName && data.display_name) {
        displayName = data.display_name;
      }
      if (!avatarUrl && data.avatar_url) {
        avatarUrl = data.avatar_url;
      }
    }
  }

  const resolvedOneId = oneId && isValidOneId(oneId) ? oneId : null;

  const { error } = await supabase.from(SS.profiles).upsert(
    {
      id: identity.userId,
      email: identity.email,
      full_name: displayName,
      avatar_url: avatarUrl,
      one_id: resolvedOneId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );

  if (error) {
    console.error('ensureSsProfile failed', error);
  }

  return {
    userId: identity.userId,
    oneId: resolvedOneId,
    email: identity.email,
    displayName,
    avatarUrl,
  };
}
