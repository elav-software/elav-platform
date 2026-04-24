-- Agrega lider_id a personas si no existe (auto-referencia al líder asignado)
-- Ejecutar en DEV y PROD si la columna no fue creada por 00_personas_table.sql
ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS lider_id uuid REFERENCES public.personas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_personas_lider_id ON public.personas (lider_id);
