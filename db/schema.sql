CREATE TABLE IF NOT EXISTS students (
  id text PRIMARY KEY,
  access_code_lookup text UNIQUE NOT NULL,
  access_code_hash text NOT NULL,
  display_name text,
  disabled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE students ADD COLUMN IF NOT EXISTS access_code_lookup text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS access_code_hash text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS disabled_at timestamptz;
ALTER TABLE students ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS students_access_code_lookup_idx ON students(access_code_lookup);

CREATE TABLE IF NOT EXISTS completions (
  user_id text NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  resource_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('passed', 'failed', 'skipped')),
  score double precision,
  score_max double precision,
  ai_feedback text,
  completed_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, resource_id)
);

ALTER TABLE completions ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE completions ADD COLUMN IF NOT EXISTS resource_id text;
ALTER TABLE completions ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE completions ADD COLUMN IF NOT EXISTS score double precision;
ALTER TABLE completions ADD COLUMN IF NOT EXISTS score_max double precision;
ALTER TABLE completions ADD COLUMN IF NOT EXISTS ai_feedback text;
ALTER TABLE completions ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE completions ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS completions_user_id_idx ON completions(user_id);

CREATE TABLE IF NOT EXISTS completion_events (
  event_id bigserial PRIMARY KEY,
  user_id text NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  resource_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('passed', 'failed', 'skipped')),
  score double precision,
  score_max double precision,
  ai_feedback text,
  completed_at timestamptz NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS completion_events_user_id_idx ON completion_events(user_id);
CREATE INDEX IF NOT EXISTS completion_events_user_resource_idx ON completion_events(user_id, resource_id);

INSERT INTO completion_events (user_id, resource_id, status, score, score_max, ai_feedback, completed_at)
SELECT c.user_id, c.resource_id, c.status, c.score, c.score_max, c.ai_feedback, c.completed_at
FROM completions c
WHERE NOT EXISTS (
  SELECT 1
  FROM completion_events e
  WHERE e.user_id = c.user_id
    AND e.resource_id = c.resource_id
    AND e.status = c.status
    AND e.completed_at = c.completed_at
);

CREATE TABLE IF NOT EXISTS day_unlocks (
  user_id text NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  week integer NOT NULL,
  day integer NOT NULL,
  unlocked_at timestamptz NOT NULL,
  PRIMARY KEY (user_id, week, day)
);

ALTER TABLE day_unlocks ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE day_unlocks ADD COLUMN IF NOT EXISTS week integer;
ALTER TABLE day_unlocks ADD COLUMN IF NOT EXISTS day integer;
ALTER TABLE day_unlocks ADD COLUMN IF NOT EXISTS unlocked_at timestamptz;
CREATE INDEX IF NOT EXISTS day_unlocks_user_id_idx ON day_unlocks(user_id);

