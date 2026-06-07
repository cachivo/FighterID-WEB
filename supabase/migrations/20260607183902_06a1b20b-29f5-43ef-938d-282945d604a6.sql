
ALTER TYPE sparc_vote_status ADD VALUE IF NOT EXISTS 'LOCKED';
ALTER TYPE sparc_presence_status ADD VALUE IF NOT EXISTS 'idle';

DO $$ BEGIN
  CREATE TYPE sparc_vote_source AS ENUM ('human','ai','coach','hybrid','auto');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
