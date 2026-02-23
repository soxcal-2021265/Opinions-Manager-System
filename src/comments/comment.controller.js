import { Comment } from './comment.model.js';
import { Publication } from '../publications/publication.model.js';

/* =========================
   CREATE COMMENT
   Cualquier usuario autenticado puede comentar en publicaciones activas
   ========================= */
export const createComment = async (req, res) => {
    try {
        const { id: publicationId } = req.params;
        const { content } = req.body;

        // Verificar que la publicación existe y está activa
        const publication = await Publication.findOne({ _id: publicationId, status: 'active' });

        if (!publication) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada.',
            });
        }

        const comment = await Comment.create({
            content,
            publication: publicationId,
            author: req.userId,
        });

        await comment.populate('author', 'name surname username');

        return res.status(201).json({
            success: true,
            message: 'Comentario agregado exitosamente.',
            comment,
        });
    } catch (error) {
        console.error('Error en createComment:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.',
        });
    }
};

/* =========================
   GET COMMENTS BY PUBLICATION
   ========================= */
export const getCommentsByPublication = async (req, res) => {
    try {
        const { id: publicationId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Verificar que la publicación existe
        const publication = await Publication.findOne({ _id: publicationId, status: 'active' });

        if (!publication) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada.',
            });
        }

        const filter = { publication: publicationId, status: 'active' };

        const [comments, total] = await Promise.all([
            Comment.find(filter)
                .populate('author', 'name surname username')
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Comment.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            comments,
        });
    } catch (error) {
        console.error('Error en getCommentsByPublication:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.',
        });
    }
};

/* =========================
   UPDATE COMMENT
   Solo el autor puede editar su propio comentario
   ========================= */
export const updateComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;

        const comment = await Comment.findOne({ _id: commentId, status: 'active' });

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comentario no encontrado.',
            });
        }

        // Verificar que el usuario es el autor del comentario
        if (comment.author.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para editar este comentario.',
            });
        }

        const updatedComment = await Comment.findByIdAndUpdate(
            commentId,
            { content },
            { new: true, runValidators: true }
        ).populate('author', 'name surname username');

        return res.status(200).json({
            success: true,
            message: 'Comentario actualizado exitosamente.',
            comment: updatedComment,
        });
    } catch (error) {
        console.error('Error en updateComment:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.',
        });
    }
};

/* =========================
   DELETE COMMENT
   Solo el autor puede eliminar su propio comentario
   (Soft delete)
   ========================= */
export const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;

        const comment = await Comment.findOne({ _id: commentId, status: 'active' });

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comentario no encontrado.',
            });
        }

        // Verificar que el usuario es el autor
        if (comment.author.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para eliminar este comentario.',
            });
        }

        await Comment.findByIdAndUpdate(commentId, { status: 'deleted' });

        return res.status(200).json({
            success: true,
            message: 'Comentario eliminado exitosamente.',
        });
    } catch (error) {
        console.error('Error en deleteComment:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.',
        });
    }
};

/* =========================
   GET MY COMMENTS
   Historial de comentarios del usuario autenticado
   ========================= */
export const getMyComments = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = { author: req.userId, status: 'active' };

        const [comments, total] = await Promise.all([
            Comment.find(filter)
                .populate('publication', 'title category')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Comment.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            comments,
        });
    } catch (error) {
        console.error('Error en getMyComments:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.',
        });
    }
};
