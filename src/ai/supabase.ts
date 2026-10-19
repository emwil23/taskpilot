import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Only used to sign in to the free AI server. Tasks never leave the device. */
export const supabase = url && anonKey ? createClient(url, anonKey) : null

export async function getAccessToken(): Promise<string | null> {
  const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } }
  return data.session?.access_token ?? null
}

export async function isAdult(): Promise<boolean> {
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } }
  return (data.user?.user_metadata as { adult?: boolean } | undefined)?.adult === true
}

export async function sendMagicLink(email: string) {
  if (!supabase) throw new Error('Sign-in is not set up.')
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${location.origin}/settings` },
  })
  if (error) throw error
}

export async function confirmAdult() {
  const { error } = (await supabase?.auth.updateUser({ data: { adult: true } })) ?? {}
  if (error) throw error
}
