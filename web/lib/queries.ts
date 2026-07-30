/**
 * Typed data-access functions (PROJECT_BRIEF.md Prompt 11). Every read the
 * dashboard and project page need go through here — nothing calls
 * `supabase.from(...)` directly outside this file.
 */

import { supabase } from "./supabase";
import type {
  ActionRow,
  AtRiskMember,
  Member,
  Metrics,
  Segment,
} from "./supabase";

// PostgREST caps a single response at 1000 rows by default — at_risk_members
// has 2,260. Without paging, getAtRiskMembers() silently truncated to the
// first 1,000 (by annual_value_thb desc), which understated every KPI on
// the dashboard. Page through with .range() until a page comes back short.
const PAGE_SIZE = 1000;

async function fetchAllPages<T>(
  // PromiseLike, not Promise — supabase-js's query builder is thenable but
  // isn't typed as a strict Promise (no .catch/.finally), so it doesn't
  // structurally satisfy Promise<...>.
  queryFn: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  context: string,
): Promise<T[]> {
  const all: T[] = [];
  let start = 0;
  for (;;) {
    const { data, error } = await queryFn(start, start + PAGE_SIZE - 1);
    if (error) throw new Error(`${context}: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    start += PAGE_SIZE;
  }
  return all;
}

export async function getAtRiskMembers(): Promise<AtRiskMember[]> {
  return fetchAllPages<AtRiskMember>(
    (from, to) =>
      supabase
        .from("at_risk_members")
        .select("*")
        .order("annual_value_thb", { ascending: false })
        .range(from, to),
    "getAtRiskMembers",
  );
}

export async function getSegments(): Promise<Segment[]> {
  const { data, error } = await supabase
    .from("segments")
    .select("*")
    .order("share", { ascending: false });
  if (error) throw new Error(`getSegments: ${error.message}`);
  return data ?? [];
}

export async function getMetrics(): Promise<Metrics | null> {
  const { data, error } = await supabase
    .from("metrics")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(`getMetrics: ${error.message}`);
  return data;
}

export async function getMemberDetail(
  memberId: string,
): Promise<Member | null> {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("member_id", memberId)
    .maybeSingle();
  if (error) throw new Error(`getMemberDetail: ${error.message}`);
  return data;
}

export async function getActions(): Promise<ActionRow[]> {
  const { data, error } = await supabase.from("actions").select("*");
  if (error) throw new Error(`getActions: ${error.message}`);
  return data ?? [];
}

/** Total scored population — the dashboard's "active members" KPI. */
export async function getActiveMemberCount(): Promise<number> {
  const { count, error } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`getActiveMemberCount: ${error.message}`);
  return count ?? 0;
}
