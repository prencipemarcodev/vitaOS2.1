-- Migration: Clean up duplicate finance categories and ensure the UNIQUE constraint is active
DO $$ 
BEGIN 
    -- 1. Rimuovi i duplicati mantenendo solo quello con l'ID più basso
    DELETE FROM finance_categories a USING (
      SELECT MIN(id) as id, name, type
      FROM finance_categories 
      GROUP BY name, type
      HAVING COUNT(*) > 1
    ) b
    WHERE a.name = b.name 
    AND a.type = b.type 
    AND a.id > b.id;

    -- 2. Assicurati che il vincolo di unicità esista
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'finance_categories_name_type_key') THEN
        ALTER TABLE finance_categories ADD CONSTRAINT finance_categories_name_type_key UNIQUE(name, type);
    END IF;
END $$;
