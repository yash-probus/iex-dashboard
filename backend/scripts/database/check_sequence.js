"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function run() {
    console.log(await prisma.$queryRawUnsafe(`
    SELECT pg_get_serial_sequence('prolt_energy.ists_charges', 'id') as seq_name;
  `));
}
run().finally(() => prisma.$disconnect());
