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

/** App Store / OneID identifier for this satellite. */
export const SUPERSET_APP_ID = 'superset';

/** Default activation kind for a signed-in product session. */
export const SUPERSET_ACTIVATION_KIND = 'sign_in';

export const SUPERSET_SSO_ACTIVATION_KIND = 'sso_launch';

export const OWEB_SESSION_STORAGE_KEY = 'ao-supabase-auth';

export const OWEB_WORKSPACE_STORAGE_KEY = 'oweb_workspace_id';

export function getOwebAppUrl(): string {
  return process.env.NEXT_PUBLIC_OWEB_APP_URL || 'https://oweb.one';
}

export function getContinueWithOwebUrl(): string {
  return `${getOwebAppUrl()}/login?launch=${SUPERSET_APP_ID}`;
}

export function getSupersetEmbedUrl(): string | null {
  const url =
    process.env.NEXT_PUBLIC_SUPERSET_URL ||
    process.env.NEXT_PUBLIC_SUPERSET_PUBLIC_URL ||
    '';
  return url.trim() || null;
}
