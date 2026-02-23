import argon2 from 'argon2';
import { config } from '../configs/configs.js';

export const hashPassword = async (password) => {
    try {
        return await argon2.hash(password, {
            type: argon2.argon2id,
            memoryCost: 65536,  // 64 MB
            timeCost: 3,
            parallelism: 4,
            hashLength: 32,
            saltLength: 16,
        });
    } catch (error) {
        throw new Error('Error al hashear la contraseña');
    }
};

export const verifyPassword = async (hashedPassword, plainPassword) => {
    try {
        return await argon2.verify(hashedPassword, plainPassword);
    } catch (error) {
        console.error('Error verificando contraseña:', error.message);
        return false;
    }
};

export const validatePasswordStrength = (password) => {
    const errors = [];

    if (password.length < config.security.passwordMinLength) {
        errors.push(`La contraseña debe tener al menos ${config.security.passwordMinLength} caracteres`);
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('La contraseña debe tener al menos una letra mayúscula');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('La contraseña debe tener al menos una letra minúscula');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('La contraseña debe tener al menos un número');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};
