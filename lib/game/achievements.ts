import { addDays } from "@/lib/domain/dates";

export type AchievementKey = "balanced_week" | "tutorkit_steady" | "inbox_zero" | "full_stack_week" | "paid_on_time";

export const ACHIEVEMENTS: { key: AchievementKey; title: string; how: string; available: boolean }[] = [
  { key: "balanced_week", title: "Balanced week", how: "Move a task in every workspace in one week.", available: true },
  { key: "tutorkit_steady", title: "TutorKit didn't slip", how: "Finish the Sunday TutorKit deep block four weeks running.", available: true },
  { key: "inbox_zero", title: "Inbox zero on review day", how: "Finish the Sunday review with nothing overdue.", available: true },
  { key: "full_stack_week", title: "Full stack week", how: "Ship a code task and get a design task approved in the same week.", available: true },
  { key: "paid_on_time", title: "Paid on time", how: "Invoice billable work in the same week it was delivered.", available: true },
];

/** Every workspace had at least one stage move this week. */
export const balancedWeek = (workspaceIds: string[], movedIn: Set<string>) => workspaceIds.length > 0 && workspaceIds.every((id) => movedIn.has(id));

/** The TutorKit deep block was completed on `sunday` and the three Sundays before it. */
export const tutorkitSteady = (sunday: string, doneSundays: Set<string>) => [0, 1, 2, 3].every((w) => doneSundays.has(addDays(sunday, -7 * w)));

/** The review was completed on a Sunday with no open task past its due date. */
export const inboxZero = (reviewDone: boolean, overdueCount: number) => reviewDone && overdueCount === 0;

/** At least one code dev release and one design approval in the week. */
export const fullStackWeek = (kinds: Set<string>) => kinds.has("dev") && kinds.has("approved");

/** Invoiced in the same Sunday-to-Saturday week the work was delivered (both YYYY-MM-DD, app timezone). */
export const paidOnTime = (deliveredWeek: string, invoicedWeek: string) => deliveredWeek === invoicedWeek;
