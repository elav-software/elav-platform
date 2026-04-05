-- =============================================================================
-- seed_personas.sql
-- Datos de prueba: 10 Líderes + 30 Miembros en la tabla `personas`
-- Ejecutar en Supabase → SQL Editor
--
-- Para borrar solo estos registros luego:
--   DELETE FROM public.personas WHERE email LIKE '%@seed.test';
-- =============================================================================

DO $$
DECLARE
  -- IDs de los 10 líderes (se asignan al insertar)
  lid1  uuid;
  lid2  uuid;
  lid3  uuid;
  lid4  uuid;
  lid5  uuid;
  lid6  uuid;
  lid7  uuid;
  lid8  uuid;
  lid9  uuid;
  lid10 uuid;
BEGIN

-- ============================================================
-- LÍDERES
-- ============================================================

INSERT INTO public.personas (
  nombre, apellido, email, telefono, whatsapp, edad,
  fecha_nacimiento, genero, estado_civil, direccion, barrio_zona,
  ocupacion, nivel_educacion, rol,
  ano_conversion, fecha_llegada_cfc,
  bautizado, ano_bautismo, fue_encuentro,
  nivel_formacion, como_conociste, quien_te_invito,
  habilidades_tecnicas, disponibilidad_horaria, area_servicio_actual,
  ministerio, grupo_celula, dia_reunion, hora_reunion, lugar_reunion,
  conyuge, hijos, tamano_hogar, vinculos_familiares_iglesia
) VALUES (
  'Juan Pablo', 'González', 'jpgonzalez@seed.test', '+541155501001', '+541155501001', 35,
  '1989-03-14', 'Masculino', 'Casado/a', 'Av. Santa Fe 1234', 'Palermo',
  'Contador', 'Universitario', 'Líder',
  '2008', '2010-03-01',
  'Sí', '2009', 'Sí',
  'Discipulado', 'Redes sociales', NULL,
  'Audio/video', 'Noche, Fines de semana', 'Alabanza, Medios',
  'Alabanza', 'Célula Norte 1', 'Miércoles', '20:00', 'Salón Principal',
  'Ana González', '2', 4, 'Esposa Ana González - celula Norte'
)
RETURNING id INTO lid1;

INSERT INTO public.personas (
  nombre, apellido, email, telefono, whatsapp, edad,
  fecha_nacimiento, genero, estado_civil, direccion, barrio_zona,
  ocupacion, nivel_educacion, rol,
  ano_conversion, fecha_llegada_cfc,
  bautizado, ano_bautismo, fue_encuentro,
  nivel_formacion, como_conociste, quien_te_invito,
  habilidades_tecnicas, disponibilidad_horaria, area_servicio_actual,
  ministerio, grupo_celula, dia_reunion, hora_reunion, lugar_reunion,
  conyuge, hijos, tamano_hogar, vinculos_familiares_iglesia
) VALUES (
  'María Elena', 'Fernández', 'mfernandez@seed.test', '+541155502002', '+541155502002', 32,
  '1992-07-22', 'Femenino', 'Casado/a', 'Montañeses 2567', 'Belgrano',
  'Docente', 'Universitario', 'Líder',
  '2011', '2012-08-15',
  'Sí', '2012', 'Sí',
  'Escuela de Líderes', 'Un amigo', 'Pastor Roberto',
  'Diseño gráfico', 'Tarde, Noche', 'Social media, Expresión',
  'Jóvenes', 'Célula Sur 1', 'Jueves', '19:30', 'Casa de la líder',
  'Marcos Fernández', '1', 3, 'Hermana Lucia Fernández - ministerio jóvenes'
)
RETURNING id INTO lid2;

