-- Images pasted into notes. New table only.
CREATE TABLE note_images (
  id text PRIMARY KEY NOT NULL,
  note_id text NOT NULL,
  key text NOT NULL,
  content_type text NOT NULL,
  size integer NOT NULL,
  created_at integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX note_images_note_idx ON note_images (note_id);
