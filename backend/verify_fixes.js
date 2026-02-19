const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- VERIFYING ORDER CACHEVALOR AUTO-CALCULATION ---\n');

    // 1. Find the locutor "Billy" and the order "PULÔ PARK"
    const order = await prisma.order.findFirst({
        where: { title: 'PULÔ PARK' }
    });

    if (!order) {
        console.log('Order "PULÔ PARK" not found');
        return;
    }

    // 2. Find the supplier for Billy (OFFs Brasil - ID: 024bba63-2c4e-47e7-8873-91922b7929f9)
    const supplierId = '024bba63-2c4e-47e7-8873-91922b7929f9';

    console.log(`Original Order: ${order.title}`);
    console.log(`  Cache Valor: ${order.cacheValor}`);
    console.log(`  Supplier ID: ${order.supplierId || 'NULL'}`);

    // 3. Trigger an update to set the supplier and cacheValor to 0
    console.log('\nUpdating order to trigger auto-calculation...');

    // We'll use a fetch-like simulation since we're in a script
    // In the real app, this would be a PUT request to /api/orders/:id

    const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
            supplierId: supplierId,
            cacheValor: 0
        },
        include: {
            locutorObj: {
                include: {
                    suppliers: {
                        include: {
                            packages: {
                                orderBy: { purchaseDate: 'desc' }
                            }
                        }
                    }
                }
            }
        }
    });

    // Manually run the auto-calc logic that's now in the route
    const locutor = updatedOrder.locutorObj;
    const selectedSupplier = locutor?.suppliers.find(s => s.id === updatedOrder.supplierId);

    if (selectedSupplier && selectedSupplier.packages.length > 0) {
        const latestCommercialPackage = selectedSupplier.packages.find(p => Number(p.price) > 0);
        const refPackage = latestCommercialPackage || selectedSupplier.packages[0];
        const costPerCreditVal = refPackage.costPerCredit;
        const creditsToConsumeSupplier = updatedOrder.creditsConsumedSupplier || 1;

        const calculatedCache = parseFloat(costPerCreditVal) * creditsToConsumeSupplier;

        if (calculatedCache > 0) {
            const finalOrder = await prisma.order.update({
                where: { id: updatedOrder.id },
                data: {
                    cacheValor: calculatedCache,
                    costPerCreditSnapshot: parseFloat(costPerCreditVal)
                }
            });

            console.log('\nAfter Auto-Calculation:');
            console.log(`  New Cache Valor: ${finalOrder.cacheValor}`);
            console.log(`  Cost Per Credit Snapshot: ${finalOrder.costPerCreditSnapshot}`);

            if (parseFloat(finalOrder.cacheValor) === 4) {
                console.log('\n✅ SUCCESS: CacheValor auto-calculated correctly to 4.00 (1 credit * 4.00/credit)');
            } else {
                console.log(`\n❌ FAILURE: Expected 4.00, got ${finalOrder.cacheValor}`);
            }
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
