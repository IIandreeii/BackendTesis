import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import Donation from '../models/donation.js'; // Asegúrate de ajustar la ruta según tu estructura de proyecto
import Charity from '../models/charity.js'; // Asegúrate de ajustar la ruta según tu estructura de proyecto

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
        const charity = await Charity.findById(charityId);
        if (!charity) {
            return res.status(404).json({ message: 'Organización benéfica no encontrada' });
        }

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

        // Añadir título
        worksheet.mergeCells('A1:E1');
        const titleRow = worksheet.getCell('A1');
        titleRow.value = `Reporte de Donaciones (${period})`;
        titleRow.font = { size: 16, bold: true };
        titleRow.alignment = { vertical: 'middle', horizontal: 'center' };

        // Añadir nombre de la organización
        worksheet.mergeCells('A2:E2');
        const orgRow = worksheet.getCell('A2');
        orgRow.value = `Organización: ${charity.name}`;
        orgRow.font = { size: 14, bold: true };
        orgRow.alignment = { vertical: 'middle', horizontal: 'center' };

        // Añadir encabezados con estilo
        worksheet.addRow([]);
        const headerRow = worksheet.addRow(['Donante', 'Monto', 'Estado', 'Método de Pago', 'Fecha de Pago']);
        headerRow.eachCell((cell, colNumber) => {
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '4F81BD' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // Añadir filas con estilo
        donations.forEach((donation, index) => {
            const row = worksheet.addRow([
                donation.donorName,
                donation.amount,
                donation.paymentStatus,
                donation.paymentMethod,
                new Date(donation.createdAt).toLocaleString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            ]);

            // Alternar color de fondo para las filas
            if (index % 2 === 0) {
                row.eachCell({ includeEmpty: true }, (cell) => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'D9EAD3' }
                    };
                });
            }

            // Centrar el contenido de las celdas
            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });
        });

        // Ajustar el ancho de las columnas
        worksheet.columns.forEach(column => {
            column.width = column.header.length < 20 ? 20 : column.header.length;
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