"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database...');
    const username = process.env.ADMIN_USERNAME || 'admin';
    const email = process.env.ADMIN_EMAIL || 'admin@iexdashboard.local';
    const password = process.env.ADMIN_PASSWORD || 'securepassword';
    // 1. Check if admin exists
    const existingAdmin = await prisma.admin.findUnique({
        where: { username },
    });
    if (existingAdmin) {
        console.log(`Admin user '${username}' already exists. Skipping seed to prevent password overwrite.`);
        return;
    }
    // 2. Hash the password
    const salt = await bcryptjs_1.default.genSalt(12);
    const passwordHash = await bcryptjs_1.default.hash(password, salt);
    // 3. Create admin
    const admin = await prisma.admin.create({
        data: {
            username,
            email,
            passwordHash,
        },
    });
    console.log('Admin user seeded successfully:', admin.username);
}
main()
    .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
