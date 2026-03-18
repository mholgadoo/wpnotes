CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  para_category TEXT NOT NULL CHECK (para_category IN ('project', 'area', 'resource', 'archive')),
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  icon TEXT DEFAULT '📁',
  is_auto BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name, para_category, parent_id)
);

-- Prevent nesting beyond one level (sub-folders cannot have children)
CREATE OR REPLACE FUNCTION check_folder_depth()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    -- Check that the parent is a root folder (has no parent itself)
    IF EXISTS (SELECT 1 FROM folders WHERE id = NEW.parent_id AND parent_id IS NOT NULL) THEN
      RAISE EXCEPTION 'Sub-folders cannot have children. Only one level of nesting is allowed.';
    END IF;
    -- Ensure sub-folder inherits parent's para_category
    IF NEW.para_category != (SELECT para_category FROM folders WHERE id = NEW.parent_id) THEN
      RAISE EXCEPTION 'Sub-folder must have the same para_category as its parent.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER folders_check_depth
  BEFORE INSERT OR UPDATE ON folders
  FOR EACH ROW EXECUTE FUNCTION check_folder_depth();

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own folders"
  ON folders FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
