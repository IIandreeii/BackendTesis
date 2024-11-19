import ExcelJS from 'exceljs';
import DonationProducts from '../models/donationproducts.js'; // Asegúrate de ajustar la ruta según tu estructura de proyecto

export const generateExcelReport = async (charityId, period, res) => {
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
        const donationsInKind = await DonationProducts.find({
            charityId: charityId,
            createdAt: { $gte: startDate, $lte: endDate }
        });

        if (!donationsInKind.length) {
            return res.status(404).json({ message: 'No se encontraron donaciones en especie para este periodo' });
        }

        // Crear un nuevo libro de Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Reporte de Donaciones en Especie');

        // Añadir título
        worksheet.mergeCells('A1:F1');
        const titleRow = worksheet.getCell('A1');
        titleRow.value = `Reporte de Donaciones en Especie (${period})`;
        titleRow.font = { size: 16, bold: true };
        titleRow.alignment = { vertical: 'middle', horizontal: 'center' };

        // Añadir encabezados con estilo
        worksheet.addRow([]);
        const headerRow = worksheet.addRow(['Donante', 'Tipo de Producto', 'Cantidad', 'Unidad', 'Valor por Unidad', 'Valor Total']);
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
        donationsInKind.forEach((donation, index) => {
            const row = worksheet.addRow([
                donation.donorName,
                donation.itemType,
                donation.quantity,
                donation.unit,
                donation.valuePerUnit,
                donation.quantity * donation.valuePerUnit
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
        res.setHeader('Content-disposition', `attachment; filename=reporte_donaciones_especie_${period}.xlsx`);
        res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Enviar el archivo Excel
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Error al generar el reporte: ${error.message}` });
    }
};