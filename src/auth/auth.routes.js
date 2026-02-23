import { Router } from 'express';
import { register, login, verifyEmail, resendVerification } from './auth.controller.js';
import { validateRegister, validateLogin, validateVerifyEmail } from '../../middlewares/validation.js';
import { authRateLimit, emailRateLimit } from '../../middlewares/request-limit.js';

const router = Router();

/* ============================================================
   RUTAS PÚBLICAS
   ============================================================ */

// POST /auth/register - Registro de nuevo usuario
router.post('/register', [authRateLimit, validateRegister], register);

// POST /auth/login - Inicio de sesión (email o username + contraseña)
router.post('/login', [authRateLimit, validateLogin], login);

// POST /auth/verify-email - Verificación de correo
router.post('/verify-email', validateVerifyEmail, verifyEmail);

// POST /auth/resend-verification - Reenviar email de verificación
router.post('/resend-verification', emailRateLimit, resendVerification);

export default router;
