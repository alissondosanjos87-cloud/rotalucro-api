
// middleware/auth.js
var supabase = null;

try {
  var { createClient } = require('@supabase/supabase-js');
  supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_ANON_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
} catch(e) {
  supabase = null;
}

function auth(req, res, next) {
  var token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  if (!supabase) {
    req.user = { id: 'offline', email: 'offline@local' };
    return next();
  }

  supabase.auth.getUser(token).then(function(result) {
    if (result.error || !result.data.user) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    req.user = result.data.user;
    next();
  }).catch(function() {
    res.status(500).json({ error: 'Erro na autenticação' });
  });
}

function optionalAuth(req, res, next) {
  var token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) { req.user = null; return next(); }
  if (!supabase) { req.user = { id: 'offline' }; return next(); }
  
  supabase.auth.getUser(token).then(function(result) {
    req.user = result.data?.user || null;
    next();
  }).catch(function() {
    req.user = null;
    next();
  });
}

module.exports = { auth, optionalAuth };
```

---

Criou? Me avisa que mando o próximo! 📁
