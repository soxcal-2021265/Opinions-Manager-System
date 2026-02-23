import rateLimit from 'express-rate-limit';
import { config } from '../configs/configs.js';

// Rate limiter general para la API
export const requestLimit = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.',
            retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
        });
    },
});

// Rate limiter específico para autenticación
export const authRateLimit = rateLimit({
    windowMs: config.rateLimit.authWindowMs,
    max: config.rateLimit.authMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.log(`Rate limit excedido para IP: ${req.ip} en ${req.path}`);
        res.status(429).json({
            success: false,
            message: 'Demasiados intentos de autenticación, intenta de nuevo más tarde.',
            retryAfter: Math.ceil(config.rateLimit.authWindowMs / 1000),
        });
    },
});

// Rate limiter para emails
export const emailRateLimit = rateLimit({
    windowMs: config.rateLimit.emailWindowMs,
    max: config.rateLimit.emailMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Demasiados emails enviados, intenta de nuevo en 15 minutos.',
            retryAfter: Math.ceil(config.rateLimit.emailWindowMs / 1000),
        });
    },
});
