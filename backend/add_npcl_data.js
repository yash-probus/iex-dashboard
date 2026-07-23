const fs = require('fs');
const path = require('path');

const chargesFile = '/Users/yashgupta/IEX-Dashboard/backend_tables_updated - state_charges.csv';
const tariffFile = '/Users/yashgupta/IEX-Dashboard/backend_tables_updated - state-tarriff.csv';

// 1. Update State Charges
let chargesCsv = fs.readFileSync(chargesFile, 'utf8').trim().split('\n');
let chargesHeader = chargesCsv[0].split(',');
let hasDiscom = chargesHeader[1] === 'discom';

if (!hasDiscom) {
    chargesHeader.splice(1, 0, 'discom');
    chargesCsv[0] = chargesHeader.join(',');
    for (let i = 1; i < chargesCsv.length; i++) {
        if (chargesCsv[i].trim()) {
            let row = chargesCsv[i].split(',');
            row.splice(1, 0, '');
            chargesCsv[i] = row.join(',');
        }
    }
} else {
    // Remove existing NPCL rows
    chargesCsv = chargesCsv.filter((line, i) => i === 0 || (line.split(',')[1] !== 'NPCL'));
}

const addCharge = (cat, sub_cat, supp_cat, volt, from, to, fixed, cross, wheel, stu, stuloss, wheelloss) => {
    // state,discom,category,sub_category,supply_voltage_category,voltage_level,from_date,to_date,demand_fixed_charge_kva_per_month_Rs,cross_subsidy,distribution_wheeling_charges,stu_charges,stu_loss_percent,wheeling_loss_percent,additional_charge
    chargesCsv.push(`UTTAR_PRADESH,NPCL,${cat},${sub_cat},${supp_cat},${volt},${from},${to},${fixed},${cross},${wheel},${stu},${stuloss},${wheelloss},0`);
}

addCharge('HV-1', '', 'High Tension (HT)', '11', '01-04-2024', '31-03-2025', 430, 1.33, 1.012, 0.2326, 3.18, 5.66);
addCharge('HV-1', '', 'High Tension (HT)', '33', '01-04-2024', '31-03-2025', 400, 1.40, 1.012, 0.2326, 3.18, 2.15);
addCharge('HV-2', '', 'High Tension (HT)', '11', '01-04-2024', '31-03-2025', 300, 0.57, 1.012, 0.2326, 3.18, 5.66);
addCharge('HV-2', '', 'High Tension (HT)', '33', '01-04-2024', '31-03-2025', 290, 0.59, 1.012, 0.2326, 3.18, 2.15);

addCharge('HV-1', '', 'High Tension (HT)', '11', '01-04-2025', '31-03-2026', 430, 1.33, 0.9985, 0.3075, 3.18, 5.47);
addCharge('HV-1', '', 'High Tension (HT)', '33', '01-04-2025', '31-03-2026', 400, 1.40, 0.9985, 0.3075, 3.18, 0.88);
addCharge('HV-2', '', 'High Tension (HT)', '11', '01-04-2025', '31-03-2026', 300, 0.57, 0.9985, 0.3075, 3.18, 5.47);
addCharge('HV-2', '', 'High Tension (HT)', '33', '01-04-2025', '31-03-2026', 290, 0.59, 0.9985, 0.3075, 3.18, 0.88);

addCharge('HV-1', '', 'High Tension (HT)', '11', '01-04-2026', '31-03-2027', 430, 1.33, 1.03, 0.3075, 3.18, 2.58);
addCharge('HV-1', '', 'High Tension (HT)', '33', '01-04-2026', '31-03-2027', 400, 1.40, 1.03, 0.3075, 3.18, 0.79);
addCharge('HV-2', '', 'High Tension (HT)', '11', '01-04-2026', '31-03-2027', 300, 0.57, 1.03, 0.3075, 3.18, 2.58);
addCharge('HV-2', '', 'High Tension (HT)', '33', '01-04-2026', '31-03-2027', 290, 0.59, 1.03, 0.3075, 3.18, 0.79);

fs.writeFileSync(chargesFile, chargesCsv.join('\n'));

// 2. Update State Tariff
let tariffCsv = fs.readFileSync(tariffFile, 'utf8').trim().split('\n');
let tariffHeader = tariffCsv[0].split(',');
let hasTariffDiscom = tariffHeader[1] === 'discom';

if (!hasTariffDiscom) {
    tariffHeader.splice(1, 0, 'discom');
    tariffCsv[0] = tariffHeader.join(',');
    for (let i = 1; i < tariffCsv.length; i++) {
        if (tariffCsv[i].trim()) {
            let row = tariffCsv[i].split(',');
            row.splice(1, 0, '');
            tariffCsv[i] = row.join(',');
        }
    }
} else {
    tariffCsv = tariffCsv.filter((line, i) => i === 0 || (line.split(',')[1] !== 'NPCL'));
}

