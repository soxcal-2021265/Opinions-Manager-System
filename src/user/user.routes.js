import { Router } from 'express';
import { getProfile, updateProfile, changePassword } from './user.controller.js';
import { validateUpdateProfile, validateChangePassword } from '../../middlewares/validation.js';

const router = Router();

/* ============================================================
   RUTAS DE PERFIL (todas requieren JWT - aplicado en app.js)
   NO existe ruta DELETE - eliminación de perfiles no permitida
   ============================================================ */

// GET /users/profile - Ver perfil propio
router.get('/profile', getProfile);

// PUT /users/profile - Editar nombre, apellido o username
router.put('/profile', validateUpdateProfile, updateProfile);

// PUT /users/change-password - Cambiar contraseña (requiere contraseña actual)
router.put('/change-password', validateChangePassword, changePassword);

export default router;
