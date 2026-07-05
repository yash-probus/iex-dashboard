"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const username = 'admin';
    const newPassword = 'admin';
    const salt = await bcryptjs_1.default.genSalt(12);
    const passwordHash = await bcryptjs_1.default.hash(newPassword, salt);
    await prisma.admin.update({
        where: { username },
        data: { passwordHash }
    });
    console.log('Password updated successfully for admin.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
