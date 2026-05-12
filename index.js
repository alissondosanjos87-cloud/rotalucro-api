const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SERVIR ARQUIVOS DA PASTA PUBLIC
app.use(express.static(path.join(__dirname, 'public')));

// ROTA PRINCIPAL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// TESTE
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    status: 'RotaLucro Online'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
