import { Router } from 'express';
import {
    createComment,
    getCommentsByPublication,
    updateComment,
    deleteComment,
    getMyComments,
} from './comment.controller.js';
import { validateComment } from '../../middlewares/validation.js';

const router = Router();

/* ============================================================
   RUTAS DE COMENTARIOS (todas requieren JWT - aplicado en app.js)
   ============================================================ */

// GET /comments/my - Ver mis propios comentarios
router.get('/my', getMyComments);

// GET /comments/publication/:id - Listar comentarios de una publicación
router.get('/publication/:id', getCommentsByPublication);

// POST /comments/publication/:id - Comentar en una publicación
router.post('/publication/:id', validateComment, createComment);

// PUT /comments/:commentId - Editar un comentario (solo el autor)
router.put('/:commentId', validateComment, updateComment);

// DELETE /comments/:commentId - Eliminar un comentario (solo el autor)
router.delete('/:commentId', deleteComment);

export default router;
