const generateReport = async (req, res, period) => {
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

        // Aquí puedes generar el reporte en el formato que desees (por ejemplo, CSV, PDF, etc.)
        res.json(donations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Error al generar el reporte: ${error.message}` });
    }
};