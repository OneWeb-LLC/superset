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

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { activateSupersetApp } from '@/lib/app-activation';
import {
  getOwebAppUrl,
  getSupersetEmbedUrl,
  OWEB_WORKSPACE_STORAGE_KEY,
  SUPERSET_ACTIVATION_KIND,
} from '@/lib/constants';
import { ensureSsProfile } from '@/lib/ensure-ss-profile';
import { formatOneId } from '@/lib/oneid';
import { supabase } from '@/lib/supabase';

type DashboardState = {
  email: string;
  oneId: string | null;
  workspaceId: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [state, setState] = useState<DashboardState | null>(null);
  const embedUrl = getSupersetEmbedUrl();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        router.replace('/login');
        return;
      }
      const profile = await ensureSsProfile(user);
      await activateSupersetApp(user.id, SUPERSET_ACTIVATION_KIND);
      let workspaceId: string | null = null;
      try {
        workspaceId = sessionStorage.getItem(OWEB_WORKSPACE_STORAGE_KEY);
      } catch {
        workspaceId = null;
      }
      if (!cancelled) {
        setState({
          email: profile.email,
          oneId: profile.oneId,
          workspaceId,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  if (!state) {
    return (
      <div className="center">
        <p className="lede">Loading workspace…</p>
      </div>
    );
  }

  const handle = formatOneId(state.oneId);

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">OWeb Satellite</p>
          <strong>Superset</strong>
        </div>
        <div className="identity">
          <strong>{handle || state.email}</strong>
          <span className="muted">
            {state.workspaceId
              ? `Workspace ${state.workspaceId}`
              : 'No workspace from this launch'}
          </span>
        </div>
        <button className="btn-ghost" type="button" onClick={() => void signOut()}>
          Sign out
        </button>
      </header>
      <main className="dashboard">
        <section className="panel">
          <h1>Analytics for this workspace</h1>
          <p className="lede">
            You are signed in with shared OneID. App Store launches redeem an SSO
            token; entitlements come from the OWeb workspace package, not a second
            Stripe SKU.
          </p>
          <p className="muted">
            The Flask Apache Superset backend is not hosted on Vercel. Point{' '}
            <code>NEXT_PUBLIC_SUPERSET_URL</code> at a hosted instance to embed
            dashboards here, or open the{' '}
            <a href={`${getOwebAppUrl()}/apps`}>OWeb App Store</a>.
          </p>
        </section>
        {embedUrl ? (
          <iframe
            className="embed"
            title="Apache Superset"
            src={embedUrl}
            allow="clipboard-read; clipboard-write"
          />
        ) : null}
      </main>
    </div>
  );
}
