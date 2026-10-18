-- Sign-in lockout: one row per wrong passcode. New table only.
CREATE TABLE login_failures (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  ip text NOT NULL,
  at integer NOT NULL
);
CREATE INDEX login_failures_at_idx ON login_failures (at);
