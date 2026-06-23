import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import * as winston from 'winston';
import mainRoutes from './src/routes';
import { sequelize } from './src/models';

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do Logger (Winston)
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Middlewares de Segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
    },
  },
}));
app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições vindas deste IP, tente novamente após 15 minutos.'
});
app.use('/api/', limiter);

// Middlewares Base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View Engine (PUG)
app.set('views', path.join(__dirname, 'src', 'views'));
app.set('view engine', 'pug');

// Rotas
app.use('/', mainRoutes);

// Sincronizar com o banco de dados e iniciar o servidor
const syncOptions = process.env.NODE_ENV === 'production' ? {} : { alter: true };

if (process.env.NODE_ENV !== 'test') {
  sequelize.sync(syncOptions)
    .then(() => {
      logger.info('Banco de dados conectado e sincronizado.');
      app.listen(PORT, () => {
        logger.info(`Servidor rodando na porta ${PORT}`);
      });
    })
    .catch((err: Error) => {
      logger.error('Não foi possível conectar ao banco de dados:', err);
    });
}

export { app };
