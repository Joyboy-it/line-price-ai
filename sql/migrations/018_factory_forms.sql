-- A named form file can be shared by many agent offers.
CREATE TABLE IF NOT EXISTS factory_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE agent_offers
  ADD COLUMN IF NOT EXISTS form_id UUID REFERENCES factory_forms(id) ON DELETE SET NULL;

INSERT INTO factory_forms (name, file_path, file_name, mime_type)
SELECT
  CASE WHEN rn = 1 THEN base_name ELSE base_name || ' (' || rn || ')' END,
  file_path,
  base_name,
  mime_type
FROM (
  SELECT DISTINCT ON (form_file_path)
    form_file_path AS file_path,
    COALESCE(NULLIF(form_file_name, ''), 'แบบฟอร์ม') AS base_name,
    form_mime_type AS mime_type,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(NULLIF(form_file_name, ''), 'แบบฟอร์ม')
      ORDER BY form_file_path
    ) AS rn
  FROM agent_offers
  WHERE form_file_path IS NOT NULL
  ORDER BY form_file_path
) existing
WHERE NOT EXISTS (
  SELECT 1 FROM factory_forms ff WHERE ff.file_path = existing.file_path
);

UPDATE agent_offers ao
SET form_id = ff.id
FROM factory_forms ff
WHERE ao.form_file_path = ff.file_path
  AND ao.form_id IS NULL;