INSERT INTO public.personas (
  nombre, apellido, email, telefono, whatsapp, edad,
  fecha_nacimiento, genero, estado_civil, direccion, barrio_zona,
  ocupacion, nivel_educacion, rol,
  ano_conversion, fecha_llegada_cfc,
  bautizado, ano_bautismo, fue_encuentro,
  nivel_formacion, como_conociste, quien_te_invito,
  habilidades_tecnicas, disponibilidad_horaria, area_servicio_actual,
  ministerio, grupo_celula, dia_reunion, hora_reunion, lugar_reunion,
  conyuge, hijos, tamano_hogar, vinculos_familiares_iglesia
) VALUES (
  'Carlos Alberto', 'Ramírez', 'cramirez@seed.test', '+541155503003', '+541155503003', 28,
  '1996-11-05', 'Masculino', 'Soltero/a', 'Triunvirato 890', 'Villa Urquiza',
  'Técnico en sistemas', 'Terciario', 'Líder',
  '2015', '2016-01-10',
  'Sí', '2016', 'Sí',
  'Discipulado', 'Por un familiar', 'Tía Carmen Ramírez',
  'Programación, Redes', 'Flexible', 'Medios, Sonido, Pantalla',
  'Medios', 'Célula Oeste 1', 'Martes', '20:30', 'Casa del líder',
  NULL, '0', 1, 'Prima Carmen Ramírez - miembro activa'
)
RETURNING id INTO lid3;

INSERT INTO public.personas (
  nombre, apellido, email, telefono, whatsapp, edad,
  fecha_nacimiento, genero, estado_civil, direccion, barrio_zona,
  ocupacion, nivel_educacion, rol,
  ano_conversion, fecha_llegada_cfc,
  bautizado, ano_bautismo, fue_encuentro,
  nivel_formacion, como_conociste, quien_te_invito,
  habilidades_tecnicas, disponibilidad_horaria, area_servicio_actual,
  ministerio, grupo_celula, dia_reunion, hora_reunion, lugar_reunion,
  conyuge, hijos, tamano_hogar, vinculos_familiares_iglesia
) VALUES (
  'Laura Vanesa', 'Martínez', 'lmartinez@seed.test', '+541155504004', '+541155504004', 40,
  '1984-05-19', 'Femenino', 'Casado/a', 'Rivadavia 4521', 'Caballito',
  'Enfermera', 'Terciario', 'Líder',
  '2004', '2005-06-20',
  'Sí', '2005', 'Sí',
  'Escuela de Líderes', 'Vecino', NULL,
  'Primeros auxilios, Consejería', 'Mañana, Fines de semana', 'Intercesión, Primeros Auxilios',
  'Mujeres', 'Célula Este 1', 'Viernes', '18:00', 'Salón B',
  'Roberto Martínez', '3', 5, 'Esposo Roberto Martínez - diácono'
)
RETURNING id INTO lid4;

INSERT INTO public.personas (
  nombre, apellido, email, telefono, whatsapp, edad,
  fecha_nacimiento, genero, estado_civil, direccion, barrio_zona,
  ocupacion, nivel_educacion, rol,
  ano_conversion, fecha_llegada_cfc,
  bautizado, ano_bautismo, fue_encuentro,
  nivel_formacion, como_conociste, quien_te_invito,
  habilidades_tecnicas, disponibilidad_horaria, area_servicio_actual,
  ministerio, grupo_celula, dia_reunion, hora_reunion, lugar_reunion,
  conyuge, hijos, tamano_hogar, vinculos_familiares_iglesia
) VALUES (
  'Diego Alejandro', 'López', 'dlopez@seed.test', '+541155505005', '+541155505005', 38,
  '1986-09-30', 'Masculino', 'Casado/a', 'Avenida de Mayo 777', 'Flores',
  'Arquitecto', 'Universitario', 'Líder',
  '2006', '2007-03-12',
  'Sí', '2007', 'Sí',
  'Escuela de Líderes', 'Redes sociales', 'Amigo Patricio Suárez',
  'Diseño, Construcción', 'Noche', 'Casa en Orden, Seguridad',
  'Varones', 'Célula Norte 2', 'Lunes', '20:00', 'Casa del líder',
  'Silvia López', '2', 4, 'Esposa Silvia - ministerio niños'
)
RETURNING id INTO lid5;

