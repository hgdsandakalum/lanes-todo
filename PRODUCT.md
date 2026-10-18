# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One user: the owner, a developer and designer who does code and design work across several workspaces at once. PM duties (a morning sweep, unblocking people, code reviews for Gaku and Otasuke) are part of the week, but the core job is building and designing. There are no other accounts, teammates or roles.

They use it on a laptop through the workday (PM sweep, picking and doing the deep task, moving tasks through stages) and on the phone away from the desk (quick add, routine check-offs, weekend TutorKit blocks). Both are first-class; the phone use is an installed PWA.

## Product Purpose

Lanes is a personal, gamified work tracker that replaces a TickTick setup. It exists to show where work actually stands across several parallel streams and to push toward finishing important work.

Success: it replaces the old list for daily use (Day 4's bar), a release can be shipped in one action, and the Sunday review can run off the dashboard.

## Positioning

Built around one person's real workflow rather than a generic list. Every task lives in a workspace and project; code and design tasks move through their own stages, so "done" means what it means for that kind of work; and the game rewards the deep task, the weekly three and shipped releases, not ticking off small tasks.

## Operating Context

- **Workspaces:** SoftSora (primary: opens first, quick add defaults to it, most space on the dashboard), TutorKit, Freelance, Admin & sales. Seeded projects are listed in `lib/db/seed.ts`.
- **Daily rhythm:** pick one deep task each day; star three tasks each week (one each from SoftSora, TutorKit, Freelance).
- **Routines by weekday:** PM sweep (Mon–Fri, 30 min, before opening any code), admin slot (Fri: invoices, quotations, follow-ups), TutorKit block (Sat), TutorKit deep block and the weekly review (Sun, 20 min).
- **Code release flow:** dev released means "my part is done" and counts for streaks and most XP; the task stays open until prod release. Staging is per project (Gaku, Olly). Work waiting for production is flagged after a per-project threshold. Several tasks ship together as one named release.
- **Design flow:** To do → Drafting → Sent for feedback → Revisions → Approved/delivered.
- **Timezone:** Asia/Colombo by default (`APP_TIMEZONE`); "today", routines and streaks follow it.
- The development plan lives in the Claude Docs doc "Lanes — Development Plan".

## Capabilities and Constraints

- Next.js 16 (App Router, Server Actions, partial prerendering), SQLite on Turso via Drizzle, Tailwind 4, deployed to Vercel Hobby. Installable PWA.
- Single passcode sign-in; the session cookie is HMAC-signed and lasts 30 days.
- Three main screens: Today, workspace/project (list or stage board), dashboard; plus project settings.
- Task types: Code, Design, General. Code fields: ticket ID, branch, PR/spec link. Design fields: asset count, revision round, Figma/Drive link.
- Quick add everywhere with shortcuts: `#gk` project, `@code`/`@design` type, `!fri`/`!tmr` due date.
- Projects: add, rename, recolor, archive (keeps history and XP), delete (only with no completed tasks), reorder, staging toggle, production wait threshold.
- Game: XP summed from events (never stored as a total), one overall level, Code and Design skill tracks, streaks with one rest day per week, achievements, a weekly score.
- Open decisions: the full list of active SoftSora projects; staging defaults; the 7-day production wait threshold.

## Brand Commitments

- Name: Lanes.
- Binding from the plan: quiet by default, color only where it carries meaning; each workspace and project has one color; the level bar is the single loud element in the shell; completing a task gets a small XP animation, never confetti; Archivo for everything: expanded width for headings, normal width for text (replaced Bricolage Grotesque and IBM Plex Sans on 2026-10-13 for a sharper, more technical look).

## Evidence on Hand

Real data only: the seeded workspaces, projects and routines in `lib/db/seed.ts`. No tasks, XP history or releases exist yet; future work must not fabricate them as if real (sample data in a design must be labelled as such).

## Product Principles

1. **Done means done for that kind of work.** Code, design and general tasks finish differently; never collapse them into one checkbox.
2. **Reward the important, not the many.** The deep task, the weekly three and shipped releases earn the most; small tasks are capped.
3. **Everything has a place.** Every task belongs to a project in a workspace; nothing blends into one flat list.
4. **Today stays calm.** Details, streaks and badges live on the dashboard; Today shows only what to do now.
5. **Fast on both devices.** Laptop by day and phone on the go are equal first-class contexts.
</content>
</invoke>
