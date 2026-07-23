import pandas as pd
import numpy as np

# 1. Update State Charges
df_charges = pd.read_csv('/Users/yashgupta/IEX-Dashboard/backend_tables_updated - state_charges.csv')

# Insert discom column after state if it doesn't exist
if 'discom' not in df_charges.columns:
    df_charges.insert(1, 'discom', '')

# Remove existing NPCL data if any (just in case)
df_charges = df_charges[df_charges['discom'] != 'NPCL']

new_charges = []

def add_charge(category, supply_voltage_category, voltage_level, from_date, to_date, fixed, cross, wheeling, stu, stu_loss, wheeling_loss):
    new_charges.append({
        'state': 'UTTAR_PRADESH',
        'discom': 'NPCL',
        'category': category,
        'sub_category': '',
        'supply_voltage_category': supply_voltage_category,
        'voltage_level': voltage_level,
        'from_date': from_date,
        'to_date': to_date,
        'demand_fixed_charge_kva_per_month_Rs': fixed,
        'cross_subsidy': cross,
        'distribution_wheeling_charges': wheeling,
        'stu_charges': stu,
        'stu_loss_percent': stu_loss,
        'wheeling_loss_percent': wheeling_loss,
        'additional_charge': 0
    })

# Add for FY 24-25 (01-04-2024 to 31-03-2025)
add_charge('HV-1', 'High Tension (HT)', '11', '01-04-2024', '31-03-2025', 430, 1.33, 1.012, 0.2326, 3.18, 5.66)
add_charge('HV-1', 'High Tension (HT)', '33', '01-04-2024', '31-03-2025', 400, 1.40, 1.012, 0.2326, 3.18, 2.15)
add_charge('HV-2', 'High Tension (HT)', '11', '01-04-2024', '31-03-2025', 300, 0.57, 1.012, 0.2326, 3.18, 5.66)
add_charge('HV-2', 'High Tension (HT)', '33', '01-04-2024', '31-03-2025', 290, 0.59, 1.012, 0.2326, 3.18, 2.15)

# Add for FY 25-26 (01-04-2025 to 31-03-2026)
add_charge('HV-1', 'High Tension (HT)', '11', '01-04-2025', '31-03-2026', 430, 1.33, 0.9985, 0.3075, 3.18, 5.47)
add_charge('HV-1', 'High Tension (HT)', '33', '01-04-2025', '31-03-2026', 400, 1.40, 0.9985, 0.3075, 3.18, 0.88)
add_charge('HV-2', 'High Tension (HT)', '11', '01-04-2025', '31-03-2026', 300, 0.57, 0.9985, 0.3075, 3.18, 5.47)
add_charge('HV-2', 'High Tension (HT)', '33', '01-04-2025', '31-03-2026', 290, 0.59, 0.9985, 0.3075, 3.18, 0.88)

# Add for FY 26-27 (01-04-2026 to 31-03-2027)
add_charge('HV-1', 'High Tension (HT)', '11', '01-04-2026', '31-03-2027', 430, 1.33, 1.03, 0.3075, 3.18, 2.58)
add_charge('HV-1', 'High Tension (HT)', '33', '01-04-2026', '31-03-2027', 400, 1.40, 1.03, 0.3075, 3.18, 0.79)
add_charge('HV-2', 'High Tension (HT)', '11', '01-04-2026', '31-03-2027', 300, 0.57, 1.03, 0.3075, 3.18, 2.58)
add_charge('HV-2', 'High Tension (HT)', '33', '01-04-2026', '31-03-2027', 290, 0.59, 1.03, 0.3075, 3.18, 0.79)

df_charges = pd.concat([df_charges, pd.DataFrame(new_charges)], ignore_index=True)
df_charges.to_csv('/Users/yashgupta/IEX-Dashboard/backend_tables_updated - state_charges.csv', index=False)


# 2. Update State Tariff
df_tariff = pd.read_csv('/Users/yashgupta/IEX-Dashboard/backend_tables_updated - state-tarriff.csv')

if 'discom' not in df_tariff.columns:
    df_tariff.insert(1, 'discom', '')

df_tariff = df_tariff[df_tariff['discom'] != 'NPCL']

new_tariffs = []
def add_tariff(category, voltage, month, start, end, rate):
    new_tariffs.append({
        'state': 'UTTAR_PRADESH',
        'discom': 'NPCL',
        'consumer_category': category,
        'sub_category': '',
        'supply_voltage_category': 'High Tension (HT)',
        'supply_voltage': voltage,
        'month': month,
        'tod_start_time': start,
        'tod_end_time': end,
        'base_energy_rate': rate,
        'base_energy_unit': 'kWh',
        'tod_charge_percent': 0,
        'energy_rate': rate
    })

# The energy charges for NPCL are the same for all years (FY24-25, 25-26, 26-27 in the screenshot)
for month in range(1, 13):
    is_summer = month >= 4 and month <= 9
    
    # HV-1 (11 kV)
    for tod, rate in [('07:00', '16:00', 8.32), ('16:00', '19:00', 8.32), ('19:00', '02:00', 8.32), ('02:00', '07:00', 8.32)]:
        add_tariff('HV-1', '11', month, tod[0], tod[1], rate)
    
    # HV-1 (33 kV)
    for tod, rate in [('07:00', '16:00', 8.12), ('16:00', '19:00', 8.12), ('19:00', '02:00', 8.12), ('02:00', '07:00', 8.12)]:
        add_tariff('HV-1', '33', month, tod[0], tod[1], rate)

    # HV-2 (11 kV)
    if is_summer:
        tods = [('07:00', '16:00', 6.03), ('16:00', '19:00', 7.10), ('19:00', '02:00', 8.17), ('02:00', '07:00', 8.17)]
    else:
        tods = [('10:00', '17:00', 7.1), ('17:00', '19:00', 8.165), ('19:00', '22:00', 7.1), ('22:00', '04:00', 6.035), ('04:00', '06:00', 7.1), ('06:00', '10:00', 8.165)]
    for tod in tods:
        add_tariff('HV-2', '11', month, tod[0], tod[1], tod[2])
        
    # HV-2 (33 kV)
    if is_summer:
        tods = [('07:00', '16:00', 5.78), ('16:00', '19:00', 6.80), ('19:00', '02:00', 7.82), ('02:00', '07:00', 7.82)]
    else:
        tods = [('10:00', '17:00', 6.8), ('17:00', '19:00', 7.82), ('19:00', '22:00', 6.8), ('22:00', '04:00', 5.78), ('04:00', '06:00', 6.8), ('06:00', '10:00', 7.82)]
    for tod in tods:
        add_tariff('HV-2', '33', month, tod[0], tod[1], tod[2])

df_tariff = pd.concat([df_tariff, pd.DataFrame(new_tariffs)], ignore_index=True)
df_tariff.to_csv('/Users/yashgupta/IEX-Dashboard/backend_tables_updated - state-tarriff.csv', index=False)

print("CSVs updated successfully!")
