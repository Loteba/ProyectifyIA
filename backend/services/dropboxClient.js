const axios = require('axios');
const { Dropbox } = require('dropbox');

// --- Variables para la caché en memoria ---
let cachedToken = null;
let cachedExpiry = 0; // Se guardará el tiempo de expiración en milisegundos

/**
 * Función principal para obtener un token de acceso válido.
 * Utiliza un token de refresco para obtener un nuevo token de acceso si el actual
 * no existe, está a punto de expirar, o si no hay ninguno en caché.
 */
const fetchAccessToken = async () => {
  // 1. Revisa si hay un token válido en la caché
  const now = Date.now();
  // Consideramos que el token expira 1 minuto antes para tener margen
  if (cachedToken && now < cachedExpiry - 60_000) {
    return cachedToken;
  }

  console.log('[dropboxClient] El token ha expirado o no existe. Refrescando...');

  // 2. Obtiene las credenciales de las variables de entorno
  const refreshToken = (process.env.DROPBOX_REFRESH_TOKEN || '').trim();
  const clientId = process.env.DROPBOX_APP_KEY;
  const clientSecret = process.env.DROPBOX_APP_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error('Variables de entorno críticas faltantes: DROPBOX_REFRESH_TOKEN, DROPBOX_APP_KEY, o DROPBOX_APP_SECRET');
  }

  // 3. Prepara la petición para refrescar el token
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);

  console.log(`[dropboxClient] Intentando refrescar el token: '${refreshToken}'`);

  try {
    // 4. Ejecuta la petición POST con el formato correcto
    const { data } = await axios.post('https://api.dropboxapi.com/oauth2/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15_000, // Aumentamos un poco el timeout
    });

    // 5. Guarda el nuevo token y su tiempo de expiración en la caché
    cachedToken = data.access_token;
    // data.expires_in está en segundos, lo convertimos a milisegundos
    const expiresInMs = (data.expires_in || 3600) * 1000;
    cachedExpiry = Date.now() + expiresInMs;

    console.log('[dropboxClient] Token refrescado exitosamente.');
    return cachedToken;

  } catch (err) {
    // Si hay un error, muestra los detalles específicos de la API de Dropbox
    const errorDetails = err.response?.data || { error: err.message };
    console.error('[dropboxClient] Error FATAL al refrescar el token:', errorDetails);
    
    // Lanza un nuevo error más descriptivo
    throw new Error(`Fallo al refrescar el token de Dropbox: ${errorDetails.error_description || errorDetails.error}`);
  }
};

/**
 * Obtiene una instancia del cliente de Dropbox lista para usar.
 */
const getDropboxClient = async () => {
  try {
    const accessToken = await fetchAccessToken();
    return new Dropbox({ accessToken });
  } catch (error) {
    console.error("No se pudo crear el cliente de Dropbox:", error.message);
    throw error;
  }
};

module.exports = { getDropboxClient, fetchAccessToken };