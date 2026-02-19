const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllZeroCosts() {
    try {
        console.log('Checking for orders with 0.00 cache value...');

        // Fetch orders with cacheValor 0 or near 0, but having supplier and package
        const zeroOrders = await prisma.order.findMany({
            where: {
                packageId: { not: null },
                cacheValor: { lte: 0.01 }
            },
            include: {
                supplier: {
                    include: {
                        packages: {
                            where: { price: { gt: 0 } },
                            orderBy: { purchaseDate: 'desc' },
                            take: 1
                        }
                    }
                }
            }
        });

        console.log(`Found ${zeroOrders.length} orders with zero/near-zero cost.`);

        zeroOrders.forEach(o => {
            console.log(`Order ID: ${o.id}, Supplier: ${o.supplier?.name || 'N/A'}, Locutor: ${o.locutor}, Pkgs: ${o.supplier?.packages?.length || 0}`);
        });

        const toFix = zeroOrders.filter(o => o.supplier && o.supplier.packages.length > 0);
        console.log(`${toFix.length} of these can be fixed using supplier commercial packages.`);

        for (const order of toFix) {
            const refPkg = order.supplier.packages[0];
            const costPerCredit = parseFloat(refPkg.costPerCredit);
            const credits = order.creditsConsumedSupplier || order.creditsConsumed || 1;
            const newCache = costPerCredit * credits;

            if (newCache > 0) {
                console.log(`Fixing Order ${order.id}: Supplier ${order.supplier.name}, Cost ${costPerCredit}, Credits ${credits} -> New Cache ${newCache}`);
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        cacheValor: newCache,
                        costPerCreditSnapshot: costPerCredit
                    }
                });
            }
        }

        console.log('Finished comprehensive fix.');
    } catch (error) {
        console.error('Error during check:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAllZeroCosts();