INSERT INTO public.personas (
  nombre, apellido, email, telefono, whatsapp, edad,
  fecha_nacimiento, genero, estado_civil, direccion, barrio_zona,
  ocupacion, nivel_educacion, rol,
  ano_conversion, fecha_llegada_cfc,
  bautizado, ano_bautismo, fue_encuentro,
  nivel_formacion, como_conociste, quien_te_invito,
  habilidades_tecnicas, disponibilidad_horaria, area_servicio_actual,
  ministerio, grupo_celula, dia_reunion, hora_reunion, lugar_reunion,
  conyuge, hijos, tamano_hogar, vinculos_familiares_iglesia
) VALUES (
  'Valeria Beatriz', 'Torres', 'vtorres@seed.test', '+541155506006', '+541155506006', 33,
  '1991-02-14', 'Femenino', 'Casado/a', 'Chacabuco 350', 'San Telmo',
  'Psicóloga', 'Universitario', 'Líder',
  '2012', '2013-09-05',
  'Sí', '2013', 'Sí',
  'Discipulado', 'Evento evangelístico', 'Pastora Ana',
  'Consejería, Escucha activa', 'Tarde, Noche', 'Consolidación, Asesoramiento de Imagen',
  'Consejería', 'Célula Sur 2', 'Miércoles', '19:00', 'Salón Principal',
  'Lucas Torres', '1', 3, 'Cuñada Pamela Torres - célula Sur 2'
)
RETURNING id INTO lid6;

INSERT INTO public.personas (
  nombre, apellido, email, telefono, whatsapp, edad,
  fecha_nacimiento, genero, estado_civil, direccion, barrio_zona,
  ocupacion, nivel_educacion, rol,
  ano_conversion, fecha_llegada_cfc,
  bautizado, ano_bautismo, fue_encuentro,
  nivel_formacion, como_conociste, quien_te_invito,
  habilidades_tecnicas, disponibilidad_horaria, area_servicio_actual,
  ministerio, grupo_celula, dia_reunion, hora_reunion, lugar_reunion,
  conyuge, hijos, tamano_hogar, vinculos_familiares_iglesia
) VALUES (
  'Rodrigo Hernán', 'García', 'rgarcia@seed.test', '+541155507007', '+541155507007', 26,
  '1998-12-01', 'Masculino', 'Soltero/a', 'Corrientes 3890', 'Almagro',
  'Estudiante universitario', 'Universitario (en curso)', 'Líder',
  '2018', '2019-02-20',
  'Sí', '2019', 'Sí',
  'Discipulado', 'Instagram', 'Compañero de facultad',
  'Música, Guitarra', 'Noche, Fines de semana', 'Alabanza, Coro Kids',
  'Jóvenes', 'Célula Jóvenes 1', 'Sábado', '16:00', 'Salón Jóvenes',
  NULL, '0', 1, NULL
)
RETURNING id INTO lid7;

INSERT INTO public.personas (
  nombre, apellido, email, telefono, whatsapp, edad,
  fecha_nacimiento, genero, estado_civil, direccion, barrio_zona,
  ocupacion, nivel_educacion, rol,
  ano_conversion, fecha_llegada_cfc,
  bautizado, ano_bautismo, fue_encuentro,
  nivel_formacion, como_conociste, quien_te_invito,
  habilidades_tecnicas, disponibilidad_horaria, area_servicio_actual,
  ministerio, grupo_celula, dia_reunion, hora_reunion, lugar_reunion,
  conyuge, hijos, tamano_hogar, vinculos_familiares_iglesia
) VALUES (
  'Claudia Marcela', 'Sánchez', 'csanchez@seed.test', '+541155508008', '+541155508008', 45,
  '1979-08-17', 'Femenino', 'Casado/a', 'Av. Rivadavia 8000', 'Floresta',
  'Administradora', 'Terciario', 'Líder',
  '2000', '2001-04-08',
  'Sí', '2001', 'Sí',
  'Escuela de Líderes', 'Familiar', 'Madre Hilda Sánchez',
  'Administración, Organización', 'Mañana, Tarde', 'Casa en Orden, Intercesión',
  'Intercesión', 'Célula Oeste 2', 'Jueves', '10:00', 'Salón C',
  'Horacio Sánchez', '4', 6, 'Hija Micaela - célula jóvenes; madre Hilda - célula oeste 2'
)
RETURNING id INTO lid8;

