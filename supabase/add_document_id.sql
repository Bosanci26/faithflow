-- Migration: Add document_id column to venituri and cheltuieli
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

ALTER TABLE venituri ADD COLUMN IF NOT EXISTS document_id uuid;
ALTER TABLE cheltuieli ADD COLUMN IF NOT EXISTS document_id uuid;

-- Index for faster lookup when deleting by document_id
CREATE INDEX IF NOT EXISTS idx_venituri_document_id ON venituri(document_id);
CREATE INDEX IF NOT EXISTS idx_cheltuieli_document_id ON cheltuieli(document_id);
