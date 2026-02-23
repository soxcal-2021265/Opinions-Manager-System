import { Router } from 'express';
import {
    createPublication,
    getPublications,
    getPublicationById,
    updatePublication,
    deletePublication,
    getMyPublications,
} from './publication.controller.js';
import { validatePublication } from '../../middlewares/validation.js';

const router = Router();

/* ============================================================
   RUTAS DE PUBLICACIONES (todas requieren JWT - aplicado en app.js)
   ============================================================ */

// GET /publications - Listar todas las publicaciones (con paginación y filtro por categoría)
router.get('/', getPublications);

// GET /publications/my - Ver mis propias publicaciones
router.get('/my', getMyPublications);

// GET /publications/:id - Ver una publicación con sus comentarios
router.get('/:id', getPublicationById);

// POST /publications - Crear nueva publicación
router.post('/', validatePublication, createPublication);

// PUT /publications/:id - Editar publicación (solo el autor)
router.put('/:id', validatePublication, updatePublication);

// DELETE /publications/:id - Eliminar publicación (solo el autor)
router.delete('/:id', deletePublication);

export default router;
