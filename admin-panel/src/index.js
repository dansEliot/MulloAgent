// Full React Admin Panel (MUI) – Entry point index.js + App.js + components
// This file should be split into multiple files in a real project, but presented here in one piece.

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import {
  Container,
  Typography,
  TextField,
  MenuItem,
  Button,
  Card,
  CardContent,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Box,
} from "@mui/material";

// ---------------- API CLIENT ----------------
const API = "http://localhost:3001";
async function apiGet(path) {
  const res = await fetch(API + path);
  return res.json();
}
async function apiPost(path, data) {
  const res = await fetch(API + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

// -------------- COMPONENT: CREATE CATEGORY --------------
function CreateCategory({ onCreate }) {
  const [name, setName] = useState("");

  async function submit() {
    if (!name.trim()) return;
    const newCat = await apiPost("/categories", { name });
    onCreate(newCat);
    setName("");
  }

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6">Crear Categoría</Typography>
        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <TextField
            fullWidth
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button variant="contained" onClick={submit}>
            Crear
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

// -------------- COMPONENT: CREATE ENTITY --------------
function CreateEntity({ categories, onCreate }) {
  const [form, setForm] = useState({ title: "", category_id: "" });

  async function submit() {
    if (!form.title.trim() || !form.category_id) return;
    const newEntity = await apiPost("/entities", form);
    onCreate(newEntity);
    setForm({ title: "", category_id: "" });
  }

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6">Crear Entidad</Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Título"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              label="Categoría"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            >
              <MenuItem value="">Seleccionar...</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <Button variant="contained" fullWidth onClick={submit}>
              Crear Entidad
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

// -------------- MAIN ADMIN PANEL --------------
function AdminPanel() {
  const [categories, setCategories] = useState([]);
  const [entities, setEntities] = useState([]);

  useEffect(() => {
    apiGet("/categories").then(setCategories);
    apiGet("/entities").then(setEntities);
  }, []);

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Panel Admin Completo (React + Material UI)
      </Typography>

      <CreateCategory onCreate={(c) => setCategories([...categories, c])} />

      <CreateEntity
        categories={categories}
        onCreate={(e) => setEntities([...entities, e])}
      />

      <Card>
        <CardContent>
          <Typography variant="h6">Entidades Registradas</Typography>
          <Divider sx={{ my: 2 }} />

          <List>
            {entities.map((e) => (
              <ListItem key={e.id} divider>
                <ListItemText
                  primary={e.title}
                  secondary={`Categoría ID: ${e.category_id}`}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Container>
  );
}

// -------------- RENDER APP --------------
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<AdminPanel />);
