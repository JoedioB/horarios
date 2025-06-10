require('dotenv').config();
const express = require('express');
const path = require('path');
const mainRoutes = require('./src/routes');
const { sequelize } = require('./src/models');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do View Engine (PUG)
app.set('views', path.join(__dirname, 'src', 'views'));
app.set('view engine', 'pug');

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rotas
app.use('/', mainRoutes);

// Sincronizar com o banco de dados e iniciar o servidor
sequelize.sync({ alter: true }) // 'alter: true' pode modificar tabelas existentes. Use com cuidado em produção.
  .then(() => {
    console.log('Banco de dados conectado e sincronizado.');
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Não foi possível conectar ao banco de dados:', err);
  });