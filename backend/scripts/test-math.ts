import { SavingsCalculatorService } from '../src/modules/savings-calculator/savings-calculator.service';

function compute(energy: number, demandCharge: number, fppaPercent: number, edPercent: number) {
  const energyWithFppa = energy * (1 + fppaPercent / 100);
  const ed = (energyWithFppa + demandCharge) * edPercent;
  const total = energyWithFppa + demandCharge + ed;
  return total;
}

// Bill's exact base energy (calculated manually): 2493855.75
const billBaseEnergy = 2493855.75;
const demand = 280000;
const edPercent = 0.075;

console.log("With FPPA 5.56%:");
console.log(compute(billBaseEnergy, demand, 5.56, edPercent));