INSERT INTO public.personas (
  nombre, apellido, email, telefono, whatsapp, edad,
  fecha_nacimiento, genero, estado_civil, direccion, barrio_zona,
  ocupacion, nivel_educacion, rol,
  ano_conversion, fecha_llegada_cfc,
  bautizado, ano_bautismo, fue_encuentro,
  nivel_formacion, como_conociste, quien_te_invito,
  habilidades_tecnicas, disponibilidad_horaria, area_servicio_actual,
  ministerio, grupo_celula, dia_reunion, hora_reunion, lugar_reunion,
  conyuge, hijos, tamano_hogar, vinculos_familiares_iglesia
) VALUES (
  'Facundo Ezequiel', 'Romero', 'fromero@seed.test', '+541155509009', '+541155509009', 30,
  '1994-04-25', 'Masculino', 'Soltero/a', 'Nazca 1500', 'Villa del Parque',
  'Fotógrafo', 'Secundario', 'Líder',
  '2014', '2015-07-03',
  'Sí', '2015', 'Sí',
  'Discipulado', 'YouTube', 'Amigo Federico',
  'Fotografía, Video, Edición', 'Flexible', 'Medios, Social media',
  'Medios', 'Célula Este 2', 'Martes', '20:00', 'Casa del líder',
  NULL, '0', 2, 'Hermano Maximiliano Romero - voluntario medios'
)
RETURNING id INTO lid9;

INSERT INTO public.personas (
  nombre, apellido, email, telefono, whatsapp, edad,
  fecha_nacimiento, genero, estado_civil, direccion, barrio_zona,
  ocupacion, nivel_educacion, rol,
  ano_conversion, fecha_llegada_cfc,
  bautizado, ano_bautismo, fue_encuentro,
  nivel_formacion, como_conociste, quien_te_invito,
  habilidades_tecnicas, disponibilidad_horaria, area_servicio_actual,
  ministerio, grupo_celula, dia_reunion, hora_reunion, lugar_reunion,
  conyuge, hijos, tamano_hogar, vinculos_familiares_iglesia
) VALUES (
  'Natalia Andrea', 'Flores', 'nflores@seed.test', '+541155510010', '+541155510010', 37,
  '1987-06-08', 'Femenino', 'Casado/a', 'Dorrego 2100', 'Chacarita',
  'Diseñadora gráfica', 'Universitario', 'Líder',
  '2007', '2008-11-22',
  'Sí', '2008', 'Sí',
  'Escuela de Líderes', 'Vecina', 'Vecina Patricia',
  'Diseño, Ilustración, Social media', 'Tarde, Noche', 'Social media, Expresión',
  'Comunicación', 'Célula Norte 3', 'Viernes', '19:30', 'Salón B',
  'Martín Flores', '2', 4, 'Esposo Martín - ministerio varones'
)
RETURNING id INTO lid10;


-- ============================================================
-- MIEMBROS (3 por líder = 30 en total)
-- ============================================================

-- -- Miembros de lid1 (Juan González - Célula Norte 1)
INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Sebastián', 'Aguirre', 'saguirre@seed.test', '+541155511011', '+541155511011', 27, '1997-01-12', 'Masculino', 'Soltero/a', 'Thames 660', 'Palermo', 'Empleado comercio', 'Secundario', 'Miembro', 'No', 'Sí', 'Ninguno', 'Célula Norte 1', lid1, NULL, '0', 1);

INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Paola', 'Herrera', 'pherrera@seed.test', '+541155511012', '+541155511012', 23, '2001-05-30', 'Femenino', 'Soltero/a', 'Cabrera 1890', 'Palermo', 'Estudiante', 'Universitario (en curso)', 'Miembro', 'No', 'No', 'Ninguno', 'Célula Norte 1', lid1, NULL, '0', 1);

INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Marcelo', 'Ríos', 'mrios@seed.test', '+541155511013', '+541155511013', 34, '1990-09-04', 'Masculino', 'Casado/a', 'Gurruchaga 450', 'Palermo', 'Plomero', 'Secundario', 'Miembro', 'Sí', 'Sí', 'Discipulado', 'Célula Norte 1', lid1, 'Florencia Ríos', '1', 3);

-- -- Miembros de lid2 (María Fernández - Célula Sur 1)
INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Lucía', 'Pereyra', 'lpereyra@seed.test', '+541155512014', '+541155512014', 29, '1995-03-18', 'Femenino', 'Soltero/a', 'Av. Cabildo 3300', 'Belgrano', 'Nutricionista', 'Universitario', 'Miembro', 'Sí', 'Sí', 'Discipulado', 'Célula Sur 1', lid2, NULL, '0', 2);

INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Tomás', 'Villanueva', 'tvillanueva@seed.test', '+541155512015', '+541155512015', 31, '1993-11-22', 'Masculino', 'Casado/a', 'Juramento 1200', 'Belgrano', 'Contador', 'Universitario', 'Miembro', 'Sí', 'Sí', 'Escuela de Líderes', 'Célula Sur 1', lid2, 'Irina Villanueva', '0', 2);

INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Camila', 'Suárez', 'csuarez@seed.test', '+541155512016', '+541155512016', 22, '2002-07-09', 'Femenino', 'Soltero/a', 'Echeverría 2800', 'Belgrano', 'Estudiante', 'Universitario (en curso)', 'Miembro', 'No', 'No', 'Ninguno', 'Célula Sur 1', lid2, NULL, '0', 3);

-- -- Miembros de lid3 (Carlos Ramírez - Célula Oeste 1)
INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Ezequiel', 'Molina', 'emolina@seed.test', '+541155513017', '+541155513017', 25, '1999-02-14', 'Masculino', 'Soltero/a', 'Olazábal 4100', 'Villa Urquiza', 'Técnico electrónico', 'Terciario', 'Miembro', 'No', 'Sí', 'Ninguno', 'Célula Oeste 1', lid3, NULL, '0', 1);

INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Florencia', 'Castro', 'fcastro@seed.test', '+541155513018', '+541155513018', 26, '1998-10-31', 'Femenino', 'Soltero/a', 'Monroe 3500', 'Villa Urquiza', 'Diseñadora', 'Universitario', 'Miembro', 'No', 'No', 'Ninguno', 'Célula Oeste 1', lid3, NULL, '0', 1);

INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Brian', 'Acosta', 'bacosta@seed.test', '+541155513019', '+541155513019', 20, '2004-04-06', 'Masculino', 'Soltero/a', 'Alvarez Thomas 2000', 'Villa Urquiza', 'Empleado', 'Secundario', 'Miembro', 'No', 'No', 'Ninguno', 'Célula Oeste 1', lid3, NULL, '0', 2);

-- -- Miembros de lid4 (Laura Martínez - Célula Este 1)
INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Sandra', 'Núñez', 'snunez@seed.test', '+541155514020', '+541155514020', 38, '1986-06-15', 'Femenino', 'Casado/a', 'Acoyte 700', 'Caballito', 'Maestra', 'Terciario', 'Miembro', 'Sí', 'Sí', 'Discipulado', 'Célula Este 1', lid4, 'Sergio Núñez', '2', 4);

INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Pablo', 'Vega', 'pvega@seed.test', '+541155514021', '+541155514021', 42, '1982-01-27', 'Masculino', 'Casado/a', 'Av. Avellaneda 3200', 'Caballito', 'Comerciante', 'Secundario', 'Miembro', 'Sí', 'Sí', 'Discipulado', 'Célula Este 1', lid4, 'Marcela Vega', '3', 5);

INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Jimena', 'Medina', 'jmedina@seed.test', '+541155514022', '+541155514022', 30, '1994-08-20', 'Femenino', 'Soltero/a', 'Estado de Israel 4400', 'Caballito', 'Kinesióloga', 'Universitario', 'Miembro', 'Sí', 'Sí', 'Escuela de Líderes', 'Célula Este 1', lid4, NULL, '0', 1);

