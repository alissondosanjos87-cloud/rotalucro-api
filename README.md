# 🧠 RotaLucro API v7.0

API de otimização de rotas de entrega com algoritmo 2-opt, 
agrupamento inteligente e detecção de tipo de parada.

## 🚀 Features

- **2-Opt com timeout adaptativo** — sem travamento em rotas grandes
- **Nearest Neighbor com bônus de bairro** — agrupa por região
- **Multi-Start** — múltiplas tentativas para melhor resultado
- **Cache de rotas** — respostas instantâneas para rotas repetidas
- **Agrupamento** — junta paradas próximas (raio configurável)
- **Detecção** — identifica casa, apartamento ou condomínio
- **Worker Threads** — processamento paralelo

## 📡 Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/health | Health check |
| POST | /api/optimize | Otimizar rota |
| POST | /api/upload?raio=30 | Upload de planilha |
| POST | /api/lucro/calcular | Calcular lucro |
| GET | /api/perfil/bairros | Perfil de bairros |

## 📦 Instalação local

```bash
git clone https://github.com/SEU_USUARIO/rotalucro-api.git
cd rotalucro-api
npm install
cp .env.example .env
npm start
