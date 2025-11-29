import React, { useEffect, useState } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export default function AdminPanel(){
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [subtopics, setSubtopics] = useState([]);
  const [entities, setEntities] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ fetchTopics(); fetchProductTypes(); }, []);

  async function fetchTopics(){
    const r = await fetch(`${API}/topics`);
    setTopics(await r.json());
  }
  async function fetchProductTypes(){
    const r = await fetch(`${API}/product_types`);
    setProductTypes(await r.json());
  }

  async function onSelectTopic(t){
    setSelectedTopic(t);
    const r = await fetch(`${API}/topics/${t.id}/subtopics`);
    const data = await r.json();
    setSubtopics(data);
    setEntities([]);
    setSelectedEntity(null);
  }

  async function onSelectSubtopic(s){
    const r = await fetch(`${API}/subtopics/${s.id}/entities`);
    const data = await r.json();
    setEntities(data);
    setSelectedEntity(null);
  }

  function onSelectEntity(e){
    setSelectedEntity(e);
  }

  async function handleCreateTopic(){
    const name = prompt('Nombre del topic');
    if(!name) return;
    const desc = prompt('Descripción (opcional)');
    const r = await fetch(`${API}/topics`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name, description: desc})});
    const t = await r.json(); setTopics(prev => [...prev, t]);
  }

  async function handleCreateSubtopic(){
    if(!selectedTopic) return alert('Seleccioná un topic');
    const name = prompt('Nombre del subtopic');
    if(!name) return;
    const desc = prompt('Descripción (opcional)');
    const r = await fetch(`${API}/subtopics`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({topic_id: selectedTopic.id, name, description: desc})});
    const s = await r.json();
    setSubtopics(prev => [...prev, s]);
  }

  async function handleCreateEntity(){
    if(!subtopics || subtopics.length===0) return alert('Seleccioná un subtopic');
    const subtopic = subtopics[0]; // simplificación: crea en el primero listado
    const name = prompt('Nombre de la entidad (ej: Boca Juniors)');
    if(!name) return;
    const desc = prompt('Descripción (opcional)');
    const keywords = prompt('Keywords separados por comas (opcional)');
    const colors = prompt('Colores (opcional)');
    const slug = prompt('Slug (opcional)');
    const payload = { subtopic_id: subtopic.id, name, description: desc, keywords, colors, slug };
    const r = await fetch(`${API}/entities`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
    const e = await r.json();
    setEntities(prev => [...prev, e]);
  }

  async function handleGenerateImage(entity, productType){
    setLoading(true);
    const prompt = `Generar logo para ${entity.name}. Estilo: ${entity.style || 'neutral'}. Colores: ${entity.colors || 'none'}. Uso: ${productType.name}. Vector, alta resolución, fondo transparente.`;
    const r = await fetch(`${API}/generate`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ entityId: entity.id, productTypeId: productType.id, prompt })});
    const j = await r.json();
    alert('Generación solicitada (simulada): ' + j.message);
    setLoading(false);
  }

  return (
    <div style={{display:'flex',height:'100vh',fontFamily:'Arial, sans-serif'}}>
      <aside style={{width:280,borderRight:'1px solid #eee',padding:16,overflowY:'auto'}}>
        <h3>Topics</h3>
        <button onClick={handleCreateTopic}>+ Topic</button>
        <ul>
          {topics.map(t => (
            <li key={t.id} style={{margin:'6px 0',cursor:'pointer'}} onClick={()=>onSelectTopic(t)}>
              <strong>{t.name}</strong><div style={{fontSize:12,color:'#666'}}>{t.description}</div>
            </li>
          ))}
        </ul>
      </aside>

      <main style={{flex:1,padding:20,overflowY:'auto'}}>
        <div style={{display:'flex',gap:20}}>
          <section style={{flex:1}}>
            <h4>Subtopics {selectedTopic ? `— ${selectedTopic.name}` : ''}</h4>
            <button onClick={handleCreateSubtopic} disabled={!selectedTopic}>+ Subtopic</button>
            <ul>
              {subtopics.map(s => <li key={s.id} style={{cursor:'pointer'}} onClick={()=>onSelectSubtopic(s)}>{s.name}</li>)}
            </ul>
          </section>

          <section style={{flex:1}}>
            <h4>Entities</h4>
            <button onClick={handleCreateEntity} disabled={!subtopics || subtopics.length===0}>+ Entity</button>
            <ul>
              {entities.map(e => <li key={e.id} style={{cursor:'pointer'}} onClick={()=>onSelectEntity(e)}>{e.name}</li>)}
            </ul>
          </section>

          <section style={{flex:1}}>
            <h4>Product Types</h4>
            <ul>
              {productTypes.map(p => <li key={p.id}>{p.name}</li>)}
            </ul>
          </section>
        </div>

        {selectedEntity && (
          <div style={{marginTop:30}}>
            <h3>{selectedEntity.name}</h3>
            <p style={{color:'#555'}}>{selectedEntity.description}</p>

            <h4>Generar imagen para producto</h4>
            <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
              {productTypes.map(pt => (
                <div key={pt.id} style={{border:'1px solid #ddd',padding:12,borderRadius:6}}>
                  <div style={{fontWeight:600}}>{pt.name}</div>
                  <button disabled={loading} onClick={()=>handleGenerateImage(selectedEntity, pt)} style={{marginTop:8}}>Generar</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
