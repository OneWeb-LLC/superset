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
import { NextRequest, NextResponse } from 'next/server';
import { SUPERSET_ACTIVATION_KIND, SUPERSET_APP_ID } from '@/lib/constants';

const OWEB_ACTIVATE_URL = 'https://oweb.one/api/v1/oneid/activate';

/**
 * Proxy OneID activation to OWeb so the browser does not hit cross-origin CORS.
 * Unknown app_id (catalog not yet updated) is treated as a soft failure.
 */
export async function POST(request: NextRequest) {
  const header =
    request.headers.get('authorization') || request.headers.get('Authorization');
  if (!header) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let payload: { app_id?: string; activation_kind?: string } = {};
  try {
    payload = (await request.json()) as { app_id?: string; activation_kind?: string };
  } catch {
    payload = {};
  }

  try {
    const res = await fetch(OWEB_ACTIVATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: header,
      },
      body: JSON.stringify({
        app_id: payload.app_id || SUPERSET_APP_ID,
        activation_kind: payload.activation_kind || SUPERSET_ACTIVATION_KIND,
      }),
    });
    const body: unknown = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch (err) {
    console.error('oneid activate proxy failed', err);
    return NextResponse.json({ error: 'activate_proxy_failed' }, { status: 502 });
  }
}
