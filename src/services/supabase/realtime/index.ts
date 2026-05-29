import { getSupabaseClient } from '../client'

export function subscribeToTableChanges(
  channelName: string,
  table: string,
  callback: (payload: unknown) => void,
) {
  const supabase = getSupabaseClient()

  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
