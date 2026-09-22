import mongoose from 'mongoose';
import dns from 'dns';

// Configura servidores DNS confiáveis para evitar o erro ECONNREFUSED em querySrv do mongodb+srv
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Erro ao conectar no MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