CREATE TABLE IF NOT EXISTS quiz_results (
  id text NOT NULL,
  user_id text NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  concept_ids text[] NOT NULL DEFAULT '{}',
  week integer NOT NULL,
  day integer NOT NULL,
  correct boolean NOT NULL,
  student_answer text NOT NULL,
  answered_at timestamptz NOT NULL,
  question_type text,
  difficulty integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);

ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS id text;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS question_id text;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS concept_ids text[] NOT NULL DEFAULT '{}';
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS week integer;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS day integer;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS correct boolean;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS student_answer text;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS answered_at timestamptz;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS question_type text;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS difficulty integer;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS quiz_result_attempts (
  attempt_id bigserial PRIMARY KEY,
  user_id text NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  client_result_id text,
  question_id text NOT NULL,
  concept_ids text[] NOT NULL DEFAULT '{}',
  week integer NOT NULL,
  day integer NOT NULL,
  correct boolean NOT NULL,
  student_answer text NOT NULL,
  answered_at timestamptz NOT NULL,
  question_type text,
  difficulty integer,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quiz_result_attempts ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE quiz_result_attempts ADD COLUMN IF NOT EXISTS client_result_id text;
ALTER TABLE quiz_result_attempts ADD COLUMN IF NOT EXISTS question_id text;
ALTER TABLE quiz_result_attempts ADD COLUMN IF NOT EXISTS concept_ids text[] NOT NULL DEFAULT '{}';
ALTER TABLE quiz_result_attempts ADD COLUMN IF NOT EXISTS week integer;
ALTER TABLE quiz_result_attempts ADD COLUMN IF NOT EXISTS day integer;
ALTER TABLE quiz_result_attempts ADD COLUMN IF NOT EXISTS correct boolean;
ALTER TABLE quiz_result_attempts ADD COLUMN IF NOT EXISTS student_answer text;
ALTER TABLE quiz_result_attempts ADD COLUMN IF NOT EXISTS answered_at timestamptz;
ALTER TABLE quiz_result_attempts ADD COLUMN IF NOT EXISTS question_type text;
ALTER TABLE quiz_result_attempts ADD COLUMN IF NOT EXISTS difficulty integer;
ALTER TABLE quiz_result_attempts ADD COLUMN IF NOT EXISTS recorded_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS quiz_result_attempts_user_id_idx ON quiz_result_attempts(user_id);
CREATE INDEX IF NOT EXISTS quiz_result_attempts_user_week_day_idx ON quiz_result_attempts(user_id, week, day);
CREATE INDEX IF NOT EXISTS quiz_result_attempts_user_question_idx ON quiz_result_attempts(user_id, question_id);

INSERT INTO quiz_result_attempts
  (user_id, client_result_id, question_id, concept_ids, week, day, correct, student_answer, answered_at, question_type, difficulty)
SELECT
  qr.user_id, qr.id, qr.question_id, qr.concept_ids, qr.week, qr.day, qr.correct, qr.student_answer, qr.answered_at, qr.question_type, qr.difficulty
FROM quiz_results qr
WHERE NOT EXISTS (
  SELECT 1
  FROM quiz_result_attempts attempt
  WHERE attempt.user_id = qr.user_id
    AND attempt.client_result_id = qr.id
);

ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DELETE FROM quiz_results older
USING quiz_results newer
WHERE older.ctid <> newer.ctid
  AND older.user_id = newer.user_id
  AND older.question_id = newer.question_id
  AND (
    older.answered_at < newer.answered_at
    OR (older.answered_at = newer.answered_at AND older.id < newer.id)
  );

DO $$
DECLARE
  pk_columns text[];
BEGIN
  SELECT array_agg(a.attname::text ORDER BY key.ordinality)
  INTO pk_columns
  FROM pg_constraint c
  JOIN unnest(c.conkey) WITH ORDINALITY AS key(attnum, ordinality) ON true
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = key.attnum
  WHERE c.conrelid = 'quiz_results'::regclass
    AND c.contype = 'p';

  IF pk_columns IS NOT NULL AND pk_columns <> ARRAY['user_id', 'question_id'] THEN
    ALTER TABLE quiz_results DROP CONSTRAINT quiz_results_pkey;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'quiz_results'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE quiz_results ADD CONSTRAINT quiz_results_pkey PRIMARY KEY (user_id, question_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS quiz_results_user_id_idx ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS quiz_results_user_week_day_idx ON quiz_results(user_id, week, day);

CREATE TABLE IF NOT EXISTS frq_completions (
  user_id text NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  frq_id text NOT NULL,
  week integer NOT NULL,
  day integer NOT NULL,
  score double precision NOT NULL,
  score_max double precision NOT NULL,
  completed_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, frq_id)
);

CREATE INDEX IF NOT EXISTS frq_completions_user_id_idx ON frq_completions(user_id);
CREATE INDEX IF NOT EXISTS frq_completions_user_week_day_idx ON frq_completions(user_id, week, day);
