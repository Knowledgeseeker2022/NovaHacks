/*
  # Add INSERT policy for users table

  1. Security Changes
    - Add policy to allow users to insert their own data
    - Policy ensures users can only create their own profile
    - Matches auth.uid() with the id column
*/

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);