-- -- Miembros de lid5 (Diego López - Célula Norte 2)
INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Agustín', 'Rojas', 'arojas@seed.test', '+541155515023', '+541155515023', 24, '2000-12-03', 'Masculino', 'Soltero/a', 'Membrillar 500', 'Flores', 'Cadete', 'Secundario', 'Miembro', 'No', 'No', 'Ninguno', 'Célula Norte 2', lid5, NULL, '0', 3);

INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Graciela', 'Vargas', 'gvargas@seed.test', '+541155515024', '+541155515024', 47, '1977-03-09', 'Femenino', 'Viudo/a', 'Varela 1800', 'Flores', 'Costurera', 'Primario', 'Miembro', 'Sí', 'Sí', 'Discipulado', 'Célula Norte 2', lid5, NULL, '2', 3);

INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Nicolás', 'Cabrera', 'ncabrera@seed.test', '+541155515025', '+541155515025', 29, '1995-06-14', 'Masculino', 'Soltero/a', 'José María Moreno 340', 'Flores', 'Kinesiólogo', 'Universitario', 'Miembro', 'Sí', 'Sí', 'Discipulado', 'Célula Norte 2', lid5, NULL, '0', 1);

-- -- Miembros de lid6 (Valeria Torres - Célula Sur 2)
INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Rocío', 'Blanco', 'rblanco@seed.test', '+541155516026', '+541155516026', 21, '2003-09-17', 'Femenino', 'Soltero/a', 'Balcarce 1200', 'San Telmo', 'Estudiante', 'Universitario (en curso)', 'Miembro', 'No', 'No', 'Ninguno', 'Célula Sur 2', lid6, NULL, '0', 2);

INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Emilio', 'Ponce', 'eponce@seed.test', '+541155516027', '+541155516027', 36, '1988-11-28', 'Masculino', 'Casado/a', 'Chile 780', 'San Telmo', 'Carpintero', 'Secundario', 'Miembro', 'Sí', 'Sí', 'Discipulado', 'Célula Sur 2', lid6, 'Daniela Ponce', '1', 3);

INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Yanina', 'Ramos', 'yramos@seed.test', '+541155516028', '+541155516028', 33, '1991-07-05', 'Femenino', 'Casado/a', 'Av. Paseo Colón 900', 'San Telmo', 'Contadora', 'Universitario', 'Miembro', 'Sí', 'Sí', 'Escuela de Líderes', 'Célula Sur 2', lid6, 'Esteban Ramos', '2', 4);

-- -- Miembros de lid7 (Rodrigo García - Célula Jóvenes 1)
INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Valentina', 'Iglesias', 'viglesias@seed.test', '+541155517029', '+541155517029', 20, '2004-02-22', 'Femenino', 'Soltero/a', 'Sánchez de Bustamante 1800', 'Almagro', 'Estudiante', 'Universitario (en curso)', 'Miembro', 'No', 'No', 'Ninguno', 'Célula Jóvenes 1', lid7, NULL, '0', 3);

INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Lautaro', 'Ferreyra', 'lferreyra@seed.test', '+541155517030', '+541155517030', 18, '2006-05-10', 'Masculino', 'Soltero/a', 'Hipólito Yrigoyen 3600', 'Almagro', 'Estudiante secundario', 'Secundario (en curso)', 'Miembro', 'No', 'No', 'Ninguno', 'Célula Jóvenes 1', lid7, NULL, '0', 4);

INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Milagros', 'Soria', 'msoria@seed.test', '+541155517031', '+541155517031', 19, '2005-08-03', 'Femenino', 'Soltero/a', 'Av. Rivadavia 5500', 'Almagro', 'Estudiante', 'Universitario (en curso)', 'Miembro', 'No', 'Sí', 'Ninguno', 'Célula Jóvenes 1', lid7, NULL, '0', 2);

