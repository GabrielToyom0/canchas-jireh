import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporte = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
});

interface CorreoSaliente {
  para: string;
  asunto: string;
  html: string;
  texto: string;
}

export async function enviarCorreo(correo: CorreoSaliente): Promise<void> {
  await transporte.sendMail({
    from: env.CORREO_REMITENTE,
    to: correo.para,
    subject: correo.asunto,
    html: correo.html,
    text: correo.texto,
  });
}
