import * as fs from 'fs';

const filePath = '/Users/yashgupta/IEX-Dashboard/backend/src/modules/savings-calculator/savings-calculator.service.ts';
let code = fs.readFileSync(filePath, 'utf8');

// Replace potentially null fields with guaranteed numbers or Infinity fallback
code = code.replace(/slot\.rtmLanding/g, '(slot.rtmLanding || Infinity)');
// Except on the left side of assignments!
// Wait, `prevSlot.bestMarketLanding = prevSlot.rtmLanding;` is an assignment!
// The left side `prevSlot.rtmLanding` is NOT an assignment, it is right side.
// Wait, what if I just use `(slot.rtmLanding as number)`?
// A better way is to replace specific blocks.
