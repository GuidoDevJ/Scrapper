import fs from 'fs';
import nodemailer from 'nodemailer';
import path from 'path';
import PDFDocument from 'pdfkit';

import { envs } from '../config';
export const sendEmail = async (data: any[], numberOfAcounts: number) => {
  try {
    // Crear el PDF
    const doc = new PDFDocument();
    const pdfPath = path.join(__dirname, 'report.pdf');

    doc.pipe(fs.createWriteStream(pdfPath));

    // Añadir contenido al PDF
    doc.fontSize(14).text('Tabla de Datos de Instagram', { align: 'center' });
    doc.moveDown();

    // Crear la tabla
    const table = {
      headers: ['Link', 'Title', 'Comments', 'Date', 'Likes', 'Instagram'],
      rows: data.map((item) => [
        item.link,
        item.title,
        item.numberOfComments.toString(),
        new Date(item.datePost).toLocaleDateString(),
        item.likes.toString(),
        item.insta,
      ]),
    };

    // Dibujar la tabla
    const startX = 50;
    const startY = 100;
    const rowHeight = 30;
    const colWidth = 100;

    // Dibujar encabezados
    doc.font('Helvetica-Bold');
    table.headers.forEach((header, i) => {
      doc.text(header, startX + i * colWidth, startY, {
        width: colWidth,
        align: 'left',
      });
    });

    // Dibujar filas
    doc.font('Helvetica');
    table.rows.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        doc.text(
          cell,
          startX + colIndex * colWidth,
          startY + (rowIndex + 1) * rowHeight,
          { width: colWidth, align: 'left' }
        );
      });
    });

    // Finalizar el PDF
    doc.end();

    const userEmail = envs.userEmail;
    // Configuración de nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: userEmail, // Cambiar por tu correo
        pass: envs.appPassword, // Contraseña o contraseña de aplicaciones
      },
    });
    const emailBoss = 'juanmazalazar@hotmail.com';
    const emailSlave = 'guidogauna@gmail.com';
    const mailOptions = {
      from: userEmail,
      to: `${emailBoss},${emailSlave}`, // Cambiar por el destinatario
      subject: 'Reporte de Publicaciones',
      text: `Se han analizado ${numberOfAcounts} cuentas. Adjunto encontrarás el reporte de publicaciones de Instagram.`,
      attachments: [
        {
          filename: 'report.pdf',
          path: pdfPath,
        },
      ],
    };

    // Enviar correo
    await transporter.sendMail(mailOptions);

    fs.unlinkSync(pdfPath); // Eliminar el PDF después de enviarlo
  } catch (error) {
    console.error('Error al enviar el correo:', error);
  }
};
