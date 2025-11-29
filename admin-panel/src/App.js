// src/App.js

import React from 'react';
// 1. Importa el componente AdminPanel.
// Asegúrate de que la ruta sea correcta (ej: './AdminPanel' si está en el mismo directorio src/)
import AdminPanel from './AdminPanel'; 

function App() {
  return (
    <div className="App">
      {/* 2. Renderiza el componente dentro del JSX */}
      <AdminPanel />
      
      {/* // Puedes comentar o eliminar el contenido preexistente 
      // si ya no lo necesitas, como el logo o el contador.
      */}
      
    </div>
  );
}

export default App;