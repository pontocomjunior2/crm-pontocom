const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log("Checking order 209cf5da-e7c3-4aad-97ad-bd0699fb1b1d...");
    try {
        const order = await prisma.order.findUnique({
            where: { id: "209cf5da-e7c3-4aad-97ad-bd0699fb1b1d" },
            include: { locutorObj: true }
        });
        console.log("ORDER FOUND:", order);
        console.log("LOCUTOR ID:", order?.locutorId);
        console.log("LOCUTOR NAME:", order?.locutor);
        console.log("SUPPLIER ID:", order?.supplierId);
        console.log("SUPPLIER OBJ:", order?.supplier);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
