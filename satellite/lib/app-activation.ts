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
import { supabase } from '@/lib/supabase';
import {
  SUPERSET_ACTIVATION_KIND,
  SUPERSET_APP_ID,
} from '@/lib/constants';

export type ActivationKind =
  | 'signup'
  | 'sign_in'
  | 'sso_launch'
  | 'invite_accept'
  | 'oneid_claim'
  | 'import_reconciled';

/**
 * Record this satellite in OneID app activations (Layer 3).
 * Uses the shared One OS RPC so activation works even before the App Store
 * catalog lists this app_id. Also POSTs to OWeb when a session token exists.
 */
export async function activateSupersetApp(
  userId: string,
  kind: ActivationKind = SUPERSET_ACTIVATION_KIND,
): Promise<void> {
  const { error } = await supabase.rpc('ao_upsert_app_activation', {
    p_app_id: SUPERSET_APP_ID,
    p_user_id: userId,
    p_activation_kind: kind,
  });
  if (error) {
    console.warn('[superset] app activation rpc failed', error.message);
  }

  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) return;

  try {
    await fetch('/api/oneid/activate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        app_id: SUPERSET_APP_ID,
        activation_kind: kind,
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'activate_failed';
    console.warn('[superset] app activation proxy failed', message);
  }
}
