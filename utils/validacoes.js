// Validação de parada
const validarParada = (parada) => {
  if (!parada || typeof parada !== 'object') {
    return { valid: false, error: 'Parada deve ser um objeto' };
  }

  const { endereco, lat, lng, tipo } = parada;

  if (!endereco || typeof endereco !== 'string' || endereco.trim().length === 0) {
    return { valid: false, error: 'Endereço inválido' };
  }

  if (typeof lat !== 'number' || lat < -90 || lat > 90) {
    return { valid: false, error: 'Latitude inválida' };
  }

  if (typeof lng !== 'number' || lng < -180 || lng > 180) {
    return { valid: false, error: 'Longitude inválida' };
  }

  const tiposValidos = ['casa', 'apartamento', 'condominio'];
  if (tipo && !tiposValidos.includes(tipo.toLowerCase())) {
    return { valid: false, error: 'Tipo de parada inválido' };
  }

  return { valid: true };
};

// Validação de upload
const validarUpload = (file, maxSize = 5 * 1024 * 1024) => {
  if (!file) {
    return { valid: false, error: 'Arquivo não fornecido' };
  }

  const extensoesValidas = ['xlsx', 'xls', 'csv'];
  const extensao = file.originalname.split('.').pop().toLowerCase();

  if (!extensoesValidas.includes(extensao)) {
    return { valid: false, error: 'Formato de arquivo não suportado' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: `Arquivo muito grande. Máximo: ${maxSize / (1024 * 1024)}MB` };
  }

  return { valid: true };
};

// Validação de lucro
const validarCalculoLucro = (dados) => {
  if (!dados || typeof dados !== 'object') {
    return { valid: false, error: 'Dados inválidos' };
  }

  const { totalPacotes, totalKm, custoPorKm, valorPorEntrega } = dados;

  if (!Number.isFinite(totalPacotes) || totalPacotes < 0) {
    return { valid: false, error: 'Total de pacotes inválido' };
  }

  if (!Number.isFinite(totalKm) || totalKm < 0) {
    return { valid: false, error: 'Total de km inválido' };
  }

  if (!Number.isFinite(custoPorKm) || custoPorKm < 0) {
    return { valid: false, error: 'Custo por km inválido' };
  }

  if (!Number.isFinite(valorPorEntrega) || valorPorEntrega < 0) {
    return { valid: false, error: 'Valor por entrega inválido' };
  }

  return { valid: true };
};

module.exports = {
  validarParada,
  validarUpload,
  validarCalculoLucro,
};