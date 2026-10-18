-- v2: task kinds, priorities, subtasks, estimates, reminders, recurrence, technical context,
-- checklists, labels, refs, dependencies, time tracking, day plans and reviews, templates.
-- Only nullable columns and new tables: every existing row keeps its data.
ALTER TABLE tasks ADD COLUMN kind text;
ALTER TABLE tasks ADD COLUMN priority text;
ALTER TABLE tasks ADD COLUMN parent_id text;
ALTER TABLE tasks ADD COLUMN estimate_min integer;
ALTER TABLE tasks ADD COLUMN remind_at integer;
ALTER TABLE tasks ADD COLUMN recur text;
ALTER TABLE tasks ADD COLUMN acceptance text;
ALTER TABLE tasks ADD COLUMN repro text;
ALTER TABLE tasks ADD COLUMN expected text;
ALTER TABLE tasks ADD COLUMN actual text;
ALTER TABLE tasks ADD COLUMN blocker text;
CREATE INDEX tasks_parent_idx ON tasks (parent_id);

CREATE TABLE checklist_items (
  id text PRIMARY KEY NOT NULL,
  task_id text NOT NULL,
  text text NOT NULL,
  done_at integer,
  sort integer DEFAULT 0 NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX checklist_task_idx ON checklist_items (task_id);

CREATE TABLE labels (
  id text PRIMARY KEY NOT NULL,
  name text NOT NULL,
  color text DEFAULT 'slate' NOT NULL
);
CREATE UNIQUE INDEX labels_name_unique ON labels (name);

CREATE TABLE task_labels (
  task_id text NOT NULL,
  label_id text NOT NULL,
  PRIMARY KEY (task_id, label_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (label_id) REFERENCES labels(id) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE task_refs (
  id text PRIMARY KEY NOT NULL,
  task_id text NOT NULL,
  kind text NOT NULL,
  ref text NOT NULL,
  title text,
  added_at integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX refs_task_idx ON task_refs (task_id);

CREATE TABLE task_deps (
  task_id text NOT NULL,
  depends_on_id text NOT NULL,
  PRIMARY KEY (task_id, depends_on_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (depends_on_id) REFERENCES tasks(id) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE time_entries (
  id text PRIMARY KEY NOT NULL,
  task_id text NOT NULL,
  started_at integer NOT NULL,
  ended_at integer,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX time_task_idx ON time_entries (task_id);

CREATE TABLE day_plans (
  date text NOT NULL,
  task_id text NOT NULL,
  sort integer DEFAULT 0 NOT NULL,
  carried integer DEFAULT false NOT NULL,
  PRIMARY KEY (date, task_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE day_reviews (
  date text PRIMARY KEY NOT NULL,
  note text,
  closed_at integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);

CREATE TABLE templates (
  id text PRIMARY KEY NOT NULL,
  name text NOT NULL,
  type text DEFAULT 'general' NOT NULL,
  kind text,
  title text NOT NULL,
  description text,
  checklist text NOT NULL,
  sort integer DEFAULT 0 NOT NULL
);
