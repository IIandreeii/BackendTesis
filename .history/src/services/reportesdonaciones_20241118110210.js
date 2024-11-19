import PDFDocument from 'pdfkit';
import mongoose from 'mongoose';
import Donation from '../models/donation.js'; // Asegúrate de ajustar la ruta según tu estructura de proyecto

export const generateReport = async (req, res, period) => {
    const { charityId } = req.params;
    if (!mongoose.isValidObjectId(charityId)) {
        return res.status(400).json({ message: 'ID de organización benéfica no válido' });
    }

    let startDate;
    const endDate = new Date();

    switch (period) {
        case 'weekly':
            startDate = new Date();
            startDate.setDate(endDate.getDate() - 7);
            break;
        case 'monthly':
            startDate = new Date();
            startDate.setMonth(endDate.getMonth() - 1);
            break;
        case 'annual':
            startDate = new Date();
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
        default:
            return res.status(400).json({ message: 'Periodo no válido' });
    }

    try {
        const donations = await Donation.find({
            charityId: charityId,
            createdAt: { $gte: startDate, $lte: endDate }
        });

        if (!donations.length) {
            return res.status(404).json({ message: 'No se encontraron donaciones para este periodo' });
        }

        // Crear un nuevo documento PDF en formato vertical
        const doc = new PDFDocument({ size: 'A4', margin: 30 });
        let filename = `reporte_${period}_${charityId}.pdf`;
        filename = encodeURIComponent(filename);
        
        // Configurar la respuesta para enviar el PDF
        res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
        res.setHeader('Content-type', 'application/pdf');

        // Estilo del documento
        doc.fontSize(20).text(`Reporte de Donaciones (${period})`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12);

        // Encabezados de la tabla
        doc.font('Helvetica-Bold');
        doc.fillColor('#000000');
        doc.text('Donante', 50, doc.y, { continued: true });
        doc.text('Monto', 150, doc.y, { continued: true });
        doc.text('Estado', 250, doc.y, { continued: true });
        doc.text('Método de Pago', 350, doc.y, { continued: true });
        doc.text('Fecha de Pago', 450, doc.y);
        doc.moveDown();

        // Línea separadora
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Contenido de la tabla
        doc.font('Helvetica');
        donations.forEach(donation => {
            doc.text(donation.donorName, 50, doc.y, { continued: true });
            doc.text(donation.amount, 150, doc.y, { continued: true });
            doc.text(donation.paymentStatus, 250, doc.y, { continued: true });
            doc.text(donation.paymentMethod, 350, doc.y, { continued: true });
            doc.text(new Date(donation.createdAt).toLocaleString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }), 450, doc.y);
            doc.moveDown();

            // Línea separadora
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();
        });

        // Finalizar el documento y enviarlo
        doc.pipe(res);
        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Error al generar el reporte: ${error.message}` });
    }
};