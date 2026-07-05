"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function run() {
    const res = await prisma.$queryRawUnsafe(`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname = 'state_ut_enum'`);
    console.log(res);
}
run().finally(() => prisma.$disconnect());
