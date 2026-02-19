const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- FIXING 0.00 CACHE VALUES FOR OFFs Brasil ---\n');

    const supplierId = '024bba63-2c4e-47e7-8873-91922b7929f9';

    // 1. Get the reference package for cost
    const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
        include: {
            packages: {
                where: { price: { gt: 0 } },
                orderBy: { purchaseDate: 'desc' },
                take: 1
            }
        }
    });

    if (!supplier || supplier.packages.length === 0) {
        console.log('No valid package found for OFFs Brasil');
        return;
    }

    const costPerCredit = parseFloat(supplier.packages[0].costPerCredit);
    console.log(`Reference Cost Per Credit: ${costPerCredit}`);

    // 2. Find all orders for this supplier with cacheValor 0 or null
    const allSupplierOrders = await prisma.order.findMany({
        where: { supplierId: supplierId }
    });

    const ordersToFix = allSupplierOrders.filter(o =>
        o.cacheValor === null ||
        parseFloat(o.cacheValor) === 0 ||
        isNaN(parseFloat(o.cacheValor))
    );

    console.log(`Found ${ordersToFix.length} orders to fix out of ${allSupplierOrders.length} supplier orders.`);


    let fixedCount = 0;
    for (const order of ordersToFix) {
        const credits = order.creditsConsumedSupplier || 1;
        const newCache = credits * costPerCredit;

        if (newCache > 0) {
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    cacheValor: newCache,
                    costPerCreditSnapshot: costPerCredit
                }
            });
            fixedCount++;
        }
    }

    console.log(`\nSuccessfully fixed ${fixedCount} orders.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
