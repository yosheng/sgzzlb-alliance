import { useQuery } from "@tanstack/react-query"
import { queryMembersInRange, queryLatestMembers } from "@/services/memberService"
import type { Member, MemberWithStatus } from "@/lib/supabase"

export function useMembers(from: string, to: string) {
  return useQuery<MemberWithStatus[], Error>({
    queryKey: ["members", from, to],
    queryFn: () => queryMembersInRange(from, to),
    enabled: Boolean(from && to),
  })
}

export function useLatestMembers() {
  return useQuery<Member[], Error>({
    queryKey: ["members", "latest"],
    queryFn: queryLatestMembers,
  })
}