-- -- Miembros de lid8 (Claudia Sánchez - Célula Oeste 2)
INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Alicia', 'Moreno', 'amoreno@seed.test', '+541155518032', '+541155518032', 52, '1972-04-19', 'Femenino', 'Casado/a', 'Pedernera 1300', 'Floresta', 'Ama de casa', 'Primario', 'Miembro', 'Sí', 'Sí', 'Discipulado', 'Célula Oeste 2', lid8, 'Oscar Moreno', '3', 5);

INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Daniel', 'Ortiz', 'dortiz@seed.test', '+541155518033', '+541155518033', 44, '1980-10-07', 'Masculino', 'Divorciado/a', 'Cuenca 2200', 'Floresta', 'Electricista', 'Secundario', 'Miembro', 'Sí', 'Sí', 'Discipulado', 'Célula Oeste 2', lid8, NULL, '2', 3);

INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Micaela', 'Sánchez', 'micsanchez@seed.test', '+541155518034', '+541155518034', 24, '2000-01-30', 'Femenino', 'Soltero/a', 'Av. Rivadavia 8100', 'Floresta', 'Recepcionista', 'Terciario', 'Miembro', 'Sí', 'Sí', 'Discipulado', 'Célula Oeste 2', lid8, NULL, '0', 2);

-- -- Miembros de lid9 (Facundo Romero - Célula Este 2)
INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Maximiliano', 'Romero', 'maxromero@seed.test', '+541155519035', '+541155519035', 27, '1997-03-20', 'Masculino', 'Soltero/a', 'Sanabria 3000', 'Villa del Parque', 'Camarógrafo', 'Secundario', 'Miembro', 'No', 'Sí', 'Ninguno', 'Célula Este 2', lid9, NULL, '0', 2);

INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Patricia', 'Leal', 'pleal@seed.test', '+541155519036', '+541155519036', 35, '1989-07-16', 'Femenino', 'Casado/a', 'Nazca 2800', 'Villa del Parque', 'Secretaria', 'Terciario', 'Miembro', 'Sí', 'Sí', 'Discipulado', 'Célula Este 2', lid9, 'Fernando Leal', '1', 3);

INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Ignacio', 'Peña', 'ipena@seed.test', '+541155519037', '+541155519037', 22, '2002-12-11', 'Masculino', 'Soltero/a', 'Segurola 1500', 'Villa del Parque', 'Repartidor', 'Secundario', 'Miembro', 'No', 'No', 'Ninguno', 'Célula Este 2', lid9, NULL, '0', 1);

-- -- Miembros de lid10 (Natalia Flores - Célula Norte 3)
INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Celeste', 'Miranda', 'cmiranda@seed.test', '+541155520038', '+541155520038', 28, '1996-09-25', 'Femenino', 'Soltero/a', 'Federico Lacroze 3700', 'Chacarita', 'Peluquera', 'Secundario', 'Miembro', 'Sí', 'Sí', 'Discipulado', 'Célula Norte 3', lid10, NULL, '0', 1);

INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Hernán', 'Quiroga', 'hquiroga@seed.test', '+541155520039', '+541155520039', 39, '1985-02-08', 'Masculino', 'Casado/a', 'Av. Corrientes 6500', 'Chacarita', 'Chef', 'Secundario', 'Miembro', 'Sí', 'Sí', 'Discipulado', 'Célula Norte 3', lid10, 'Lorena Quiroga', '2', 4);

INSERT INTO public.personas (nombre, apellido, email, telefono, whatsapp, edad, fecha_nacimiento, genero, estado_civil, direccion, barrio_zona, ocupacion, nivel_educacion, rol, bautizado, fue_encuentro, nivel_formacion, grupo_celula, lider_id, conyuge, hijos, tamano_hogar)
VALUES ('Antonella', 'Ibáñez', 'aibanez@seed.test', '+541155520040', '+541155520040', 26, '1998-05-31', 'Femenino', 'Soltero/a', 'Dorrego 3100', 'Chacarita', 'Auxiliar contable', 'Terciario', 'Miembro', 'No', 'Sí', 'Ninguno', 'Célula Norte 3', lid10, NULL, '0', 2);


RAISE NOTICE 'Seed finalizado: 10 líderes + 30 miembros insertados correctamente.';

END $$;
