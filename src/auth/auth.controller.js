import { User } from '../user/user.model.js';
import { hashPassword, verifyPassword } from '../../utils/password-utils.js';
import { generateJWT, generateVerificationToken, verifyVerificationToken } from '../../helpers/generate-jwt.js';
import { sendVerificationEmail, sendWelcomeEmail } from '../../helpers/email-service.js';

/* =========================
   REGISTER
   ========================= */
export const register = async (req, res) => {
    try {
        const { name, surname, username, email, password } = req.body;

        // Verificar si ya existe el email o username
        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: username.toLowerCase() },
            ],
        });

        if (existingUser) {
            const field = existingUser.email === email.toLowerCase() ? 'correo electrónico' : 'nombre de usuario';
            return res.status(409).json({
                success: false,
                message: `El ${field} ya está registrado.`,
            });
        }

        const hashedPassword = await hashPassword(password);

        const user = await User.create({
            name,
            surname,
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password: hashedPassword,
            status: false,
            emailVerified: false,
        });

        // Generar token de verificación de email
        const verificationToken = await generateVerificationToken(user._id, 'EMAIL_VERIFICATION');

        await User.findByIdAndUpdate(user._id, {
            emailVerificationToken: verificationToken,
            emailVerificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        // Enviar email de verificación de forma asíncrona
        sendVerificationEmail(user.email, user.name, verificationToken)
            .then(() => console.log(`Email de verificación enviado a: ${user.email}`))
            .catch((err) => console.error('Error enviando email:', err.message));

        return res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente. Por favor verifica tu correo para activar tu cuenta.',
            user: {
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('Error en register:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al registrar el usuario.',
        });
    }
};

/* =========================
   LOGIN
   ========================= */
export const login = async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;

        // Buscar por email o username, incluyendo contraseña
        const user = await User.findOne({
            $or: [
                { email: emailOrUsername.toLowerCase() },
                { username: emailOrUsername.toLowerCase() },
            ],
        }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas.',
            });
        }

        // Verificar si el email fue verificado
        if (!user.emailVerified) {
            return res.status(403).json({
                success: false,
                message: 'Correo no verificado. Por favor revisa tu bandeja de entrada.',
            });
        }

        // Verificar si la cuenta está activa
        if (!user.status) {
            return res.status(403).json({
                success: false,
                message: 'Cuenta desactivada. Contacta al administrador.',
            });
        }

        // Verificar contraseña
        const isValidPassword = await verifyPassword(user.password, password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas.',
            });
        }

        // Generar JWT
        const token = await generateJWT(user._id.toString(), { role: user.role });

        return res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso.',
            token,
            user: {
                id: user._id,
                name: user.name,
                surname: user.surname,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al iniciar sesión.',
        });
    }
};

/* =========================
   VERIFY EMAIL
   ========================= */
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        // Verificar el token JWT
        let decoded;
        try {
            decoded = await verifyVerificationToken(token);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: 'Token de verificación inválido o expirado.',
            });
        }

        if (decoded.type !== 'EMAIL_VERIFICATION') {
            return res.status(400).json({
                success: false,
                message: 'Token no válido para verificación de email.',
            });
        }

        // Buscar el usuario con el token
        const user = await User.findOne({
            _id: decoded.sub,
            emailVerificationToken: token,
            emailVerificationTokenExpiry: { $gt: new Date() },
        }).select('+emailVerificationToken +emailVerificationTokenExpiry');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Token inválido o expirado. Por favor solicita un nuevo correo de verificación.',
            });
        }

        if (user.emailVerified) {
            return res.status(200).json({
                success: true,
                message: 'El correo ya fue verificado anteriormente.',
            });
        }

        // Activar la cuenta
        await User.findByIdAndUpdate(user._id, {
            emailVerified: true,
            status: true,
            emailVerificationToken: null,
            emailVerificationTokenExpiry: null,
        });

        // Enviar email de bienvenida
        sendWelcomeEmail(user.email, user.name)
            .catch((err) => console.error('Error enviando email de bienvenida:', err.message));

        return res.status(200).json({
            success: true,
            message: '¡Correo verificado exitosamente! Tu cuenta ha sido activada.',
        });
    } catch (error) {
        console.error('Error en verifyEmail:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al verificar el email.',
        });
    }
};

/* =========================
   RESEND VERIFICATION
   ========================= */
export const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() })
            .select('+emailVerificationToken +emailVerificationTokenExpiry');

        if (!user) {
            // Respuesta genérica por seguridad
            return res.status(200).json({
                success: true,
                message: 'Si el correo está registrado, recibirás un nuevo email de verificación.',
            });
        }

        if (user.emailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Este correo ya fue verificado.',
            });
        }

        const verificationToken = await generateVerificationToken(user._id, 'EMAIL_VERIFICATION');

        await User.findByIdAndUpdate(user._id, {
            emailVerificationToken: verificationToken,
            emailVerificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        sendVerificationEmail(user.email, user.name, verificationToken)
            .then(() => console.log(`Email de verificación reenviado a: ${user.email}`))
            .catch((err) => console.error('Error reenviando email:', err.message));

        return res.status(200).json({
            success: true,
            message: 'Si el correo está registrado, recibirás un nuevo email de verificación.',
        });
    } catch (error) {
        console.error('Error en resendVerification:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.',
        });
    }
};
