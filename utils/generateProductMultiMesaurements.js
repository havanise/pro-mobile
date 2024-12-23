export const generateProductMultiMesaurements = (productMesaurements,product) => [
    {
        id: productMesaurements?.unitOfMeasurementId,
        unitOfMeasurementName: productMesaurements?.unitOfMeasurementName,
        coefficient: 1,
        coefficientRelativeToMain: 1,
        barcode: product?.barcode,
    },
    ...(productMesaurements?.unitOfMeasurements?.map(unit => ({
        ...unit,
        id: unit.unitOfMeasurementId,
    })) ?? []),
];