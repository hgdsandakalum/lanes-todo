-- The production release date the client gives after their QA. New nullable column only.
ALTER TABLE tasks ADD COLUMN prod_date text;
