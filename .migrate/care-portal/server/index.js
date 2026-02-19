import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import pg from 'pg'
import 'dotenv/config'

const app = new Hono()

// Enable CORS for frontend
app.use('/*', cors())

// Health Check / Home
app.get('/', (c) => c.text('Care Portal API is Live!'))

// Database Connection
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Railway/External Postgres
})

// --- N8N WEBHOOK HELPER ---
const triggerN8n = async (event, data) => {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) return;
  
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, ...data, timestamp: new Date() })
    });
  } catch (err) {
    console.error('Failed to trigger n8n:', err);
  }
}

// --- ENDPOINTS ---

// GET: All Data (Initial Load)
app.get('/api/sync', async (c) => {
  try {
    const [meds, supplies, status, history, appts, tasks, timeline] = await Promise.all([
      pool.query('SELECT * FROM medications WHERE is_active = true'),
      pool.query('SELECT * FROM inventory_supplies'),
      pool.query('SELECT * FROM patient_status WHERE id = 1'),
      pool.query('SELECT * FROM medical_history WHERE is_active = true'),
      pool.query("SELECT * FROM appointments WHERE status = 'scheduled' ORDER BY appointment_at ASC"),
      pool.query('SELECT * FROM care_tasks WHERE completed_at IS NULL ORDER BY priority DESC'),
      pool.query('SELECT * FROM care_timeline ORDER BY performed_at DESC LIMIT 20')
    ]);

    return c.json({
      meds: meds.rows,
      supplies: supplies.rows,
      patientStatus: status.rows[0],
      medicalHistory: history.rows,
      appointments: appts.rows,
      tasks: tasks.rows,
      events: timeline.rows
    });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// POST: Add Event
app.post('/api/events', async (c) => {
  const body = await c.req.json();
  const { event_type, title, description, value_numeric, value_sub } = body;
  
  try {
    const res = await pool.query(
      'INSERT INTO care_timeline (event_type, title, description, value_numeric, value_sub) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [event_type, title, description, value_numeric, value_sub]
    );

    // Trigger n8n for high priority events
    if (event_type === 'incident' || (event_type === 'vitals' && value_numeric < 90)) {
      triggerN8n('emergency_alert', { title, description, value: value_numeric });
    }

    return c.json(res.rows[0]);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// PATCH: Update Task
app.patch('/api/tasks/:id/complete', async (c) => {
  const id = c.req.param('id');
  try {
    const res = await pool.query(
      'UPDATE care_tasks SET completed_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    return c.json(res.rows[0]);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// PATCH: Update Medication Stock
app.patch('/api/medications/:id/stock', async (c) => {
  const id = c.req.param('id');
  const { stock } = await c.req.json();
  try {
    const res = await pool.query(
      'UPDATE medications SET stock_current = $1 WHERE id = $2 RETURNING *',
      [stock, id]
    );
    return c.json(res.rows[0]);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

const port = process.env.PORT || 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
})
