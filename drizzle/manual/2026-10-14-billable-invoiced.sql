-- Day 7: billable projects and invoiced tasks.
-- Run these instead of `npm run db:push` on a database that already has projects:
-- drizzle-kit reads the boolean default as missing and offers to empty the projects table.
ALTER TABLE projects ADD COLUMN billable integer DEFAULT false NOT NULL;
ALTER TABLE tasks ADD COLUMN invoiced_at integer;
-- Freelance work is the billable kind.
UPDATE projects SET billable = 1 WHERE workspace_id = 'ws_freelance';
