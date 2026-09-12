import re
import os

files = [
    '/Users/yashgupta/IEX-Dashboard/backend/src/modules/savings-calculator-new/savings-calculator-new.service.ts',
    '/Users/yashgupta/IEX-Dashboard/backend/src/modules/savings-calculator/savings-calculator.service.ts',
    '/Users/yashgupta/IEX-Dashboard/backend/src/modules/trader-performance/trader-performance.service.ts'
]

for file in files:
    with open(file, 'r') as f:
        content = f.read()

    # Find the preTotalEnergyKwh declaration to inject the variables
    if "const isKvahBilling =" not in content:
        injection = """
    // Determine if billing is kVAh based on the first tariff
    const entryMonth = new Date(startStr).getMonth() + 1;
    let baseTariff = null;
    if (tariffs && tariffs.length > 0) {
      let tariffsForMonth = tariffs.filter((t: any) => t.month === entryMonth);
      if (tariffsForMonth.length === 0) tariffsForMonth = tariffs;
      baseTariff = tariffsForMonth.find((t: any) => !t.todStartTime || t.todStartTime === '—' || !t.todEndTime || t.todEndTime === '—') || tariffsForMonth[0];
    }
    const isKvahBilling = baseTariff && String(baseTariff.baseEnergyUnit || '').toLowerCase() === 'kvah';
    const globalPf = Number(entry.powerFactor) || 0.99;
    
    let preTotalEnergyKwh = 0;"""
        content = content.replace("let preTotalEnergyKwh = 0;", injection)

    # We must patch slabConsumption in all three loops!
    # These three assignments occur EXACTLY in the loops AFTER `preTotalEnergyKwh = 0`
    
    content = content.replace("slabConsumption = flatTotal * (slotsByTod[groupKey].length / totalSlotsInMonth);", "slabConsumption = flatTotal * (slotsByTod[groupKey].length / totalSlotsInMonth);\n            if (isKvahBilling) slabConsumption *= globalPf;")
    
    content = content.replace("slabConsumption = flatTotal * (slotsInGroup.length / totalSlotsInMonth);", "slabConsumption = flatTotal * (slotsInGroup.length / totalSlotsInMonth);\n            if (isKvahBilling) slabConsumption *= globalPf;")
    
    content = content.replace("slabConsumption = Number(monthConsumptions[matchedKey]);", "slabConsumption = Number(monthConsumptions[matchedKey]);\n          if (isKvahBilling) slabConsumption *= globalPf;")

    with open(file, 'w') as f:
        f.write(content)

print("Patched!")
