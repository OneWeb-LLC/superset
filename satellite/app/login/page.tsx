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

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContinueWithOweb } from '@/components/continue-with-oweb';
import { activateSupersetApp } from '@/lib/app-activation';
import { SUPERSET_ACTIVATION_KIND } from '@/lib/constants';
import { ensureSsProfile } from '@/lib/ensure-ss-profile';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled || !data.session?.user) return;
      await ensureSsProfile(data.session.user);
      await activateSupersetApp(data.session.user.id, SUPERSET_ACTIVATION_KIND);
      router.replace('/dashboard');
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError || !data.user) {
      setError(signInError?.message || 'Could not sign in');
      setBusy(false);
      return;
    }
    await ensureSsProfile(data.user);
    await activateSupersetApp(data.user.id, SUPERSET_ACTIVATION_KIND);
    router.replace('/dashboard');
  }

  return (
    <main className="center">
      <section className="card">
        <p className="eyebrow">OWeb Satellite</p>
        <h1>Superset</h1>
        <p className="lede">
          Charts and dashboards on shared OneID. Continue with OWeb — no second
          account.
        </p>
        <ContinueWithOweb disabled={busy} />
        <div className="divider">or sign in with email</div>
        <form onSubmit={onSubmit}>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={event => setEmail(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={event => setPassword(event.target.value)}
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}
