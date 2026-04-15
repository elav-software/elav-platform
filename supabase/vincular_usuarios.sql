--=============================================================================
-- Script de Testing: 10 Líderes PENDIENTES + 20 Miembros ya vinculados
-- 
-- TODOS los líderes empiezan como PENDIENTES para aprobarlos manualmente
-- Los miembros YA están asociados a cada líder (lider_id configurado)
-- =============================================================================

DO $$
DECLARE
  v_church_id uuid;
  v_lider_id uuid;
BEGIN
  SELECT id INTO v_church_id FROM public.churches WHERE name ILIKE '%casanova%' OR name ILIKE '%CFC%' LIMIT 1;
  IF v_church_id IS NULL THEN SELECT id INTO v_church_id FROM public.churches LIMIT 1; END IF;
  IF v_church_id IS NULL THEN RAISE EXCEPTION 'No hay iglesias'; END IF;
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- L1: Samuel Mena
  INSERT INTO public.personas (church_id, nombre, apellido, email, telefono, fecha_nacimiento, genero, rol, estado_aprobacion)
  VALUES (v_church_id, 'Samuel', 'Mena', 'samuel.mena@cfccasanova.com', '3512001001', '1985-03-15', 'Masculino', 'Líder', 'pendiente')
  ON CONFLICT (church_id, email) DO NOTHING RETURNING id INTO v_lider_id;
  IF v_lider_id IS NOT NULL THEN
    INSERT INTO public.personas (church_id, nombre, apellido, email, telefono, fecha_nacimiento, genero, rol, lider_id) VALUES 
      (v_church_id, 'Lucas', 'Fernández', 'lucas.fernandez@cfccasanova.com', '3512001101', '1990-05-10', 'Masculino', 'Miembro', v_lider_id),
      (v_church_id, 'Valeria', 'Acosta', 'valeria.acosta@cfccasanova.com', '3512001102', '1992-08-22', 'Femenino', 'Miembro', v_lider_id)
    ON CONFLICT (church_id, email) DO NOTHING;
  END IF;
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- L2: María González
  INSERT INTO public.personas (church_id, nombre, apellido, email, telefono, fecha_nacimiento, genero, rol, estado_aprobacion)
  VALUES (v_church_id, 'María', 'González', 'maria.gonzalez@cfccasanova.com', '3512002001', '1990-07-22', 'Femenino', 'Líder', 'pendiente')
  ON CONFLICT (church_id, email) DO NOTHING RETURNING id INTO v_lider_id;
  IF v_lider_id IS NOT NULL THEN
    INSERT INTO public.personas (church_id, nombre, apellido, email, telefono, fecha_nacimiento, genero, rol, lider_id) VALUES 
      (v_church_id, 'Sebastián', 'Morales', 'sebastian.morales@cfccasanova.com', '3512002101', '1988-03-15', 'Masculino', 'Miembro', v_lider_id),
      (v_church_id, 'Gabriela', 'Suárez', 'gabriela.suarez@cfccasanova.com', '3512002102', '1995-11-30', 'Femenino', 'Miembro', v_lider_id)
    ON CONFLICT (church_id, email) DO NOTHING;
  END IF;
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- L3: Carlos Rodríguez
  INSERT INTO public.personas (church_id, nombre, apellido, email, telefono, fecha_nacimiento, genero, rol, estado_aprobacion)
  VALUES (v_church_id, 'Carlos', 'Rodríguez', 'carlos.rodriguez@cfccasanova.com', '3512003001', '1988-11-05', 'Masculino', 'Líder', 'pendiente')
  ON CONFLICT (church_id, email) DO NOTHING RETURNING id INTO v_lider_id;
  IF v_lider_id IS NOT NULL THEN
    INSERT INTO public.personas (church_id, nombre, apellido, email, telefono, fecha_nacimiento, genero, rol, lider_id) VALUES 
      (v_church_id, 'Joaquín', 'Castro', 'joaquin.castro@cfccasanova.com', '3512003101', '1993-06-18', 'Masculino', 'Miembro', v_lider_id),
      (v_church_id, 'Romina', 'Navarro', 'romina.navarro@cfccasanova.com', '3512003102', '1991-09-25', 'Femenino', 'Miembro', v_lider_id)
    ON CONFLICT (church_id, email) DO NOTHING;
  END IF;
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- L4: Ana Martínez
  INSERT INTO public.personas (church_id, nombre, apellido, email, telefono, fecha_nacimiento, genero, rol, estado_aprobacion)
  VALUES (v_church_id, 'Ana', 'Martínez', 'ana.martinez@cfccasanova.com', '3512004001', '1992-02-18', 'Femenino', 'Líder', 'pendiente')
  ON CONFLICT (church_id, email) DO NOTHING RETURNING id INTO v_lider_id;
  IF v_lider_id IS NOT NULL THEN
    INSERT INTO public.personas (church_id, nombre, apellido, email, telefono, fecha_nacimiento, genero, rol, lider_id) VALUES 
      (v_church_id, 'Federico', 'Peralta', 'federico.peralta@cfccasanova.com', '3512004101', '1987-12-05', 'Masculino', 'Miembro', v_lider_id),
      (v_church_id, 'Daniela', 'Ríos', 'daniela.rios@cfccasanova.com', '3512004102', '1994-04-14', 'Femenino', 'Miembro', v_lider_id)
    ON CONFLICT (church_id, email) DO NOTHING;
  END IF;
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- L5: Pedro Fernández
  INSERT INTO public.personas (church_id, nombre, apellido, email, telefono, fecha_nacimiento, genero, rol, estado_aprobacion)
  VALUES (v_church_id, 'Pedro', 'Fernández', 'pedro.fernandez@cfccasanova.com', '3512005001', '1987-09-12', 'Masculino', 'Líder', 'pendiente')
  ON CONFLICT (church_id, email) DO NOTHING RETURNING id INTO v_lider_id;
  IF v_lider_id IS NOT NULL THEN
    INSERT INTO public.personas (church_id, nombre, apellido, email, telefono, fecha_nacimiento, genero, rol, lider_id) VALUES 
      (v_church_id, 'Nicolás', 'Vega', 'nicolas.vega@cfccasanova.com', '3512005101', '1996-01-20', 'Masculino', 'Miembro', v_lider_id),
      (v_church_id, 'Camila', 'Ortiz', 'camila.ortiz@cfccasanova.com', '3512005102', '1998-07-08', 'Femenino', 'Miembro', v_lider_id)
    ON CONFLICT (church_id, email) DO NOTHING;
  END IF;
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- L6: Laura Gómez
  INSERT INTO public.personas (church_id, nombre, apellido, email, telefono, fecha_nacimiento, genero, rol, estado_aprobacion)
  VALUES (v_church_id, 'Laura', 'Gómez', 'laura.gomez@cfccasanova.com', '3512006001', '1995-05-30', 'Femenino', 'Líder', 'pendiente')
  ON CONFLICT (church_id, email) DO NOTHING RETURNING id INTO v_lider_id;
  IF v_lider_id IS NOT NULL THEN
    INSERT INTO public.personas (church_id, nombre, apellido, email, telefono, fecha_nacimiento, genero, rol, lider_id) VALUES 
      (v_church_id, 'Matías', 'Rojas', 'matias.rojas@cfccasanova.com', '3512006101', '1989-10-12', 'Masculino', 'Miembro', v_lider_id),
      (v_church_id, 'Florencia', 'Benítez', 'florencia.benitez@cfccasanova.com', '3512006102', '1997-02-28', 'Femenino', 'Miembro', v_lider_id)
    ON CONFLICT (church_id, email) DO NOTHING;
  END IF;
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- L7: Jorge López
  INSERT INTO public.personas (church_id, nombre, apellido, email, telefono, fecha_nacimiento, genero, rol, estado_aprobacion)
  VALUES (v_church_id, 'Jorge', 'López', 'jorge.lopez@cfccasanova.com', '3512007001', '1983-12-08', 'Masculino', 'Líder', 'pendiente')
  ON CONFLICT (church_id, email) DO NOTHING RETURNING id INTO v_lider_id;
  IF v_lider_id IS NOT NULL THEN
    INSERT INTO public.personas (church_id, nombre, apellido, email, telefono, fecha_nacimiento, genero, rol, lider_id) VALUES 
      (v_church_id, 'Tomás', 'Díaz', 'tomas.diaz@cfccasanova.com', '3512007101', '1992-05-17', 'Masculino', 'Miembro', v_lider_id),
      (v_church_id, 'Alejandra', 'Molina', 'alejandra.molina@cfccasanova.com', '3512007102', '1990-11-03', 'Femenino', 'Miembro', v_lider_id)
    ON CONFLICT (church_id, email) DO NOTHING;
  END IF;
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- L8: Silvia Ramírez
  INSERT INTO public.personas (church_id, nombre, apellido, email, telefono, fecha_nacimiento, genero, rol, estado_aprobacion)
  VALUES (v_church_id, 'Silvia', 'Ramírez', 'silvia.ramirez@cfccasanova.com', '3512008001', '1991-04-25', 'Femenino', 'Líder', 'pendiente')
  ON CONFLICT (church_id, email) DO NOTHING RETURNING id INTO v_lider_id;
  IF v_lider_id IS NOT NULL THEN
    INSERT INTO public.personas (church_id, nombre, apellido, email, telefono, fecha_nacimiento, genero, rol, lider_id) VALUES 
      (v_church_id, 'Facundo', 'Vargas', 'facundo.vargas@cfccasanova.com', '3512008101', '1986-08-09', 'Masculino', 'Miembro', v_lider_id),
      (v_church_id, 'Micaela', 'Paredes', 'micaela.paredes@cfccasanova.com', '3512008102', '1999-12-16', 'Femenino', 'Miembro', v_lider_id)
    ON CONFLICT (church_id, email) DO NOTHING;
  END IF;
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- L9: Roberto Díaz
  INSERT INTO public.personas (church_id, nombre, apellido, email, telefono, fecha_nacimiento, genero, rol, estado_aprobacion)
  VALUES (v_church_id, 'Roberto', 'Díaz', 'roberto.diaz@cfccasanova.com', '3512009001', '1989-06-14', 'Masculino', 'Líder', 'pendiente')
  ON CONFLICT (church_id, email) DO NOTHING RETURNING id INTO v_lider_id;
  IF v_lider_id IS NOT NULL THEN
    INSERT INTO public.personas (church_id, nombre, apellido, email, telefono, fecha_nacimiento, genero, rol, lider_id) VALUES 
      (v_church_id, 'Ezequiel', 'Campos', 'ezequiel.campos@cfccasanova.com', '3512009101', '1994-02-11', 'Masculino', 'Miembro', v_lider_id),
      (v_church_id, 'Natalia', 'Luna', 'natalia.luna@cfccasanova.com', '3512009102', '1993-09-19', 'Femenino', 'Miembro', v_lider_id)
    ON CONFLICT (church_id, email) DO NOTHING;
  END IF;
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- L10: Patricia Torres
  INSERT INTO public.personas (church_id, nombre, apellido, email, telefono, fecha_nacimiento, genero, rol, estado_aprobacion)
  VALUES (v_church_id, 'Patricia', 'Torres', 'patricia.torres@cfccasanova.com', '3512010001', '1986-10-03', 'Femenino', 'Líder', 'pendiente')
  ON CONFLICT (church_id, email) DO NOTHING RETURNING id INTO v_lider_id;
  IF v_lider_id IS NOT NULL THEN
    INSERT INTO public.personas (church_id, nombre, apellido, email, telefono, fecha_nacimiento, genero, rol, lider_id) VALUES 
      (v_church_id, 'Martín', 'Herrera', 'martin.herrera@cfccasanova.com', '3512010101', '1991-03-22', 'Masculino', 'Miembro', v_lider_id),
      (v_church_id, 'Antonella', 'Sosa', 'antonella.sosa@cfccasanova.com', '3512010102', '1996-06-07', 'Femenino', 'Miembro', v_lider_id)
    ON CONFLICT (church_id, email) DO NOTHING;
  END IF;
  RAISE NOTICE 'Datos creados';
END $$;

-- VERIFICACIÓN
SELECT estado_aprobacion, COUNT(*) as cantidad FROM public.personas WHERE rol = 'Líder' GROUP BY estado_aprobacion;
SELECT l.nombre || ' ' || l.apellido as lider, l.estado_aprobacion, COUNT(m.id) as miembros FROM public.personas l LEFT JOIN public.personas m ON m.lider_id = l.id WHERE l.rol = 'Líder' GROUP BY l.nombre, l.apellido, l.estado_aprobacion ORDER BY l.nombre;
SELECT rol, COUNT(*) FROM public.personas GROUP BY rol;
