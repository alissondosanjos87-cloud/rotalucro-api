require('dotenv').config()
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const morgan = require('morgan')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = process.env.PORT || 3000

app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rate limit
try { app.use(require('./middleware/rateLimit')) } catch(e) {}

// Rotas da API
app.use('/api/optimize', require('./routes/optimize'))
app.use('/api/upload',   require('./routes/upload'))
app.use('/api/lucro',    require('./routes/lucro'))
app.use('/api/perfil',   require('./routes/perfil'))
app.use('/api/track',    require('./routes/track'))
app.use('/api/health',   require('./routes/health'))

// Serve o build do React (gerado em public/app)
const reactBuild = path.join(__dirname, 'public', 'app')
const staticPublic = path.join(__dirname, 'public')

console.log('PUBLIC PATH:', staticPublic)

// React primeiro, depois HTML estático
if (fs.existsSync(reactBuild)) {
  app.use(express.static(reactBuild))
}
app.use(express.static(staticPublic))

// SPA fallback — React Router precisa disso
app.get('*', (req, res) => {
  const reactIndex = path.join(reactBuild, 'index.html')
  const staticIndex = path.join(staticPublic, 'index.html')
  if (fs.existsSync(reactIndex)) {
    res.sendFile(reactIndex)
  } else {
    res.sendFile(staticIndex)
  }
})

app.listen(PORT, () => {
  console.log(`Servidor online na porta ${PORT}`)
})
