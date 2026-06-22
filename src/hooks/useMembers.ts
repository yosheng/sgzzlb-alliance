import { useQuery } from "@tanstack/react-query"
import { queryMembersInRange } from "@/services/memberService"
import type { MemberWithStatus } from "@/lib/supabase"

export function useMembers(from: string, to: string) {
  return useQuery<MemberWithStatus[], Error>({
    queryKey: ["members", from, to],
    queryFn: () => queryMembersInRange(from, to),
    enabled: Boolean(from && to),
  })
}
