import type { SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Sign-in for the free AI server is set up on this deployment. */
export const supabaseConfigured = Boolean(url && anonKey)

let client: Promise<SupabaseClient | null> | null = null

/** Only used to sign in to the free AI server; tasks never leave the device. Loaded on first use. */
export function getSupabase(): Promise<SupabaseClient | null> {
  client ??=
    url && anonKey
      ? import('@supabase/supabase-js').then(({ createClient }) =>
          // The session is kept in this browser and refreshed automatically, so returning visitors stay
          // signed in. Passkeys are a Supabase beta that needs this opt-in.
          createClient(url, anonKey, { auth: { experimental: { passkey: true } } }),
        )
      : Promise.resolve(null)
  return client
}

export async function getAccessToken(): Promise<string | null> {
  const sb = await getSupabase()
  const { data } = (await sb?.auth.getSession()) ?? { data: { session: null } }
  return data.session?.access_token ?? null
}

export async function isAdult(): Promise<boolean> {
  const sb = await getSupabase()
  const { data } = (await sb?.auth.getUser()) ?? { data: { user: null } }
  return (data.user?.user_metadata as { adult?: boolean } | undefined)?.adult === true
}

export async function sendMagicLink(email: string) {
  const sb = await getSupabase()
  if (!sb) throw new Error('Sign-in is not set up.')
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${location.origin}/settings` },
  })
  if (error) throw error
}

/** The code in the same email, for when the link opens in another browser or device. */
export async function verifyEmailCode(email: string, code: string) {
  const sb = await getSupabase()
  if (!sb) throw new Error('Sign-in is not set up.')
  const { error } = await sb.auth.verifyOtp({ email, token: code, type: 'email' })
  if (error) throw error
}

export async function confirmAdult() {
  const sb = await getSupabase()
  const { error } = (await sb?.auth.updateUser({ data: { adult: true } })) ?? {}
  if (error) throw error
}

export async function signOut() {
  await (await getSupabase())?.auth.signOut()
}

/** WebAuthn is available in this browser. */
export const passkeysSupported = () =>
  typeof window !== 'undefined' && 'PublicKeyCredential' in window

/** Signs in with a passkey saved on this device or in a password manager; no email needed. */
export async function signInWithPasskey() {
  const sb = await getSupabase()
  if (!sb) throw new Error('Sign-in is not set up.')
  const { error } = await sb.auth.signInWithPasskey()
  if (error) throw error
}

/** Saves a passkey for the signed-in user, for one-tap sign-in on any browser later. */
export async function addPasskey() {
  const sb = await getSupabase()
  if (!sb) throw new Error('Sign-in is not set up.')
  const { error } = await sb.auth.registerPasskey()
  if (error) throw error
}

export async function countPasskeys(): Promise<number> {
  const sb = await getSupabase()
  const { data } = (await sb?.auth.passkey.list()) ?? { data: null }
  return data?.length ?? 0
}