const addTariff = (cat, sub_cat, supp_cat, volt, month, start, end, base, unit, percent, energy) => {
    // state,discom,consumer_category,sub_category,supply_voltage_category,supply_voltage,month,tod_start_time,tod_end_time,base_energy_rate,base_energy_unit,tod_charge_percent,energy_rate
    tariffCsv.push(`UTTAR_PRADESH,NPCL,${cat},${sub_cat},${supp_cat},${volt},${month},${start},${end},${base},${unit},${percent},${energy}`);
}

for (let month = 1; month <= 12; month++) {
    let is_summer = month >= 4 && month <= 9;
    
    // HV-1 11kV
    addTariff('HV-1', '', 'High Tension (HT)', '11', month, '07:00', '16:00', 8.32, 'kWh', 0, 8.32);
    addTariff('HV-1', '', 'High Tension (HT)', '11', month, '16:00', '19:00', 8.32, 'kWh', 0, 8.32);
    addTariff('HV-1', '', 'High Tension (HT)', '11', month, '19:00', '02:00', 8.32, 'kWh', 0, 8.32);
    addTariff('HV-1', '', 'High Tension (HT)', '11', month, '02:00', '07:00', 8.32, 'kWh', 0, 8.32);

    // HV-1 33kV
    addTariff('HV-1', '', 'High Tension (HT)', '33', month, '07:00', '16:00', 8.12, 'kWh', 0, 8.12);
    addTariff('HV-1', '', 'High Tension (HT)', '33', month, '16:00', '19:00', 8.12, 'kWh', 0, 8.12);
    addTariff('HV-1', '', 'High Tension (HT)', '33', month, '19:00', '02:00', 8.12, 'kWh', 0, 8.12);
    addTariff('HV-1', '', 'High Tension (HT)', '33', month, '02:00', '07:00', 8.12, 'kWh', 0, 8.12);

    // HV-2 11kV
    if (is_summer) {
        addTariff('HV-2', '', 'High Tension (HT)', '11', month, '07:00', '16:00', 6.03, 'kWh', 0, 6.03);
        addTariff('HV-2', '', 'High Tension (HT)', '11', month, '16:00', '19:00', 7.10, 'kWh', 0, 7.10);
        addTariff('HV-2', '', 'High Tension (HT)', '11', month, '19:00', '02:00', 8.17, 'kWh', 0, 8.17);
        addTariff('HV-2', '', 'High Tension (HT)', '11', month, '02:00', '07:00', 8.17, 'kWh', 0, 8.17);
    } else {
        addTariff('HV-2', '', 'High Tension (HT)', '11', month, '10:00', '17:00', 7.10, 'kWh', 0, 7.10);
        addTariff('HV-2', '', 'High Tension (HT)', '11', month, '17:00', '19:00', 8.165, 'kWh', 0, 8.165);
        addTariff('HV-2', '', 'High Tension (HT)', '11', month, '19:00', '22:00', 7.10, 'kWh', 0, 7.10);
        addTariff('HV-2', '', 'High Tension (HT)', '11', month, '22:00', '04:00', 6.035, 'kWh', 0, 6.035);
        addTariff('HV-2', '', 'High Tension (HT)', '11', month, '04:00', '06:00', 7.10, 'kWh', 0, 7.10);
        addTariff('HV-2', '', 'High Tension (HT)', '11', month, '06:00', '10:00', 8.165, 'kWh', 0, 8.165);
    }

    // HV-2 33kV
    if (is_summer) {
        addTariff('HV-2', '', 'High Tension (HT)', '33', month, '07:00', '16:00', 5.78, 'kWh', 0, 5.78);
        addTariff('HV-2', '', 'High Tension (HT)', '33', month, '16:00', '19:00', 6.80, 'kWh', 0, 6.80);
        addTariff('HV-2', '', 'High Tension (HT)', '33', month, '19:00', '02:00', 7.82, 'kWh', 0, 7.82);
        addTariff('HV-2', '', 'High Tension (HT)', '33', month, '02:00', '07:00', 7.82, 'kWh', 0, 7.82);
    } else {
        addTariff('HV-2', '', 'High Tension (HT)', '33', month, '10:00', '17:00', 6.80, 'kWh', 0, 6.80);
        addTariff('HV-2', '', 'High Tension (HT)', '33', month, '17:00', '19:00', 7.82, 'kWh', 0, 7.82);
        addTariff('HV-2', '', 'High Tension (HT)', '33', month, '19:00', '22:00', 6.80, 'kWh', 0, 6.80);
        addTariff('HV-2', '', 'High Tension (HT)', '33', month, '22:00', '04:00', 5.78, 'kWh', 0, 5.78);
        addTariff('HV-2', '', 'High Tension (HT)', '33', month, '04:00', '06:00', 6.80, 'kWh', 0, 6.80);
        addTariff('HV-2', '', 'High Tension (HT)', '33', month, '06:00', '10:00', 7.82, 'kWh', 0, 7.82);
    }
}

fs.writeFileSync(tariffFile, tariffCsv.join('\n'));

console.log("CSVs updated successfully with JS!");
