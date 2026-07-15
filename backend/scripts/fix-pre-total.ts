import * as fs from 'fs';

const filePath = '/Users/yashgupta/IEX-Dashboard/backend/src/modules/savings-calculator/savings-calculator.service.ts';
let code = fs.readFileSync(filePath, 'utf8');

const regexToRemove = /    let preTotalEnergyKwh = 0;[\s\S]*?    Object\.keys\(slotsByTod\)\.forEach\(groupKey => \{[\s\S]*?      const matchedKey = Object\.keys\(monthConsumptions\)\.find\(k => \{[\s\S]*?        if \(k\.toLowerCase\(\)\.includes\('peak demand'\) \|\| k\.toLowerCase\(\)\.includes\('sanctioned'\)\) return false;[\s\S]*?        return k\.toUpperCase\(\)\.includes\(groupKey\) \|\| k\.toUpperCase\(\) === groupKey;[\s\S]*?      \}\);[\s\S]*?      if \(matchedKey && monthConsumptions\[matchedKey\] !== undefined && monthConsumptions\[matchedKey\] !== ''\) \{[\s\S]*?        preTotalEnergyKwh \+= Number\(monthConsumptions\[matchedKey\]\);[\s\S]*?      \}[\s\S]*?    \}\);[\s\S]*?    Object\.keys\(slotsByTod\)\.forEach\(groupKey => \{/g;

// Instead of regex, I'll just remove the specific block at line 342 and insert it at line 716
code = code.replace(regexToRemove, '    Object.keys(slotsByTod).forEach(groupKey => {');

const targetStr = `    console.log(\`[MarketDecision] monthKey=\${monthKey}, consumptionKeys=\${JSON.stringify(Object.keys(monthConsumptions))}, todGroups=\${JSON.stringify(Object.keys(slotsByTod))}\`);

    Object.keys(slotsByTod).forEach(groupKey => {`;

const insertStr = `    console.log(\`[MarketDecision] monthKey=\${monthKey}, consumptionKeys=\${JSON.stringify(Object.keys(monthConsumptions))}, todGroups=\${JSON.stringify(Object.keys(slotsByTod))}\`);

    let preTotalEnergyKwh = 0;
    Object.keys(slotsByTod).forEach(groupKey => {
      const matchedKey = Object.keys(monthConsumptions).find(k => {
        if (k.toLowerCase().includes('peak demand') || k.toLowerCase().includes('sanctioned')) return false;
        return k.toUpperCase().includes(groupKey) || k.toUpperCase() === groupKey;
      });
      if (matchedKey && monthConsumptions[matchedKey] !== undefined && monthConsumptions[matchedKey] !== '') {
        preTotalEnergyKwh += Number(monthConsumptions[matchedKey]);
      }
    });

    Object.keys(slotsByTod).forEach(groupKey => {`;

code = code.replace(targetStr, insertStr);
fs.writeFileSync(filePath, code);
console.log('Fixed preTotalEnergyKwh scoping!');
