CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  title TEXT,
  content TEXT,
  summary TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('text', 'audio', 'image', 'document')),
  original_wa_id TEXT,
  tags TEXT[] DEFAULT '{}',
  is_sensitive BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own notes"
  ON notes FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_folder_id ON notes(folder_id);
CREATE INDEX idx_notes_source_type ON notes(user_id, source_type);
CREATE INDEX idx_notes_tags ON notes USING GIN(tags);
CREATE UNIQUE INDEX idx_notes_wa_id ON notes(original_wa_id) WHERE original_wa_id IS NOT NULL;

-- Full-text search (spanish, weighted)
ALTER TABLE notes ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('spanish', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(content, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(summary, '')), 'C')
  ) STORED;

CREATE INDEX idx_notes_fts ON notes USING GIN(fts);

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
