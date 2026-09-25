const fs = require('fs');

const tp = fs.readFileSync('backend/src/modules/trader-performance/trader-performance.service.ts', 'utf8');
const sc = fs.readFileSync('backend/src/modules/savings-calculator/savings-calculator.service.ts', 'utf8');

function extractMethod(content, methodRegex) {
  const match = content.match(methodRegex);
  if (!match) return '';
  let startIndex = match.index;
  let braceCount = 0;
  let i = content.indexOf('{', startIndex);
  if (i === -1) return '';
  braceCount = 1;
  i++;
  while (i < content.length && braceCount > 0) {
    if (content[i] === '{') braceCount++;
    if (content[i] === '}') braceCount--;
    i++;
  }
  return content.substring(startIndex, i);
}

const tpMethod = extractMethod(tp, /calculateMarketDecision\(.*?\)/);
const scMethod = extractMethod(sc, /calculateSavings\(.*?\)/);

const tpBaseline = tpMethod.match(/totalBaselineCost \+= [^;]+;/g);
const scBaseline = scMethod.match(/totalBaselineCost \+= [^;]+;/g);

console.log('Trader Performance Baseline:\n', tpBaseline);
console.log('Savings Calculator Baseline:\n', scBaseline);
