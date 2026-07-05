"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const httpsAgent = new https_1.default.Agent({ rejectUnauthorized: false });
async function run() {
    const { data } = await axios_1.default.get('https://vidyutpravah.in/state-data/maharashtra', { httpsAgent });
    const match = data.match(/<span class="value_DemandMET_en[^>]*><span[^>]*>\s*([\d,]+)\s*&nbsp;MW<\/span>/);
    console.log('Maharashtra Demand:', match ? match[1] : 'Not found');
    fs_1.default.writeFileSync('scratch_vp_maharashtra.html', data);
    console.log('Saved to scratch_vp_maharashtra.html');
}
run();
