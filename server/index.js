require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT || 5432
});

/* ---------- Endpoints básicos ---------- */

/* TOPICS */
app.get('/api/topics', async (req, res) => {
  const r = await pool.query('SELECT * FROM topics ORDER BY name');
  res.json(r.rows);
});
app.post('/api/topics', async (req, res) => {
  const { name, description } = req.body;
  const r = await pool.query('INSERT INTO topics (name, description) VALUES ($1,$2) RETURNING *', [name, description]);
  res.json(r.rows[0]);
});

/* SUBTOPICS */
app.get('/api/topics/:topicId/subtopics', async (req, res) => {
  const { topicId } = req.params;
  const r = await pool.query('SELECT * FROM subtopics WHERE topic_id = $1 ORDER BY name', [topicId]);
  res.json(r.rows);
});
app.post('/api/subtopics', async (req, res) => {
  const { topic_id, name, description } = req.body;
  const r = await pool.query('INSERT INTO subtopics (topic_id, name, description) VALUES ($1,$2,$3) RETURNING *', [topic_id, name, description]);
  res.json(r.rows[0]);
});

/* ENTITIES */
app.get('/api/subtopics/:subtopicId/entities', async (req, res) => {
  const { subtopicId } = req.params;
  const r = await pool.query('SELECT * FROM entities WHERE subtopic_id = $1 ORDER BY name', [subtopicId]);
  res.json(r.rows);
});
app.post('/api/entities', async (req, res) => {
  const { subtopic_id, name, description, keywords, colors, style, slug, logo_url } = req.body;
  const r = await pool.query(
    `INSERT INTO entities (subtopic_id, name, description, keywords, colors, style, slug, logo_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [subtopic_id, name, description, keywords, colors, style, slug, logo_url]
  );
  res.json(r.rows[0]);
});
app.put('/api/entities/:id', async (req, res) => {
  const { id } = req.params;
  const fields = ['name','description','keywords','colors','style','slug','logo_url','subtopic_id'];
  const updates = [];
  const values = [];
  let idx = 1;
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = $${idx}`);
      values.push(req.body[f]);
      idx++;
    }
  }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
  values.push(id);
  const q = `UPDATE entities SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
  const r = await pool.query(q, values);
  res.json(r.rows[0]);
});

/* ENTITY IMAGES */
app.get('/api/entities/:id/images', async (req, res) => {
  const { id } = req.params;
  const r = await pool.query('SELECT * FROM entity_images WHERE entity_id = $1 ORDER BY created_at DESC', [id]);
  res.json(r.rows);
});
app.post('/api/entities/:id/images', async (req, res) => {
  const { id } = req.params;
  const { image_url, prompt, type, metadata } = req.body;
  const r = await pool.query(
    `INSERT INTO entity_images (entity_id, image_url, prompt, type, metadata) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [id, image_url, prompt, type, metadata || null]
  );
  res.json(r.rows[0]);
});

/* PRODUCT TYPES */
app.get('/api/product_types', async (req, res) => {
  const r = await pool.query('SELECT * FROM product_types ORDER BY name');
  res.json(r.rows);
});
app.post('/api/product_types', async (req, res) => {
  const { name, description } = req.body;
  const r = await pool.query('INSERT INTO product_types (name, description) VALUES ($1,$2) RETURNING *', [name, description]);
  res.json(r.rows[0]);
});

/* ENTITY_PRODUCTS (estado de generación) */
app.get('/api/entities/:id/products', async (req, res) => {
  const { id } = req.params;
  const r = await pool.query(
    `SELECT ep.*, pt.name AS product_name FROM entity_products ep
     JOIN product_types pt ON pt.id = ep.product_type_id
     WHERE ep.entity_id = $1 ORDER BY pt.name`, [id]);
  res.json(r.rows);
});
app.post('/api/entity_products', async (req, res) => {
  const { entity_id, product_type_id } = req.body;
  const r = await pool.query(
    `INSERT INTO entity_products (entity_id, product_type_id) VALUES ($1,$2) RETURNING *`,
    [entity_id, product_type_id]
  );
  res.json(r.rows[0]);
});
app.put('/api/entity_products/:id', async (req, res) => {
  const { id } = req.params;
  const fields = ['image_generated','generated_image_url','status','design_notes','generated_at'];
  const updates = [];
  const values = [];
  let idx = 1;
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = $${idx}`);
      values.push(req.body[f]);
      idx++;
    }
  }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
  values.push(id);
  const q = `UPDATE entity_products SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`;
  const r = await pool.query(q, values);
  res.json(r.rows[0]);
});

/* GENERATE endpoint (stub) - en producción, esto encola un job a un worker o llama una API de imagen */
app.post('/api/generate', async (req, res) => {
  const { entityId, productTypeId, prompt } = req.body;

  // 1) Crear o actualizar entity_products con status = 'generating'
  const upsertQ = `
    INSERT INTO entity_products (entity_id, product_type_id, image_generated, status, created_at)
    VALUES ($1,$2,false,'generating',NOW())
    ON CONFLICT (entity_id, product_type_id) DO UPDATE SET status='generating', updated_at=NOW()
    RETURNING *`;
  const r = await pool.query(upsertQ, [entityId, productTypeId]);

  // 2) En un sistema real, acá encolarías job a worker (ej: bull, rabbitmq) que llame a la IA.
  // Por ahora respondemos con un stub y cambiamos a 'pending' para simular.
  // Simulamos: dejamos status 'pending' y devolvemos el prompt y el registro
  const ep = r.rows[0];
  await pool.query('UPDATE entity_products SET status=$1 WHERE id=$2', ['pending', ep.id]);

  res.json({ ok: true, message: 'Generación encolada (simulada). Implementar worker para procesar.', ep, prompt });
});

/* Ping */
app.get('/api/ping', (req,res) => res.json({ok:true, ts: new Date()}));

/* Start server */
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API listening on ${PORT}`));
