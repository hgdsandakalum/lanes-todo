-- Subscriptions: services paid on repeat, and each renewal paid. New tables only.
CREATE TABLE subscriptions (
  id text PRIMARY KEY NOT NULL,
  name text NOT NULL,
  category text DEFAULT 'other' NOT NULL,
  amount integer NOT NULL,
  currency text DEFAULT 'USD' NOT NULL,
  cycle text DEFAULT 'monthly' NOT NULL,
  next_due text NOT NULL,
  billing_day integer NOT NULL,
  status text DEFAULT 'active' NOT NULL,
  project_id text,
  url text,
  payment_method text,
  notes text,
  created_at integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON UPDATE no action ON DELETE no action
);

CREATE TABLE subscription_payments (
  id text PRIMARY KEY NOT NULL,
  subscription_id text NOT NULL,
  paid_on text NOT NULL,
  due_on text NOT NULL,
  amount integer NOT NULL,
  currency text NOT NULL,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX sub_payments_sub_idx ON subscription_payments (subscription_id);
