-- init.sql
-- Script para crear esquema y datos iniciales (PostgreSQL)

-- (Opcional) Crear la DB (ejecutar como superusuario):
-- CREATE DATABASE printables_db OWNER your_user;

-- === Tablas principales ===
CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS subtopics (
  id SERIAL PRIMARY KEY,
  topic_id INT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  UNIQUE(topic_id, name)
);

CREATE TABLE IF NOT EXISTS entities (
  id SERIAL PRIMARY KEY,
  subtopic_id INT NOT NULL REFERENCES subtopics(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  keywords TEXT,
  colors TEXT,
  style VARCHAR(100),
  slug VARCHAR(250) UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(subtopic_id, name)
);

CREATE TABLE IF NOT EXISTS entity_images (
  id SERIAL PRIMARY KEY,
  entity_id INT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  prompt TEXT,
  type VARCHAR(60), -- logo, escudo, minimalista, mockup-producto
  metadata JSON,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS entity_products (
  id SERIAL PRIMARY KEY,
  entity_id INT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  product_type_id INT NOT NULL REFERENCES product_types(id) ON DELETE CASCADE,
  image_generated BOOLEAN DEFAULT FALSE,
  generated_image_url TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending | generating | done | failed
  design_notes TEXT,
  generated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(entity_id, product_type_id)
);

-- Trigger helper para updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_entities_updated ON entities;
CREATE TRIGGER trg_entities_updated
BEFORE UPDATE ON entities
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_entity_products_updated ON entity_products;
CREATE TRIGGER trg_entity_products_updated
BEFORE UPDATE ON entity_products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Índices recomendados
CREATE INDEX IF NOT EXISTS idx_subtopics_topic ON subtopics(topic_id);
CREATE INDEX IF NOT EXISTS idx_entities_subtopic ON entities(subtopic_id);
CREATE INDEX IF NOT EXISTS idx_images_entity ON entity_images(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_products_entity ON entity_products(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_products_product ON entity_products(product_type_id);

-- === Datos iniciales (topics, subtopics, entities, images, product_types, entity_products) ===

-- Topics
INSERT INTO topics (name, description)
VALUES
('Deporte', 'Temas relacionados con deportes y equipos'),
('Música', 'Bandas, solistas y estilos musicales')
ON CONFLICT (name) DO NOTHING;

-- Subtopics
INSERT INTO subtopics (topic_id, name, description)
VALUES
((SELECT id FROM topics WHERE name='Deporte'), 'Fútbol', 'Equipos de fútbol alrededor del mundo'),
((SELECT id FROM topics WHERE name='Música'), 'Bandas', 'Bandas y agrupaciones con identidad visual')
ON CONFLICT (topic_id, name) DO NOTHING;

-- Entities (deporte + música)
INSERT INTO entities (subtopic_id, name, description, keywords, colors, style, slug)
VALUES
((SELECT id FROM subtopics WHERE name='Fútbol'), 'Boca Juniors', 'Club icónico argentino, colores azul y oro', 'argentina,futbol,clasico,bombonera', 'azul:#0033A0;oro:#FFD100', 'escudo tradicional', 'boca-juniors'),
((SELECT id FROM subtopics WHERE name='Fútbol'), 'River Plate', 'Club argentino, banda roja', 'argentina,futbol,millonarios', 'rojo:#FF0000;blanco:#FFFFFF', 'escudo ovalado', 'river-plate'),
((SELECT id FROM subtopics WHERE name='Fútbol'), 'Real Madrid', 'Club español con corona real', 'espana,futbol,champions', 'blanco:#FFFFFF;oro:#D4AF37', 'heraldico', 'real-madrid'),
((SELECT id FROM subtopics WHERE name='Fútbol'), 'FC Barcelona', 'Club de Cataluña, blaugrana', 'espana,futbol,barca', 'azul:#004D98;bordo:#A50044', 'escudo partido', 'fc-barcelona'),
((SELECT id FROM subtopics WHERE name='Fútbol'), 'Manchester United', 'Club inglés, red devils', 'inglaterra,premier,manchester', 'rojo:#DA291C;amarillo:#FFDD00', 'escudo tradicional', 'manchester-united'),
((SELECT id FROM subtopics WHERE name='Fútbol'), 'Juventus', 'Club italiano, minimalista', 'italia,serie-a,juve', 'blanco:#FFFFFF;negro:#000000', 'minimalista', 'juventus'),
((SELECT id FROM subtopics WHERE name='Fútbol'), 'Flamengo', 'Club brasileño, CRF', 'brasil,futbol,flamengo', 'rojo:#C8102E;negro:#000000', 'letras entrelazadas', 'flamengo'),
((SELECT id FROM subtopics WHERE name='Fútbol'), 'PSG', 'Club parisino, torre eiffel', 'francia,paris,psg', 'azul:#0E2A47;rojo:#DA291C', 'moderno', 'psg'),
((SELECT id FROM subtopics WHERE name='Fútbol'), 'Bayern Munich', 'Club alemán, patron bavaro', 'alemania,bundesliga,bayern', 'rojo:#DC052D;azul:#0066B3', 'circular', 'bayern-munich'),
((SELECT id FROM subtopics WHERE name='Fútbol'), 'Inter Miami', 'Club MLS con palmeras y rosa', 'usa,mls,inter-miami', 'rosa:#F7A8B8;negro:#000000', 'moderno', 'inter-miami'),
((SELECT id FROM subtopics WHERE name='Bandas'), 'Metallica', 'Banda de metal con tipografía angular', 'metal,usa,thrash', 'negro:#000000;blanco:#FFFFFF', 'tipografia agresiva', 'metallica'),
((SELECT id FROM subtopics WHERE name='Bandas'), 'Nirvana', 'Banda grunge con smiley', 'grunge,90s,seattle', 'amarillo:#FFD400;negro:#000000', 'icono smiley', 'nirvana'),
((SELECT id FROM subtopics WHERE name='Bandas'), 'Pink Floyd', 'Prisma icónico (Dark Side)', 'psicodelia,rock,prisma', 'negro:#000000;rainbow', 'prisma', 'pink-floyd'),
((SELECT id FROM subtopics WHERE name='Bandas'), 'Daft Punk', 'Duo electronico con cascos', 'electronica,futuro', 'dorado:#D4AF37;negro:#000000', 'futurista', 'daft-punk'),
((SELECT id FROM subtopics WHERE name='Bandas'), 'AC/DC', 'Hard rock con rayo', 'rock,hard,classic', 'rojo:#E10600;negro:#000000', 'tipografia con rayo', 'acdc'),
((SELECT id FROM subtopics WHERE name='Bandas'), 'Soda Stereo', 'Rock argentino, estetica geometrica', 'argentina,rock,cerati', 'negro:#000000;blanco:#FFFFFF', 'geométrico', 'soda-stereo'),
((SELECT id FROM subtopics WHERE name='Bandas'), 'Coldplay', 'Banda pop-rock colorida', 'pop,rock,color', 'multicolor', 'artístico', 'coldplay'),
((SELECT id FROM subtopics WHERE name='Bandas'), 'The Beatles', 'Banda clasica británica', 'uk,rock,classic', 'negro:#000000;blanco:#FFFFFF', 'tipografia clásica', 'the-beatles'),
((SELECT id FROM subtopics WHERE name='Bandas'), 'Queen', 'Escudo heráldico de la banda', 'rock,opera,heraldico', 'dorado:#D4AF37;rojo:#C8102E', 'heráldico', 'queen'),
((SELECT id FROM subtopics WHERE name='Bandas'), 'Red Hot Chili Peppers', 'Asterisco de 8 puntas', 'funk,rock,california', 'rojo:#FF0000;negro:#000000', 'minimalista', 'red-hot-chili-peppers')
ON CONFLICT (subtopic_id, name) DO NOTHING;

-- Entity images ejemplos
INSERT INTO entity_images (entity_id, image_url, prompt, type, metadata)
VALUES
((SELECT id FROM entities WHERE slug='boca-juniors'), NULL, 'Escudo tradicional de Boca Juniors, colores azul y oro, vector, alto contraste', 'logo oficial', json_build_object('colors', array['#0033A0','#FFD100'])),
((SELECT id FROM entities WHERE slug='metallica'), NULL, 'Logo Metallica con puntas alargadas en las iniciales, estilo vector', 'logo oficial', NULL)
ON CONFLICT DO NOTHING;

-- Product types
INSERT INTO product_types (name, description)
VALUES
('Alfombra grande', 'Alfombra para sala o pie de cama'),
('Tapiz / Tela mural', 'Tapiz para pared de gran formato'),
('Felpudo de entrada', 'Felpudo para puerta baño/entrada'),
('Centro de mesa', 'Diseño central para mantel/centro de mesa'),
('Individual para comedor', 'Individual rectangular para platos'),
('Cuadro / Poster', 'Impresión en poster o canvas'),
('Alfombra de teclado', 'Alfombra para escritorio / teclado'),
('Sticker grande', 'Sticker para pared o vehículo')
ON CONFLICT (name) DO NOTHING;

-- entity_products ejemplo
INSERT INTO entity_products (entity_id, product_type_id, image_generated, status, design_notes)
VALUES
((SELECT id FROM entities WHERE slug='boca-juniors'), (SELECT id FROM product_types WHERE name='Tapiz / Tela mural'), FALSE, 'pending', 'Se necesita prompt para tapiz grande'),
((SELECT id FROM entities WHERE slug='boca-juniors'), (SELECT id FROM product_types WHERE name='Cuadro / Poster'), TRUE, 'done', 'Poster vector listo — url en generated_image_url'),
((SELECT id FROM entities WHERE slug='metallica'), (SELECT id FROM product_types WHERE name='Cuadro / Poster'), FALSE, 'pending', 'Poster de Metallica pendiente')
ON CONFLICT DO NOTHING;