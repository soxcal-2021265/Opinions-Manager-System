import nodemailer from 'nodemailer';
import { config } from '../configs/configs.js';

const createTransporter = () => {
    if (!config.smtp.username || !config.smtp.password) {
        console.warn('SMTP no configurado. El envío de emails no funcionará.');
        return null;
    }

    return nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.enableSsl,
        auth: {
            user: config.smtp.username,
            pass: config.smtp.password,
        },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 10_000,
        tls: { rejectUnauthorized: false },
    });
};

const transporter = createTransporter();

/* ============================================================
   EMAIL DE VERIFICACIÓN
   ============================================================ */
export const sendVerificationEmail = async (email, name, verificationToken) => {
    if (!transporter) throw new Error('Transporter SMTP no configurado');

    const verificationUrl = `${config.app.frontendUrl}/auth/verify-email?token=${verificationToken}`;

    const mailOptions = {
        from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
        to: email,
        subject: 'Verifica tu correo electrónico - Opinions System',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e4e4e4; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">Opinions System</h1>
                </div>
                <div style="padding: 30px; color: #333; line-height: 1.6;">
                    <h2 style="color: #4f46e5;">¡Bienvenido, ${name}!</h2>
                    <p>Para activar tu cuenta, verifica tu correo electrónico haciendo clic en el siguiente botón:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Verificar Email
                        </a>
                    </div>
                    <p>Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:</p>
                    <p style="word-break: break-all; color: #4f46e5;">${verificationUrl}</p>
                    <p>Este enlace expirará en 24 horas.</p>
                    <p>Si no creaste una cuenta, ignora este correo.</p>
                </div>
                <div style="background-color: #f5f5f5; color: #777; padding: 15px; text-align: center; font-size: 12px;">
                    © ${new Date().getFullYear()} Opinions System. Todos los derechos reservados.
                </div>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

/* ============================================================
   EMAIL DE BIENVENIDA
   ============================================================ */
export const sendWelcomeEmail = async (email, name) => {
    if (!transporter) return;

    const mailOptions = {
        from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
        to: email,
        subject: '¡Cuenta activada! - Opinions System',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">Opinions System</h1>
                </div>
                <div style="padding: 30px; color: #333;">
                    <h2 style="color: #4f46e5;">¡Cuenta activada, ${name}!</h2>
                    <p>Tu cuenta ha sido verificada y activada exitosamente. Ya puedes compartir tus opiniones.</p>
                    <p>¡Bienvenido a la comunidad!</p>
                </div>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};
