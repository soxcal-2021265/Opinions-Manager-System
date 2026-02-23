import { User } from './user.model.js';
import { hashPassword, verifyPassword } from '../../utils/password-utils.js';

/* =========================
   GET PROFILE
   ========================= */
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado.',
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                surname: user.surname,
                username: user.username,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error('Error en getProfile:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.',
        });
    }
};

/* =========================
   UPDATE PROFILE
   No se permite eliminar perfiles.
   Solo editar nombre, apellido o username.
   ========================= */
export const updateProfile = async (req, res) => {
    try {
        const { name, surname, username } = req.body;
        const updateData = {};

        if (name) updateData.name = name;
        if (surname) updateData.surname = surname;

        // Si se quiere cambiar username, verificar que no exista
        if (username) {
            const usernameExists = await User.findOne({
                username: username.toLowerCase(),
                _id: { $ne: req.userId },
            });

            if (usernameExists) {
                return res.status(409).json({
                    success: false,
                    message: 'El nombre de usuario ya está en uso.',
                });
            }
            updateData.username = username.toLowerCase();
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionaron datos para actualizar.',
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.userId,
            updateData,
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Perfil actualizado exitosamente.',
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                surname: updatedUser.surname,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
            },
        });
    } catch (error) {
        console.error('Error en updateProfile:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.',
        });
    }
};

/* =========================
   CHANGE PASSWORD
   Requiere contraseña actual para confirmar identidad
   ========================= */
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Obtener usuario con contraseña
        const user = await User.findById(req.userId).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado.',
            });
        }

        // Verificar contraseña actual
        const isValid = await verifyPassword(user.password, currentPassword);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'La contraseña actual es incorrecta.',
            });
        }

        // Verificar que la nueva contraseña sea diferente a la actual
        const isSamePassword = await verifyPassword(user.password, newPassword);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'La nueva contraseña no puede ser igual a la actual.',
            });
        }

        const hashedNewPassword = await hashPassword(newPassword);

        await User.findByIdAndUpdate(req.userId, { password: hashedNewPassword });

        return res.status(200).json({
            success: true,
            message: 'Contraseña actualizada exitosamente.',
        });
    } catch (error) {
        console.error('Error en changePassword:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.',
        });
    }
};
