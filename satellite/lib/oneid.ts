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

/**
 * OneID — constellation identity (Apple-ID equivalent).
 *
 * Canonical handle lives on One OS; this satellite caches a projection.
 */

/** Public handle pattern: 3–30 chars, lowercase alphanumeric + underscore. */
export const ONE_ID_PATTERN = /^[a-z][a-z0-9_]{2,29}$/;

export const ONE_ID_RESERVED = new Set([
  'admin',
  'administrator',
  'api',
  'auth',
  'help',
  'null',
  'oneid',
  'oweb',
  'root',
  'superset',
  'support',
  'system',
  'www',
]);

export type OneIdMemberKind = 'workspace_member' | 'guest';

export type OneIdIdentity = {
  /** auth.users.id */
  userId: string;
  /** Unique handle without @ */
  oneId: string | null;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

/** Format handle for UI. */
export function formatOneId(handle: string | null | undefined): string | null {
  if (!handle) return null;
  const normalized = handle.replace(/^@/, '').toLowerCase();
  return normalized ? `@${normalized}` : null;
}

export function normalizeOneId(raw: string): string {
  return raw.trim().replace(/^@/, '').toLowerCase();
}

export function isValidOneId(raw: string): boolean {
  const handle = normalizeOneId(raw);
  if (!ONE_ID_PATTERN.test(handle)) return false;
  if (ONE_ID_RESERVED.has(handle)) return false;
  return true;
}

/** Read OneID handle from Supabase Auth user metadata. */
export function oneIdFromAuthUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): OneIdIdentity {
  const meta = user.user_metadata || {};
  const fromMeta =
    (typeof meta.one_id === 'string' && meta.one_id) ||
    (typeof meta.oneId === 'string' && meta.oneId) ||
    (typeof meta.username === 'string' && meta.username) ||
    null;

  const displayName =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.display_name === 'string' && meta.display_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    null;

  const avatarUrl =
    (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
    (typeof meta.picture === 'string' && meta.picture) ||
    null;

  const oneId = fromMeta ? normalizeOneId(fromMeta) : null;

  return {
    userId: user.id,
    oneId: oneId && isValidOneId(oneId) ? oneId : oneId,
    email: user.email || '',
    displayName,
    avatarUrl,
  };
}

export const SUPERSET_INVITE_DEFAULTS = {
  memberKind: 'guest' as OneIdMemberKind,
  appId: 'superset',
  grantsWorkspaceAppAccess: false,
} as const;
