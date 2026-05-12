# 🧠 RotaLucro API v5.0

API de otimização de rotas de entrega com algoritmo 2-opt, agrupamento inteligente e detecção de tipo de parada.

## 🚀 Features

- **2-Opt Algorithm** - Otimização de rota que remove cruzamentos
- **Nearest Neighbor** - Solução inicial rápida
- **Multi-Start** - Múltiplas tentativas para melhor resultado
- **Agrupamento** - Junta paradas no mesmo local (30m)
- **Detecção** - Identifica casa, apartamento ou condomínio
- **Cache** - Respostas rápidas para rotas repetidas
- **Worker Threads** - Processamento paralelo para rotas grandes

## 📡 Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/optimize` | Otimizar rota |
| `POST` | `/api/upload` | Upload de planilha |
| `POST` | `/api/lucro/calcular` | Calcular lucro |
| `GET` | `/api/perfil/bairros` | Perfil de bairros |

## 🛠️ Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express 4.x
- **Otimização:** 2-Opt, Nearest Neighbor, Multi-Start
- **Cache:** Memória com TTL

## 📦 Instalação

```bash
git clone https://github.com/alissc/rotalucro-api.git
cd rotalucro-api
npm install
cp .env.example .env
npm start
