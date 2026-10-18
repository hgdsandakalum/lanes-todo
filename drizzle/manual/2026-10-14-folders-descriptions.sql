-- Project folders (Open in Cursor, the lanes command) and task descriptions (Markdown).
-- Plain nullable columns: every existing row keeps its data.
ALTER TABLE projects ADD COLUMN local_path text;
ALTER TABLE tasks ADD COLUMN description text;
