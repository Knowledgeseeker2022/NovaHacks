/*
  # Create users table for storing nicknames

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - matches auth.users id
      - `nickname` (text, not null) - user's preferred name
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS
    - Add policies for users to read/update their own data
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  nickname text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);