import { Publication } from './publication.model.js';
import { Comment } from '../comments/comment.model.js';

/* =========================
   CREATE PUBLICATION
   ========================= */
export const createPublication = async (req, res) => {
    try {
        const { title, category, content } = req.body;

        const publication = await Publication.create({
            title,
            category,
            content,
            author: req.userId,
        });

        await publication.populate('author', 'name surname username');

        return res.status(201).json({
            success: true,
            message: 'Publicación creada exitosamente.',
            publication,
        });
    } catch (error) {
        console.error('Error en createPublication:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al crear la publicación.',
        });
    }
};

/* =========================
   GET ALL PUBLICATIONS
   Lista todas las publicaciones activas con paginación
   ========================= */
export const getPublications = async (req, res) => {
    try {
        const { page = 1, limit = 10, category } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = { status: 'active' };
        if (category) filter.category = category;

        const [publications, total] = await Promise.all([
            Publication.find(filter)
                .populate('author', 'name surname username')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Publication.countDocuments(filter),
        ]);

        // Agregar comentarios activos a cada publicación
        const publicationsWithComments = await Promise.all(
            publications.map(async (pub) => {
                const comments = await Comment.find({ publication: pub._id, status: 'active' })
                    .populate('author', 'name surname username')
                    .sort({ createdAt: 1 });
                return {
                    ...pub.toObject(),
                    comments,
                    totalComments: comments.length,
                };
            })
        );

        return res.status(200).json({
            success: true,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            publications: publicationsWithComments,
        });
    } catch (error) {
        console.error('Error en getPublications:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.',
        });
    }
};

/* =========================
   GET PUBLICATION BY ID
   ========================= */
export const getPublicationById = async (req, res) => {
    try {
        const { id } = req.params;

        const publication = await Publication.findOne({ _id: id, status: 'active' })
            .populate('author', 'name surname username');

        if (!publication) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada.',
            });
        }

        // Obtener comentarios activos de esta publicación
        const comments = await Comment.find({ publication: id, status: 'active' })
            .populate('author', 'name surname username')
            .sort({ createdAt: 1 });

        return res.status(200).json({
            success: true,
            publication,
            comments,
            totalComments: comments.length,
        });
    } catch (error) {
        console.error('Error en getPublicationById:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.',
        });
    }
};

/* =========================
   UPDATE PUBLICATION
   Solo el autor puede editar su propia publicación
   ========================= */
export const updatePublication = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, category, content } = req.body;

        const publication = await Publication.findOne({ _id: id, status: 'active' });

        if (!publication) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada.',
            });
        }

        // Verificar que el usuario es el autor
        if (publication.author.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para editar esta publicación.',
            });
        }

        const updateData = {};
        if (title) updateData.title = title;
        if (category) updateData.category = category;
        if (content) updateData.content = content;

        const updatedPublication = await Publication.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('author', 'name surname username');

        return res.status(200).json({
            success: true,
            message: 'Publicación actualizada exitosamente.',
            publication: updatedPublication,
        });
    } catch (error) {
        console.error('Error en updatePublication:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.',
        });
    }
};

/* =========================
   DELETE PUBLICATION
   Solo el autor puede eliminar su propia publicación
   (Soft delete: cambia status a 'deleted')
   ========================= */
export const deletePublication = async (req, res) => {
    try {
        const { id } = req.params;

        const publication = await Publication.findOne({ _id: id, status: 'active' });

        if (!publication) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada.',
            });
        }

        // Verificar que el usuario es el autor
        if (publication.author.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para eliminar esta publicación.',
            });
        }

        // Soft delete de la publicación y sus comentarios
        await Promise.all([
            Publication.findByIdAndUpdate(id, { status: 'deleted' }),
            Comment.updateMany({ publication: id }, { status: 'deleted' }),
        ]);

        return res.status(200).json({
            success: true,
            message: 'Publicación eliminada exitosamente.',
        });
    } catch (error) {
        console.error('Error en deletePublication:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.',
        });
    }
};

/* =========================
   GET MY PUBLICATIONS
   Lista las publicaciones del usuario autenticado
   ========================= */
export const getMyPublications = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = { author: req.userId, status: 'active' };

        const [publications, total] = await Promise.all([
            Publication.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Publication.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            publications,
        });
    } catch (error) {
        console.error('Error en getMyPublications:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.',
        });
    }
};