const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('RotaLucro API online'));
app.get('/api/health', (req, res) => res.json({ ok: true, node: process.version }));

app.listen(process.env.PORT || 3000, () => {
  console.log('API rodando');
});  res.json({ 
    message: 'RotaLucro API v3.0',
    status: 'online',
    endpoints: ['/api/health','/api/lucro','/api/optimize']
  });
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ RotaLucro API rodando na porta ${PORT}`);
});    }
  });
});

app.listen(3000, function() {
  console.log('RotaLucro API port 3000');
});
