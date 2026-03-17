CREATE TABLE processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  job_type TEXT NOT NULL
    CHECK (job_type IN ('transcription', 'ocr', 'summarization', 'detection')),
  input_ref TEXT NOT NULL,
  output_ref UUID,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs"
  ON processing_jobs FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX idx_jobs_user_status ON processing_jobs(user_id, status);
