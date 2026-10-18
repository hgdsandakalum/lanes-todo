-- Notes: Apple Notes-style notes filed under a project, a workspace, or neither. New table only.
CREATE TABLE notes (
  id text PRIMARY KEY NOT NULL,
  body text DEFAULT '' NOT NULL,
  workspace_id text,
  project_id text,
  pinned integer DEFAULT false NOT NULL,
  created_at integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
  updated_at integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
  deleted_at integer,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON UPDATE no action ON DELETE set null
);
CREATE INDEX notes_updated_idx ON notes (updated_at);
