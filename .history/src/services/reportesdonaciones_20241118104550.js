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

        // Crear un nuevo documento PDF
        const doc = new PDFDocument();
        let filename = `reporte_${period}_${charityId}.pdf`;
        filename = encodeURIComponent(filename);
        
        // Configurar la respuesta para enviar el PDF
        res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
        res.setHeader('Content-type', 'application/pdf');

        // Escribir contenido en el PDF
        doc.text(`Reporte de Donaciones (${period})`, { align: 'center' });
        doc.moveDown();

        donations.forEach(donation => {
            doc.text(`Donación ID: ${donation._id}`);
            doc.text(`Cantidad: ${donation.amount}`);
            doc.text(`Fecha: ${donation.createdAt}`);
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