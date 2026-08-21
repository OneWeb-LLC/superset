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
import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { SUPERSET_APP_ID } from '@/lib/constants';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Redeem an OWeb App Store launch token into Supabase session tokens.
 * Contract: OWeb mints rows in ao_ecosystem_launch_tokens and redirects to
 *   {satellite}/sso?launch_token=…
 */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const launchToken =
      typeof body === 'object' &&
      body !== null &&
      'launch_token' in body &&
      typeof (body as { launch_token: unknown }).launch_token === 'string'
        ? (body as { launch_token: string }).launch_token
        : null;

    if (!launchToken) {
      return NextResponse.json({ error: 'launch_token required' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const tokenHash = hashToken(launchToken);

    const { data: row, error } = await admin
      .from('ao_ecosystem_launch_tokens')
      .select(
        'id, app_id, org_id, user_id, access_token, refresh_token, expires_at, consumed_at',
      )
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (error) {
      console.error('SSO lookup failed', error);
      return NextResponse.json({ error: 'sso_lookup_failed' }, { status: 500 });
    }

    if (!row) {
      return NextResponse.json({ error: 'invalid_token' }, { status: 404 });
    }

    if (row.consumed_at) {
      return NextResponse.json({ error: 'token_already_used' }, { status: 410 });
    }

    if (new Date(row.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'token_expired' }, { status: 410 });
    }

    // Prefer app_id=superset once registered in the OWeb App Store catalog.
    // During rollout, accept null/empty app_id so minting can land before catalog update.
    if (row.app_id && row.app_id !== SUPERSET_APP_ID) {
      return NextResponse.json({ error: 'wrong_app' }, { status: 403 });
    }

    const { error: consumeError } = await admin
      .from('ao_ecosystem_launch_tokens')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', row.id)
      .is('consumed_at', null);

    if (consumeError) {
      console.error('SSO consume failed', consumeError);
      return NextResponse.json({ error: 'sso_consume_failed' }, { status: 500 });
    }

    return NextResponse.json({
      access_token: row.access_token,
      refresh_token: row.refresh_token,
      org_id: row.org_id,
      user_id: row.user_id,
      app_id: row.app_id,
    });
  } catch (err) {
    console.error('SSO redeem error', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
