// backend/config/db.js
const mongoose = require('mongoose');
const dns = require('dns');

async function tryConnect(uri, label) {
  if (!uri) throw new Error('URI vacía');
  return mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  }).then((conn) => {
    console.log(`MongoDB Conectado (${label}): ${conn.connection.host}`);
    return conn;
  });
}

const connectDB = async () => {
  const primary = process.env.MONGO_URI;
  const fallback = process.env.MONGO_URI_DIRECT; // opcional (sin SRV)

  try { dns.setDefaultResultOrder('ipv4first'); } catch {}

  try {
    await tryConnect(primary, 'PRINCIPAL');
    return;
  } catch (error) {
    console.error(`[DB] Falló conexión principal: ${error?.code || error?.name || ''} ${error?.message}`);
    const isSrvIssue = /SRV|ENOTFOUND|ECONNREFUSED|EAI_AGAIN/i.test(String(error?.code)) || /querySrv/i.test(String(error?.message));
    if (!fallback || !isSrvIssue) {
      process.exit(1);
      return;
    }
  }

  try {
    await tryConnect(fallback, 'FALLBACK');
    return;
  } catch (error) {
    console.error(`[DB] Falló conexión fallback: ${error?.code || error?.name || ''} ${error?.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

