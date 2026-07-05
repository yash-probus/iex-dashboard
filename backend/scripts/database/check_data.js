"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function run() {
    console.log(await prisma.$queryRawUnsafe("SELECT * FROM prolt_energy.ists_charges LIMIT 1"));
}
run().finally(() => prisma.$disconnect());
