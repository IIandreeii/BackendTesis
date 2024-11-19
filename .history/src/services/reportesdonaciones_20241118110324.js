import ExcelJS from 'exceljs';
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

        // Crear un nuevo libro de Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Reporte de Donaciones');

        // Añadir encabezados
        worksheet.columns = [
            { header: 'Donante', key: 'donorName', width: 30 },
            { header: 'Monto', key: 'amount', width: 15 },
            { header: 'Estado', key: 'paymentStatus', width: 15 },
            { header: 'Método de Pago', key: 'paymentMethod', width: 20 },
            { header: 'Fecha de Pago', key: 'createdAt', width: 30 }
        ];

        // Añadir filas
        donations.forEach(donation => {
            worksheet.addRow({
                donorName: donation.donorName,
                amount: donation.amount,
                paymentStatus: donation.paymentStatus,
                paymentMethod: donation.paymentMethod,
                createdAt: new Date(donation.createdAt).toLocaleString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            });
        });

        // Configurar la respuesta para enviar el archivo Excel
        res.setHeader('Content-disposition', 'attachment; filename=reporte_donaciones.xlsx');
        res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Enviar el archivo Excel
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Error al generar el reporte: ${error.message}` });
    }
};