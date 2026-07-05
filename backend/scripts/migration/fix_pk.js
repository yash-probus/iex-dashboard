"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function run() {
    console.log('Adding primary keys...');
    await prisma.$executeRawUnsafe(`ALTER TABLE prolt_energy.region_state ADD PRIMARY KEY (id);`).catch(e => console.log('region_state PK exists? ' + e.message));
    await prisma.$executeRawUnsafe(`ALTER TABLE prolt_energy.ists_charges ADD PRIMARY KEY (id);`).catch(e => console.log('ists_charges PK exists? ' + e.message));
    await prisma.$executeRawUnsafe(`ALTER TABLE prolt_energy.iex_fees ADD PRIMARY KEY (id);`).catch(e => console.log('iex_fees PK exists? ' + e.message));
    console.log('Done.');
}
run().finally(() => prisma.$disconnect());
