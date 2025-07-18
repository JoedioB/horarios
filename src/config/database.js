import mysql from "mysql2";
import dotenv from 'dotenv'; // Apenas para desenvolvimento local
dotenv.config(); // Carrega variáveis do.env para desenvolvimento local

const con = mysql.createConnection({
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
});

con.connect((error) => {
  if (error) {
    console.log("❌ Erro de conexão com o banco de dados:", error);
  } else {
    console.log("✅ Conectado ao banco de dados MySQL!");
  }
});

export default con;