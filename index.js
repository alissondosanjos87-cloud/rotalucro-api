const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CAMINHO ABSOLUTO DA PUBLIC
const publicPath = path.join(process.cwd(), 'public');

console.log('PUBLIC PATH:', publicPath);

// SERVIR HTML/CSS/JS
app.use(express.static(publicPath));

// INDEX
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({
    ok: true
  });
});

// 404
app.use((req, res) => {
  res.status(404).send('Página não encontrada');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor online na porta ${PORT}`);
});
