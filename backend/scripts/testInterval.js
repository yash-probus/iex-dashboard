"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const dr = await prisma.damRecord.findFirst();
    console.log("DamRecord intervalTime:", dr?.intervalTime);
    const gr = await prisma.gdamRecord.findFirst();
    console.log("GdamRecord intervalTime:", gr?.intervalTime);
}
main().catch(console.error).finally(() => prisma.$disconnect());
