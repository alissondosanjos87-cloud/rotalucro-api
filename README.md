# 🧠 RotaLucro API v3.0

Backend de otimização de rotas com IA que aprende trânsito real + cálculo de lucro.

## 🚀 Features

- **2-opt Algorithm**: Otimização em Worker Threads
- **Cache Redis**: Rotas repetidas respondem em <100ms
- **IA de Trânsito**: Aprende com histórico real do usuário
- **Cálculo Lucro**: Frete - custos = lucro líquido real

## 📡 Endpoints

### POST /api/optimize
Otimiza rota com 2-opt + histórico de trânsito
```json
{
  "pedidos": [
    {"id": "1", "lat": -23.5505, "lng": -46.6333},
    {"id": "2", "lat": -23.5489, "lng": -46.6388}
  ]
}
