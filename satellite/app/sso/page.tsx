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
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { activateSupersetApp } from '@/lib/app-activation';
import {
  OWEB_WORKSPACE_STORAGE_KEY,
  SUPERSET_SSO_ACTIVATION_KIND,
} from '@/lib/constants';
import { ensureSsProfile } from '@/lib/ensure-ss-profile';
import { supabase } from '@/lib/supabase';

function SsoRedeem() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const launchToken = searchParams.get('launch_token');
    if (!launchToken) {
      setError('Missing launch token');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/oweb/sso', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ launch_token: launchToken }),
        });
        const body = (await res.json()) as {
          error?: string;
          access_token?: string;
          refresh_token?: string;
          org_id?: string;
        };
        if (!res.ok) {
          throw new Error(body.error || 'SSO failed');
        }
        if (!body.access_token) {
          throw new Error('SSO failed');
        }

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: body.access_token,
          refresh_token: body.refresh_token || '',
        });
        if (sessionError) throw sessionError;

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await ensureSsProfile(user);
          await activateSupersetApp(user.id, SUPERSET_SSO_ACTIVATION_KIND);
          if (body.org_id) {
            try {
              sessionStorage.setItem(OWEB_WORKSPACE_STORAGE_KEY, body.org_id);
            } catch {
              /* ignore quota / private mode */
            }
          }
        }

        if (!cancelled) {
          router.replace('/dashboard');
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Could not complete OWeb sign-in';
          setError(message);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="center">
        <h1>OWeb sign-in failed</h1>
        <p className="lede">{error}</p>
        <a href="/login">Continue to login</a>
      </div>
    );
  }

  return (
    <div className="center">
      <p className="lede">Signing you in with OWeb…</p>
    </div>
  );
}

export default function SsoPage() {
  return (
    <Suspense
      fallback={
        <div className="center">
          <p className="lede">Loading…</p>
        </div>
      }
    >
      <SsoRedeem />
    </Suspense>
  );
}
