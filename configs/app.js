'use strict';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Configuraciones
import { mongoConnection } from './db-mongo.js';
import { corsOptions } from './cors-configuration.js';
import { helmetConfiguration } from './helmet-configuration.js';

// Middlewares
import { validateJWT } from '../middlewares/validate-JWT.js';
import { requestLimit } from '../middlewares/request-limit.js';

// Rutas
import authRoutes from '../src/auth/auth.routes.js';
import userRoutes from '../src/user/user.routes.js';
import publicationRoutes from '../src/publications/publication.routes.js';
import commentRoutes from '../src/comments/comment.routes.js';

// Modelo de usuario (para seed del admin root)
import { User } from '../src/user/user.model.js';
import { hashPassword } from '../utils/password-utils.js';

const BASE_PATH = '/opinionsManagement/v1';

/* =========================
   Admin Root Seed
   ========================= */
const ensureRootAdmin = async () => {
    try {
        const existingRoot = await User.findOne({ email: process.env.ROOT_ADMIN_EMAIL });

        if (existingRoot) {
            console.log('MongoDB | Root admin ya existe');
            return;
        }

        console.log('MongoDB | Creando ROOT ADMIN...');

        const hashedPassword = await hashPassword(process.env.ROOT_ADMIN_PASSWORD);

        await User.create({
            name: 'Root',
            surname: 'Admin',
            username: process.env.ROOT_ADMIN_USERNAME,
            email: process.env.ROOT_ADMIN_EMAIL,
            password: hashedPassword,
            role: 'ADMIN',
            status: true,
            emailVerified: true,
        });

        console.log('MongoDB | ROOT ADMIN CREADO EXITOSAMENTE');
    } catch (error) {
        console.error('Error creando root admin:', error.message);
    }
};

/* =========================
   Middlewares Globales
   ========================= */
const middlewares = (app) => {
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(express.json({ limit: '10mb' }));
    app.use(cors(corsOptions));
    app.use(helmet(helmetConfiguration));
    app.use(morgan('dev'));
    app.use(requestLimit);
};

/* =========================
   Rutas
   ========================= */
const routes = (app) => {
    // 🔓 Rutas Públicas
    app.use(`${BASE_PATH}/auth`, authRoutes);

    // 🔐 Rutas Protegidas
    app.use(`${BASE_PATH}/users`, validateJWT, userRoutes);
    app.use(`${BASE_PATH}/publications`, validateJWT, publicationRoutes);
    app.use(`${BASE_PATH}/comments`, validateJWT, commentRoutes);

    // Health Check
    app.get(`${BASE_PATH}/health`, (req, res) => {
        return res.status(200).json({
            success: true,
            status: 'Healthy',
            timestamp: new Date().toISOString(),
            service: 'Opinions Management System',
            database: { mongodb: 'Connected' },
        });
    });

    // 404 Handler
    app.use((req, res) => {
        res.status(404).json({ success: false, message: 'Endpoint no encontrado' });
    });
};

/* =========================
   Inicialización
   ========================= */
export const initServer = async () => {
    const app = express();
    const PORT = process.env.PORT || 3000;

    try {
        console.log('--- INICIANDO Opinions Management System ---');

        await mongoConnection();
        await ensureRootAdmin();

        middlewares(app);
        routes(app);

        app.listen(PORT, () => {
            console.log('---------------------------------------------');
            console.log(`Servidor corriendo en el puerto: ${PORT}`);
            console.log(`Health: http://localhost:${PORT}${BASE_PATH}/health`);
            console.log('---------------------------------------------');
        });

    } catch (error) {
        console.error('ERROR CRÍTICO al iniciar el servidor:', error.message);
        process.exit(1);
    }
};
