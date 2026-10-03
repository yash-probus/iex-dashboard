"""
Historical 15-Minute Weather Ingestion into weather_regionwise
--------------------------------------------------------------

Purpose:
    Download historical Open-Meteo forecast weather data for ALL districts
    of India's top-5 solar-generation states and store it in PostgreSQL
    (table: weather_regionwise).

States covered (by national solar generation share, CEA Q2 2026):
    Rajasthan     30.9%   NR
    Gujarat       22.8%   WR
    Tamil Nadu    10.1%   SR
    Karnataka      9.5%   SR
    Maharashtra    5.7%   WR

Primary use case:
    15-minute solar generation / IEX block-level ML features.

Important:
    - NO *_instant solar radiation variables are used.
    - shortwave_radiation is the primary GHI feature.
    - Data is stored at 15-minute resolution.
    - Matches PostgreSQL schema for `public.weather_regionwise` with PRIMARY KEY (location, time).
    - `state` and `district` are stored as separate columns (in addition to
      `hub_name`/`region`) so district-level features can be grouped either
      by state or by grid region.
"""

import os
import sys
import time
import logging
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
import psycopg2
from psycopg2.extras import execute_values
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Ensure console supports UTF-8
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


# ============================================================
# 1. CONFIGURATION
# ============================================================

TODAY_STR = datetime.now().strftime("%Y-%m-%d")
START_DATE = os.getenv("START_DATE", "2026-09-24")
END_DATE = os.getenv("END_DATE", TODAY_STR)

TIMEZONE = "Asia/Kolkata"

OPEN_METEO_WEATHER_URL = (
    "https://historical-forecast-api.open-meteo.com/v1/forecast"
)

DB_CONFIG = {
    "host": os.getenv("PGHOST", "13.206.77.155"),
    "port": int(os.getenv("PROD_PGPORT", os.getenv("PGPORT", "5436"))),
    "database": os.getenv("PGDATABASE", "Prolt_Operations"),
    "user": os.getenv("PGUSER", "postgres"),
    "password": os.getenv("PGPASSWORD", "iex_sec_k9P2mX_2026"),
}

TABLE_NAME = os.getenv("WEATHER_TABLE", "weather_regionwise")

MAX_WORKERS = int(os.getenv("MAX_WORKERS", "3"))
BATCH_SIZE = 500


# ============================================================
# 2. DISTRICT-LEVEL LOCATIONS
# ============================================================
# All districts of Rajasthan, Gujarat, Tamil Nadu, Karnataka and Maharashtra
# (170 districts total). Source: district centroid coordinates, cross-checked
# against India's lat/long bounds; 6 rows with missing/corrupted source
# coordinates were corrected manually (Chhota Udepur, Dang, Gir Somnath,
# Hassan, Pratapgarh, Jhunjhunu).
#
# hub_name = district-level slug (district_stateabbrev), used for grouping.
# state / district = separate columns as requested.

LOCATIONS = [
    # ---------------- Gujarat ----------------
    {"station_name": "Ahmedabad District", "hub_code": "ahmedabad_gu", "state": "Gujarat", "district": "Ahmedabad", "region": "WR", "latitude": 23.03, "longitude": 72.58},
    {"station_name": "Amreli District", "hub_code": "amreli_gu", "state": "Gujarat", "district": "Amreli", "region": "WR", "latitude": 21.42, "longitude": 71.25},
    {"station_name": "Anand District", "hub_code": "anand_gu", "state": "Gujarat", "district": "Anand", "region": "WR", "latitude": 22.57, "longitude": 72.93},
    {"station_name": "Aravalli District", "hub_code": "aravalli_gu", "state": "Gujarat", "district": "Aravalli", "region": "WR", "latitude": 24.02, "longitude": 73.03},
    {"station_name": "Banaskantha District", "hub_code": "banaskantha_gu", "state": "Gujarat", "district": "Banaskantha", "region": "WR", "latitude": 24.17, "longitude": 72.42},
    {"station_name": "Bharuch District", "hub_code": "bharuch_gu", "state": "Gujarat", "district": "Bharuch", "region": "WR", "latitude": 20.7, "longitude": 72.98},
    {"station_name": "Bhavnagar District", "hub_code": "bhavnagar_gu", "state": "Gujarat", "district": "Bhavnagar", "region": "WR", "latitude": 21.77, "longitude": 72.13},
    {"station_name": "Botad District", "hub_code": "botad_gu", "state": "Gujarat", "district": "Botad", "region": "WR", "latitude": 22.17, "longitude": 71.67},
    {"station_name": "Chhota Udepur District", "hub_code": "chhota_udepur_gu", "state": "Gujarat", "district": "Chhota Udepur", "region": "WR", "latitude": 22.3, "longitude": 74.02},
    {"station_name": "Dahod District", "hub_code": "dahod_gu", "state": "Gujarat", "district": "Dahod", "region": "WR", "latitude": 22.83, "longitude": 74.25},
    {"station_name": "Dang District", "hub_code": "dang_gu", "state": "Gujarat", "district": "Dang", "region": "WR", "latitude": 20.75, "longitude": 73.69},
    {"station_name": "Devbhoomi Dwarka District", "hub_code": "devbhoomi_dwarka_gu", "state": "Gujarat", "district": "Devbhoomi Dwarka", "region": "WR", "latitude": 22.2, "longitude": 69.65},
    {"station_name": "Gandhinagar District", "hub_code": "gandhinagar_gu", "state": "Gujarat", "district": "Gandhinagar", "region": "WR", "latitude": 23.22, "longitude": 72.68},
    {"station_name": "Gir Somnath District", "hub_code": "gir_somnath_gu", "state": "Gujarat", "district": "Gir Somnath", "region": "WR", "latitude": 20.9, "longitude": 70.37},
    {"station_name": "Jamnagar District", "hub_code": "jamnagar_gu", "state": "Gujarat", "district": "Jamnagar", "region": "WR", "latitude": 22.22, "longitude": 69.7},
    {"station_name": "Junagadh District", "hub_code": "junagadh_gu", "state": "Gujarat", "district": "Junagadh", "region": "WR", "latitude": 21.52, "longitude": 70.45},
    {"station_name": "Kheda District", "hub_code": "kheda_gu", "state": "Gujarat", "district": "Kheda", "region": "WR", "latitude": 22.75, "longitude": 72.68},
    {"station_name": "Kutch District", "hub_code": "kutch_gu", "state": "Gujarat", "district": "Kutch", "region": "WR", "latitude": 23.9, "longitude": 70.37},
    {"station_name": "Mahisagar District", "hub_code": "mahisagar_gu", "state": "Gujarat", "district": "Mahisagar", "region": "WR", "latitude": 23.12, "longitude": 73.62},
    {"station_name": "Mehsana District", "hub_code": "mehsana_gu", "state": "Gujarat", "district": "Mehsana", "region": "WR", "latitude": 23.67, "longitude": 72.5},
    {"station_name": "Morbi District", "hub_code": "morbi_gu", "state": "Gujarat", "district": "Morbi", "region": "WR", "latitude": 22.82, "longitude": 70.83},
    {"station_name": "Narmada District", "hub_code": "narmada_gu", "state": "Gujarat", "district": "Narmada", "region": "WR", "latitude": 21.87, "longitude": 73.5},
    {"station_name": "Navsari District", "hub_code": "navsari_gu", "state": "Gujarat", "district": "Navsari", "region": "WR", "latitude": 20.95, "longitude": 72.92},
    {"station_name": "Panchmahal District", "hub_code": "panchmahal_gu", "state": "Gujarat", "district": "Panchmahal", "region": "WR", "latitude": 22.75, "longitude": 73.6},
    {"station_name": "Patan District", "hub_code": "patan_gu", "state": "Gujarat", "district": "Patan", "region": "WR", "latitude": 23.83, "longitude": 72.12},
    {"station_name": "Porbandar District", "hub_code": "porbandar_gu", "state": "Gujarat", "district": "Porbandar", "region": "WR", "latitude": 21.62, "longitude": 69.6},
    {"station_name": "Rajkot District", "hub_code": "rajkot_gu", "state": "Gujarat", "district": "Rajkot", "region": "WR", "latitude": 22.3, "longitude": 70.78},
    {"station_name": "Sabarkantha District", "hub_code": "sabarkantha_gu", "state": "Gujarat", "district": "Sabarkantha", "region": "WR", "latitude": 23.6, "longitude": 72.95},
    {"station_name": "Surat District", "hub_code": "surat_gu", "state": "Gujarat", "district": "Surat", "region": "WR", "latitude": 20.92, "longitude": 73.05},
    {"station_name": "Surendranagar District", "hub_code": "surendranagar_gu", "state": "Gujarat", "district": "Surendranagar", "region": "WR", "latitude": 22.73, "longitude": 71.52},
    {"station_name": "Tapi District", "hub_code": "tapi_gu", "state": "Gujarat", "district": "Tapi", "region": "WR", "latitude": 21.12, "longitude": 73.4},
    {"station_name": "Vadodara District", "hub_code": "vadodara_gu", "state": "Gujarat", "district": "Vadodara", "region": "WR", "latitude": 22.18, "longitude": 73.12},
    {"station_name": "Valsad District", "hub_code": "valsad_gu", "state": "Gujarat", "district": "Valsad", "region": "WR", "latitude": 20.6, "longitude": 72.92},
    # ---------------- Karnataka ----------------
    {"station_name": "Bagalkot District", "hub_code": "bagalkot_ka", "state": "Karnataka", "district": "Bagalkot", "region": "SR", "latitude": 16.12, "longitude": 75.45},
    {"station_name": "Ballari District", "hub_code": "ballari_ka", "state": "Karnataka", "district": "Ballari", "region": "SR", "latitude": 15.15, "longitude": 76.93},
    {"station_name": "Bangalore Rural District", "hub_code": "bangalore_rural_ka", "state": "Karnataka", "district": "Bangalore Rural", "region": "SR", "latitude": 13.27, "longitude": 77.62},
    {"station_name": "Bangalore Urban District", "hub_code": "bangalore_urban_ka", "state": "Karnataka", "district": "Bangalore Urban", "region": "SR", "latitude": 12.97, "longitude": 77.55},
    {"station_name": "Belgaum District", "hub_code": "belgaum_ka", "state": "Karnataka", "district": "Belgaum", "region": "SR", "latitude": 15.85, "longitude": 74.55},
    {"station_name": "Bidar District", "hub_code": "bidar_ka", "state": "Karnataka", "district": "Bidar", "region": "SR", "latitude": 17.9, "longitude": 77.5},
    {"station_name": "Chamarajnagar District", "hub_code": "chamarajnagar_ka", "state": "Karnataka", "district": "Chamarajnagar", "region": "SR", "latitude": 12.0, "longitude": 77.3},
    {"station_name": "Chikkaballapur District", "hub_code": "chikkaballapur_ka", "state": "Karnataka", "district": "Chikkaballapur", "region": "SR", "latitude": 13.43, "longitude": 77.72},
    {"station_name": "Chikkamagaluru District", "hub_code": "chikkamagaluru_ka", "state": "Karnataka", "district": "Chikkamagaluru", "region": "SR", "latitude": 13.3, "longitude": 75.73},
    {"station_name": "Chitradurga District", "hub_code": "chitradurga_ka", "state": "Karnataka", "district": "Chitradurga", "region": "SR", "latitude": 14.0, "longitude": 76.5},
    {"station_name": "Dakshina Kannada District", "hub_code": "dakshina_kannada_ka", "state": "Karnataka", "district": "Dakshina Kannada", "region": "SR", "latitude": 12.87, "longitude": 74.88},
    {"station_name": "Davanagere District", "hub_code": "davanagere_ka", "state": "Karnataka", "district": "Davanagere", "region": "SR", "latitude": 14.23, "longitude": 75.9},
    {"station_name": "Dharwad District", "hub_code": "dharwad_ka", "state": "Karnataka", "district": "Dharwad", "region": "SR", "latitude": 15.38, "longitude": 75.12},
    {"station_name": "Gadag District", "hub_code": "gadag_ka", "state": "Karnataka", "district": "Gadag", "region": "SR", "latitude": 15.4, "longitude": 75.75},
    {"station_name": "Gulbarga District", "hub_code": "gulbarga_ka", "state": "Karnataka", "district": "Gulbarga", "region": "SR", "latitude": 17.33, "longitude": 76.83},
    {"station_name": "Hassan District", "hub_code": "hassan_ka", "state": "Karnataka", "district": "Hassan", "region": "SR", "latitude": 13.0072, "longitude": 76.0962},
    {"station_name": "Haveri District", "hub_code": "haveri_ka", "state": "Karnataka", "district": "Haveri", "region": "SR", "latitude": 14.8, "longitude": 75.4},
    {"station_name": "Kodagu District", "hub_code": "kodagu_ka", "state": "Karnataka", "district": "Kodagu", "region": "SR", "latitude": 12.42, "longitude": 75.73},
    {"station_name": "Kolar District", "hub_code": "kolar_ka", "state": "Karnataka", "district": "Kolar", "region": "SR", "latitude": 13.13, "longitude": 78.13},
    {"station_name": "Koppal District", "hub_code": "koppal_ka", "state": "Karnataka", "district": "Koppal", "region": "SR", "latitude": 15.57, "longitude": 76.0},
    {"station_name": "Mandya District", "hub_code": "mandya_ka", "state": "Karnataka", "district": "Mandya", "region": "SR", "latitude": 12.52, "longitude": 76.9},
    {"station_name": "Mysuru District", "hub_code": "mysuru_ka", "state": "Karnataka", "district": "Mysuru", "region": "SR", "latitude": 12.22, "longitude": 76.48},
    {"station_name": "Raichur District", "hub_code": "raichur_ka", "state": "Karnataka", "district": "Raichur", "region": "SR", "latitude": 16.22, "longitude": 77.35},
    {"station_name": "Ramanagara District", "hub_code": "ramanagara_ka", "state": "Karnataka", "district": "Ramanagara", "region": "SR", "latitude": 12.72, "longitude": 75.28},
    {"station_name": "Shimoga District", "hub_code": "shimoga_ka", "state": "Karnataka", "district": "Shimoga", "region": "SR", "latitude": 14.0, "longitude": 75.28},
    {"station_name": "Tumakuru District", "hub_code": "tumakuru_ka", "state": "Karnataka", "district": "Tumakuru", "region": "SR", "latitude": 13.33, "longitude": 77.1},
    {"station_name": "Udupi District", "hub_code": "udupi_ka", "state": "Karnataka", "district": "Udupi", "region": "SR", "latitude": 13.35, "longitude": 74.75},
    {"station_name": "Uttara Kannada District", "hub_code": "uttara_kannada_ka", "state": "Karnataka", "district": "Uttara Kannada", "region": "SR", "latitude": 14.6, "longitude": 74.7},
    {"station_name": "Vijayapura District", "hub_code": "vijayapura_ka", "state": "Karnataka", "district": "Vijayapura", "region": "SR", "latitude": 13.28, "longitude": 77.8},
    {"station_name": "Yadgir District", "hub_code": "yadgir_ka", "state": "Karnataka", "district": "Yadgir", "region": "SR", "latitude": 16.75, "longitude": 77.13},
    # ---------------- Maharashtra ----------------
    {"station_name": "Ahmednagar District", "hub_code": "ahmednagar_ma", "state": "Maharashtra", "district": "Ahmednagar", "region": "WR", "latitude": 19.08, "longitude": 74.72},
    {"station_name": "Akola District", "hub_code": "akola_ma", "state": "Maharashtra", "district": "Akola", "region": "WR", "latitude": 20.5, "longitude": 77.17},
    {"station_name": "Amravati District", "hub_code": "amravati_ma", "state": "Maharashtra", "district": "Amravati", "region": "WR", "latitude": 20.93, "longitude": 77.75},
    {"station_name": "Aurangabad District", "hub_code": "aurangabad_ma", "state": "Maharashtra", "district": "Aurangabad", "region": "WR", "latitude": 19.88, "longitude": 75.32},
    {"station_name": "Beed District", "hub_code": "beed_ma", "state": "Maharashtra", "district": "Beed", "region": "WR", "latitude": 18.83, "longitude": 75.75},
    {"station_name": "Bhandara District", "hub_code": "bhandara_ma", "state": "Maharashtra", "district": "Bhandara", "region": "WR", "latitude": 21.18, "longitude": 80.0},
    {"station_name": "Buldhana District", "hub_code": "buldhana_ma", "state": "Maharashtra", "district": "Buldhana", "region": "WR", "latitude": 20.52, "longitude": 76.17},
    {"station_name": "Chandrapur District", "hub_code": "chandrapur_ma", "state": "Maharashtra", "district": "Chandrapur", "region": "WR", "latitude": 19.95, "longitude": 79.3},
    {"station_name": "Dhule District", "hub_code": "dhule_ma", "state": "Maharashtra", "district": "Dhule", "region": "WR", "latitude": 20.9, "longitude": 74.77},
    {"station_name": "Gadchiroli District", "hub_code": "gadchiroli_ma", "state": "Maharashtra", "district": "Gadchiroli", "region": "WR", "latitude": 20.18, "longitude": 80.0},
    {"station_name": "Gondia District", "hub_code": "gondia_ma", "state": "Maharashtra", "district": "Gondia", "region": "WR", "latitude": 21.45, "longitude": 80.18},
    {"station_name": "Hingoli District", "hub_code": "hingoli_ma", "state": "Maharashtra", "district": "Hingoli", "region": "WR", "latitude": 19.72, "longitude": 77.15},
    {"station_name": "Jalgaon District", "hub_code": "jalgaon_ma", "state": "Maharashtra", "district": "Jalgaon", "region": "WR", "latitude": 18.65, "longitude": 75.1},
    {"station_name": "Jalna District", "hub_code": "jalna_ma", "state": "Maharashtra", "district": "Jalna", "region": "WR", "latitude": 19.83, "longitude": 75.88},
    {"station_name": "Kolhapur District", "hub_code": "kolhapur_ma", "state": "Maharashtra", "district": "Kolhapur", "region": "WR", "latitude": 16.68, "longitude": 74.22},
    {"station_name": "Latur District", "hub_code": "latur_ma", "state": "Maharashtra", "district": "Latur", "region": "WR", "latitude": 18.4, "longitude": 76.58},
    {"station_name": "Mumbai City District", "hub_code": "mumbai_city_ma", "state": "Maharashtra", "district": "Mumbai City", "region": "WR", "latitude": 18.97, "longitude": 72.82},
    {"station_name": "Mumbai suburban District", "hub_code": "mumbai_suburban_ma", "state": "Maharashtra", "district": "Mumbai suburban", "region": "WR", "latitude": 19.05, "longitude": 72.83},
    {"station_name": "Nagpur District", "hub_code": "nagpur_ma", "state": "Maharashtra", "district": "Nagpur", "region": "WR", "latitude": 21.0, "longitude": 79.0},
    {"station_name": "Nanded District", "hub_code": "nanded_ma", "state": "Maharashtra", "district": "Nanded", "region": "WR", "latitude": 19.15, "longitude": 77.32},
    {"station_name": "Nandurbar District", "hub_code": "nandurbar_ma", "state": "Maharashtra", "district": "Nandurbar", "region": "WR", "latitude": 21.38, "longitude": 74.37},
    {"station_name": "Nashik District", "hub_code": "nashik_ma", "state": "Maharashtra", "district": "Nashik", "region": "WR", "latitude": 19.98, "longitude": 73.78},
    {"station_name": "Osmanabad District", "hub_code": "osmanabad_ma", "state": "Maharashtra", "district": "Osmanabad", "region": "WR", "latitude": 17.35, "longitude": 75.17},
    {"station_name": "Palghar District", "hub_code": "palghar_ma", "state": "Maharashtra", "district": "Palghar", "region": "WR", "latitude": 19.68, "longitude": 72.77},
    {"station_name": "Parbhani District", "hub_code": "parbhani_ma", "state": "Maharashtra", "district": "Parbhani", "region": "WR", "latitude": 19.5, "longitude": 76.75},
    {"station_name": "Pune District", "hub_code": "pune_ma", "state": "Maharashtra", "district": "Pune", "region": "WR", "latitude": 18.52, "longitude": 73.83},
    {"station_name": "Raigad District", "hub_code": "raigad_ma", "state": "Maharashtra", "district": "Raigad", "region": "WR", "latitude": 18.65, "longitude": 72.87},
    {"station_name": "Ratnagiri District", "hub_code": "ratnagiri_ma", "state": "Maharashtra", "district": "Ratnagiri", "region": "WR", "latitude": 16.98, "longitude": 73.3},
    {"station_name": "Sangli District", "hub_code": "sangli_ma", "state": "Maharashtra", "district": "Sangli", "region": "WR", "latitude": 16.85, "longitude": 74.57},
    {"station_name": "Satara District", "hub_code": "satara_ma", "state": "Maharashtra", "district": "Satara", "region": "WR", "latitude": 17.7, "longitude": 74.0},
    {"station_name": "Sindhudurg District", "hub_code": "sindhudurg_ma", "state": "Maharashtra", "district": "Sindhudurg", "region": "WR", "latitude": 16.1, "longitude": 73.68},
    {"station_name": "Solapur District", "hub_code": "solapur_ma", "state": "Maharashtra", "district": "Solapur", "region": "WR", "latitude": 17.83, "longitude": 75.5},
    {"station_name": "Thane District", "hub_code": "thane_ma", "state": "Maharashtra", "district": "Thane", "region": "WR", "latitude": 19.2, "longitude": 72.97},
    {"station_name": "Wardha District", "hub_code": "wardha_ma", "state": "Maharashtra", "district": "Wardha", "region": "WR", "latitude": 20.83, "longitude": 78.6},
    {"station_name": "Washim District", "hub_code": "washim_ma", "state": "Maharashtra", "district": "Washim", "region": "WR", "latitude": 20.1, "longitude": 77.13},
    {"station_name": "Yavatmal District", "hub_code": "yavatmal_ma", "state": "Maharashtra", "district": "Yavatmal", "region": "WR", "latitude": 20.1, "longitude": 78.2},
    # ---------------- Rajasthan ----------------
    {"station_name": "Ajmer District", "hub_code": "ajmer_ra", "state": "Rajasthan", "district": "Ajmer", "region": "NR", "latitude": 26.45, "longitude": 74.63},
    {"station_name": "Alwar District", "hub_code": "alwar_ra", "state": "Rajasthan", "district": "Alwar", "region": "NR", "latitude": 27.57, "longitude": 76.6},
    {"station_name": "Banswara District", "hub_code": "banswara_ra", "state": "Rajasthan", "district": "Banswara", "region": "NR", "latitude": 27.2, "longitude": 74.0},
    {"station_name": "Baran District", "hub_code": "baran_ra", "state": "Rajasthan", "district": "Baran", "region": "NR", "latitude": 25.1, "longitude": 76.52},
    {"station_name": "Barmer District", "hub_code": "barmer_ra", "state": "Rajasthan", "district": "Barmer", "region": "NR", "latitude": 25.75, "longitude": 71.38},
    {"station_name": "Bharatpur District", "hub_code": "bharatpur_ra", "state": "Rajasthan", "district": "Bharatpur", "region": "NR", "latitude": 27.22, "longitude": 77.5},
    {"station_name": "Bhilwara District", "hub_code": "bhilwara_ra", "state": "Rajasthan", "district": "Bhilwara", "region": "NR", "latitude": 25.35, "longitude": 74.63},
    {"station_name": "Bikaner District", "hub_code": "bikaner_ra", "state": "Rajasthan", "district": "Bikaner", "region": "NR", "latitude": 28.02, "longitude": 73.3},
    {"station_name": "Bundi District", "hub_code": "bundi_ra", "state": "Rajasthan", "district": "Bundi", "region": "NR", "latitude": 25.43, "longitude": 75.63},
    {"station_name": "Chittorgarh District", "hub_code": "chittorgarh_ra", "state": "Rajasthan", "district": "Chittorgarh", "region": "NR", "latitude": 24.87, "longitude": 74.62},
    {"station_name": "Churu District", "hub_code": "churu_ra", "state": "Rajasthan", "district": "Churu", "region": "NR", "latitude": 28.28, "longitude": 74.95},
    {"station_name": "Dausa District", "hub_code": "dausa_ra", "state": "Rajasthan", "district": "Dausa", "region": "NR", "latitude": 26.53, "longitude": 76.18},
    {"station_name": "Dholpur District", "hub_code": "dholpur_ra", "state": "Rajasthan", "district": "Dholpur", "region": "NR", "latitude": 26.7, "longitude": 77.9},
    {"station_name": "Dungarpur District", "hub_code": "dungarpur_ra", "state": "Rajasthan", "district": "Dungarpur", "region": "NR", "latitude": 23.83, "longitude": 73.72},
    {"station_name": "Ganganagar District", "hub_code": "ganganagar_ra", "state": "Rajasthan", "district": "Ganganagar", "region": "NR", "latitude": 29.92, "longitude": 73.87},
    {"station_name": "Hanumangarh District", "hub_code": "hanumangarh_ra", "state": "Rajasthan", "district": "Hanumangarh", "region": "NR", "latitude": 29.57, "longitude": 74.32},
    {"station_name": "Jaipur District", "hub_code": "jaipur_ra", "state": "Rajasthan", "district": "Jaipur", "region": "NR", "latitude": 26.92, "longitude": 75.82},
    {"station_name": "Jaisalmer District", "hub_code": "jaisalmer_ra", "state": "Rajasthan", "district": "Jaisalmer", "region": "NR", "latitude": 26.9, "longitude": 70.9},
    {"station_name": "Jalore District", "hub_code": "jalore_ra", "state": "Rajasthan", "district": "Jalore", "region": "NR", "latitude": 25.35, "longitude": 72.62},
    {"station_name": "Jhalawar District", "hub_code": "jhalawar_ra", "state": "Rajasthan", "district": "Jhalawar", "region": "NR", "latitude": 24.6, "longitude": 76.15},
    {"station_name": "Jhunjhunu District", "hub_code": "jhunjhunu_ra", "state": "Rajasthan", "district": "Jhunjhunu", "region": "NR", "latitude": 28.1287, "longitude": 75.3997},
    {"station_name": "Jodhpur District", "hub_code": "jodhpur_ra", "state": "Rajasthan", "district": "Jodhpur", "region": "NR", "latitude": 27.62, "longitude": 72.92},
    {"station_name": "Karauli District", "hub_code": "karauli_ra", "state": "Rajasthan", "district": "Karauli", "region": "NR", "latitude": 26.5, "longitude": 77.02},
    {"station_name": "Kota District", "hub_code": "kota_ra", "state": "Rajasthan", "district": "Kota", "region": "NR", "latitude": 25.17, "longitude": 73.82},
    {"station_name": "Nagaur District", "hub_code": "nagaur_ra", "state": "Rajasthan", "district": "Nagaur", "region": "NR", "latitude": 27.2, "longitude": 73.73},
    {"station_name": "Pali District", "hub_code": "pali_ra", "state": "Rajasthan", "district": "Pali", "region": "NR", "latitude": 25.77, "longitude": 73.32},
    {"station_name": "Pratapgarh District", "hub_code": "pratapgarh_ra", "state": "Rajasthan", "district": "Pratapgarh", "region": "NR", "latitude": 24.0316, "longitude": 74.7811},
    {"station_name": "Rajsamand District", "hub_code": "rajsamand_ra", "state": "Rajasthan", "district": "Rajsamand", "region": "NR", "latitude": 25.07, "longitude": 73.87},
    {"station_name": "Sawai Madhopur District", "hub_code": "sawai_madhopur_ra", "state": "Rajasthan", "district": "Sawai Madhopur", "region": "NR", "latitude": 26.0, "longitude": 76.35},
    {"station_name": "Sikar District", "hub_code": "sikar_ra", "state": "Rajasthan", "district": "Sikar", "region": "NR", "latitude": 27.22, "longitude": 74.43},
    {"station_name": "Sirohi District", "hub_code": "sirohi_ra", "state": "Rajasthan", "district": "Sirohi", "region": "NR", "latitude": 24.88, "longitude": 72.85},
    {"station_name": "Tonk District", "hub_code": "tonk_ra", "state": "Rajasthan", "district": "Tonk", "region": "NR", "latitude": 26.15, "longitude": 75.78},
    {"station_name": "Udaipur District", "hub_code": "udaipur_ra", "state": "Rajasthan", "district": "Udaipur", "region": "NR", "latitude": 24.38, "longitude": 73.62},
    # ---------------- Tamil Nadu ----------------
    {"station_name": "Ariyalur District", "hub_code": "ariyalur_ta", "state": "Tamil Nadu", "district": "Ariyalur", "region": "SR", "latitude": 11.13, "longitude": 79.07},
    {"station_name": "Chengalpattu District", "hub_code": "chengalpattu_ta", "state": "Tamil Nadu", "district": "Chengalpattu", "region": "SR", "latitude": 12.68, "longitude": 79.98},
    {"station_name": "Chennai District", "hub_code": "chennai_ta", "state": "Tamil Nadu", "district": "Chennai", "region": "SR", "latitude": 13.08, "longitude": 80.27},
    {"station_name": "Coimbatore District", "hub_code": "coimbatore_ta", "state": "Tamil Nadu", "district": "Coimbatore", "region": "SR", "latitude": 11.0, "longitude": 76.97},
    {"station_name": "Cuddalore District", "hub_code": "cuddalore_ta", "state": "Tamil Nadu", "district": "Cuddalore", "region": "SR", "latitude": 11.75, "longitude": 79.75},
    {"station_name": "Dharmapuri District", "hub_code": "dharmapuri_ta", "state": "Tamil Nadu", "district": "Dharmapuri", "region": "SR", "latitude": 12.12, "longitude": 78.15},
    {"station_name": "Dindigul District", "hub_code": "dindigul_ta", "state": "Tamil Nadu", "district": "Dindigul", "region": "SR", "latitude": 10.35, "longitude": 77.98},
    {"station_name": "Erode District", "hub_code": "erode_ta", "state": "Tamil Nadu", "district": "Erode", "region": "SR", "latitude": 11.35, "longitude": 77.73},
    {"station_name": "Kallakurichi District", "hub_code": "kallakurichi_ta", "state": "Tamil Nadu", "district": "Kallakurichi", "region": "SR", "latitude": 11.73, "longitude": 78.95},
    {"station_name": "Kanchipuram District", "hub_code": "kanchipuram_ta", "state": "Tamil Nadu", "district": "Kanchipuram", "region": "SR", "latitude": 12.82, "longitude": 79.72},
    {"station_name": "Kanyakumari District", "hub_code": "kanyakumari_ta", "state": "Tamil Nadu", "district": "Kanyakumari", "region": "SR", "latitude": 8.07, "longitude": 77.53},
    {"station_name": "Karur District", "hub_code": "karur_ta", "state": "Tamil Nadu", "district": "Karur", "region": "SR", "latitude": 10.95, "longitude": 78.07},
    {"station_name": "Krishnagiri District", "hub_code": "krishnagiri_ta", "state": "Tamil Nadu", "district": "Krishnagiri", "region": "SR", "latitude": 12.52, "longitude": 78.2},
    {"station_name": "Madurai District", "hub_code": "madurai_ta", "state": "Tamil Nadu", "district": "Madurai", "region": "SR", "latitude": 9.83, "longitude": 77.83},
    {"station_name": "Mayiladuthurai District", "hub_code": "mayiladuthurai_ta", "state": "Tamil Nadu", "district": "Mayiladuthurai", "region": "SR", "latitude": 11.1, "longitude": 79.65},
    {"station_name": "Nagapattinam District", "hub_code": "nagapattinam_ta", "state": "Tamil Nadu", "district": "Nagapattinam", "region": "SR", "latitude": 10.77, "longitude": 79.82},
    {"station_name": "Namakkal District", "hub_code": "namakkal_ta", "state": "Tamil Nadu", "district": "Namakkal", "region": "SR", "latitude": 11.22, "longitude": 78.17},
    {"station_name": "Nilgiris District", "hub_code": "nilgiris_ta", "state": "Tamil Nadu", "district": "Nilgiris", "region": "SR", "latitude": 11.42, "longitude": 76.68},
    {"station_name": "Perambalur District", "hub_code": "perambalur_ta", "state": "Tamil Nadu", "district": "Perambalur", "region": "SR", "latitude": 11.23, "longitude": 78.87},
    {"station_name": "Pudukkottai District", "hub_code": "pudukkottai_ta", "state": "Tamil Nadu", "district": "Pudukkottai", "region": "SR", "latitude": 10.38, "longitude": 78.82},
    {"station_name": "Ramanathapuram District", "hub_code": "ramanathapuram_ta", "state": "Tamil Nadu", "district": "Ramanathapuram", "region": "SR", "latitude": 9.38, "longitude": 78.75},
    {"station_name": "Ranipet District", "hub_code": "ranipet_ta", "state": "Tamil Nadu", "district": "Ranipet", "region": "SR", "latitude": 12.93, "longitude": 79.33},
    {"station_name": "Salem District", "hub_code": "salem_ta", "state": "Tamil Nadu", "district": "Salem", "region": "SR", "latitude": 11.65, "longitude": 78.13},
    {"station_name": "Sivaganga District", "hub_code": "sivaganga_ta", "state": "Tamil Nadu", "district": "Sivaganga", "region": "SR", "latitude": 9.72, "longitude": 78.82},
    {"station_name": "Tenkasi District", "hub_code": "tenkasi_ta", "state": "Tamil Nadu", "district": "Tenkasi", "region": "SR", "latitude": 8.97, "longitude": 77.3},
    {"station_name": "Thanjavur District", "hub_code": "thanjavur_ta", "state": "Tamil Nadu", "district": "Thanjavur", "region": "SR", "latitude": 10.78, "longitude": 79.13},
    {"station_name": "Theni District", "hub_code": "theni_ta", "state": "Tamil Nadu", "district": "Theni", "region": "SR", "latitude": 10.07, "longitude": 77.75},
    {"station_name": "Thoothukudi District", "hub_code": "thoothukudi_ta", "state": "Tamil Nadu", "district": "Thoothukudi", "region": "SR", "latitude": 8.8, "longitude": 78.13},
    {"station_name": "Tiruchirappalli District", "hub_code": "tiruchirappalli_ta", "state": "Tamil Nadu", "district": "Tiruchirappalli", "region": "SR", "latitude": 10.78, "longitude": 78.68},
    {"station_name": "Tirunelveli District", "hub_code": "tirunelveli_ta", "state": "Tamil Nadu", "district": "Tirunelveli", "region": "SR", "latitude": 8.72, "longitude": 77.7},
    {"station_name": "Tirupattur District", "hub_code": "tirupattur_ta", "state": "Tamil Nadu", "district": "Tirupattur", "region": "SR", "latitude": 12.5, "longitude": 78.6},
    {"station_name": "Tirupur District", "hub_code": "tirupur_ta", "state": "Tamil Nadu", "district": "Tirupur", "region": "SR", "latitude": 11.18, "longitude": 77.25},
    {"station_name": "Tiruvallur District", "hub_code": "tiruvallur_ta", "state": "Tamil Nadu", "district": "Tiruvallur", "region": "SR", "latitude": 13.13, "longitude": 79.9},
    {"station_name": "Tiruvannamalai District", "hub_code": "tiruvannamalai_ta", "state": "Tamil Nadu", "district": "Tiruvannamalai", "region": "SR", "latitude": 12.42, "longitude": 79.12},
    {"station_name": "Tiruvarur District", "hub_code": "tiruvarur_ta", "state": "Tamil Nadu", "district": "Tiruvarur", "region": "SR", "latitude": 10.77, "longitude": 79.63},
    {"station_name": "Vellore District", "hub_code": "vellore_ta", "state": "Tamil Nadu", "district": "Vellore", "region": "SR", "latitude": 12.9, "longitude": 79.13},
    {"station_name": "Viluppuram District", "hub_code": "viluppuram_ta", "state": "Tamil Nadu", "district": "Viluppuram", "region": "SR", "latitude": 11.95, "longitude": 79.52},
    {"station_name": "Virudhunagar District", "hub_code": "virudhunagar_ta", "state": "Tamil Nadu", "district": "Virudhunagar", "region": "SR", "latitude": 9.58, "longitude": 77.95},
    # ---------------- Uttar Pradesh (IEX Region: N2) ----------------
    {"station_name": "Agra District", "hub_code": "agra_up", "state": "Uttar Pradesh", "district": "Agra", "region": "N2", "latitude": 27.1767, "longitude": 78.0081},
    {"station_name": "Aligarh District", "hub_code": "aligarh_up", "state": "Uttar Pradesh", "district": "Aligarh", "region": "N2", "latitude": 27.8974, "longitude": 78.088},
    {"station_name": "Ambedkar Nagar District", "hub_code": "ambedkar_nagar_up", "state": "Uttar Pradesh", "district": "Ambedkar Nagar", "region": "N2", "latitude": 26.43, "longitude": 82.54},
    {"station_name": "Amethi District", "hub_code": "amethi_up", "state": "Uttar Pradesh", "district": "Amethi", "region": "N2", "latitude": 26.155, "longitude": 81.81},
    {"station_name": "Amroha District", "hub_code": "amroha_up", "state": "Uttar Pradesh", "district": "Amroha", "region": "N2", "latitude": 28.9034, "longitude": 78.4677},
    {"station_name": "Auraiya District", "hub_code": "auraiya_up", "state": "Uttar Pradesh", "district": "Auraiya", "region": "N2", "latitude": 26.465, "longitude": 79.515},
    {"station_name": "Ayodhya District", "hub_code": "ayodhya_up", "state": "Uttar Pradesh", "district": "Ayodhya", "region": "N2", "latitude": 26.7922, "longitude": 82.1998},
    {"station_name": "Azamgarh District", "hub_code": "azamgarh_up", "state": "Uttar Pradesh", "district": "Azamgarh", "region": "N2", "latitude": 26.0685, "longitude": 83.1859},
    {"station_name": "Baghpat District", "hub_code": "baghpat_up", "state": "Uttar Pradesh", "district": "Baghpat", "region": "N2", "latitude": 28.9447, "longitude": 77.2186},
    {"station_name": "Bahraich District", "hub_code": "bahraich_up", "state": "Uttar Pradesh", "district": "Bahraich", "region": "N2", "latitude": 27.5743, "longitude": 81.5947},
    {"station_name": "Ballia District", "hub_code": "ballia_up", "state": "Uttar Pradesh", "district": "Ballia", "region": "N2", "latitude": 25.7584, "longitude": 84.149},
    {"station_name": "Balrampur District", "hub_code": "balrampur_up", "state": "Uttar Pradesh", "district": "Balrampur", "region": "N2", "latitude": 27.43, "longitude": 82.18},
    {"station_name": "Banda District", "hub_code": "banda_up", "state": "Uttar Pradesh", "district": "Banda", "region": "N2", "latitude": 25.476, "longitude": 80.336},
    {"station_name": "Barabanki District", "hub_code": "barabanki_up", "state": "Uttar Pradesh", "district": "Barabanki", "region": "N2", "latitude": 26.9226, "longitude": 81.1834},
    {"station_name": "Bareilly District", "hub_code": "bareilly_up", "state": "Uttar Pradesh", "district": "Bareilly", "region": "N2", "latitude": 28.367, "longitude": 79.4304},
    {"station_name": "Basti District", "hub_code": "basti_up", "state": "Uttar Pradesh", "district": "Basti", "region": "N2", "latitude": 26.8, "longitude": 82.73},
    {"station_name": "Bhadohi District", "hub_code": "bhadohi_up", "state": "Uttar Pradesh", "district": "Bhadohi", "region": "N2", "latitude": 25.395, "longitude": 82.57},
    {"station_name": "Bijnor District", "hub_code": "bijnor_up", "state": "Uttar Pradesh", "district": "Bijnor", "region": "N2", "latitude": 29.3724, "longitude": 78.1358},
    {"station_name": "Budaun District", "hub_code": "budaun_up", "state": "Uttar Pradesh", "district": "Budaun", "region": "N2", "latitude": 28.0389, "longitude": 79.1267},
    {"station_name": "Bulandshahr District", "hub_code": "bulandshahr_up", "state": "Uttar Pradesh", "district": "Bulandshahr", "region": "N2", "latitude": 28.407, "longitude": 77.8498},
    {"station_name": "Chandauli District", "hub_code": "chandauli_up", "state": "Uttar Pradesh", "district": "Chandauli", "region": "N2", "latitude": 25.26, "longitude": 83.27},
    {"station_name": "Chitrakoot District", "hub_code": "chitrakoot_up", "state": "Uttar Pradesh", "district": "Chitrakoot", "region": "N2", "latitude": 25.2, "longitude": 80.9},
    {"station_name": "Deoria District", "hub_code": "deoria_up", "state": "Uttar Pradesh", "district": "Deoria", "region": "N2", "latitude": 26.5024, "longitude": 83.7791},
    {"station_name": "Etah District", "hub_code": "etah_up", "state": "Uttar Pradesh", "district": "Etah", "region": "N2", "latitude": 27.5588, "longitude": 78.6627},
    {"station_name": "Etawah District", "hub_code": "etawah_up", "state": "Uttar Pradesh", "district": "Etawah", "region": "N2", "latitude": 26.7855, "longitude": 79.0215},
    {"station_name": "Farrukhabad District", "hub_code": "farrukhabad_up", "state": "Uttar Pradesh", "district": "Farrukhabad", "region": "N2", "latitude": 27.391, "longitude": 79.58},
    {"station_name": "Fatehpur District", "hub_code": "fatehpur_up", "state": "Uttar Pradesh", "district": "Fatehpur", "region": "N2", "latitude": 25.9304, "longitude": 80.8138},
    {"station_name": "Firozabad District", "hub_code": "firozabad_up", "state": "Uttar Pradesh", "district": "Firozabad", "region": "N2", "latitude": 27.1592, "longitude": 78.3957},
    {"station_name": "Gautam Buddha Nagar District", "hub_code": "gautam_buddha_nagar_up", "state": "Uttar Pradesh", "district": "Gautam Buddha Nagar", "region": "N2", "latitude": 28.5355, "longitude": 77.391},
    {"station_name": "Ghaziabad District", "hub_code": "ghaziabad_up", "state": "Uttar Pradesh", "district": "Ghaziabad", "region": "N2", "latitude": 28.6692, "longitude": 77.4538},
    {"station_name": "Ghazipur District", "hub_code": "ghazipur_up", "state": "Uttar Pradesh", "district": "Ghazipur", "region": "N2", "latitude": 25.588, "longitude": 83.578},
    {"station_name": "Gonda District", "hub_code": "gonda_up", "state": "Uttar Pradesh", "district": "Gonda", "region": "N2", "latitude": 27.1339, "longitude": 81.9619},
    {"station_name": "Gorakhpur District", "hub_code": "gorakhpur_up", "state": "Uttar Pradesh", "district": "Gorakhpur", "region": "N2", "latitude": 26.7606, "longitude": 83.3732},
    {"station_name": "Hamirpur District", "hub_code": "hamirpur_up", "state": "Uttar Pradesh", "district": "Hamirpur", "region": "N2", "latitude": 25.956, "longitude": 80.148},
    {"station_name": "Hapur District", "hub_code": "hapur_up", "state": "Uttar Pradesh", "district": "Hapur", "region": "N2", "latitude": 28.7306, "longitude": 77.7759},
    {"station_name": "Hardoi District", "hub_code": "hardoi_up", "state": "Uttar Pradesh", "district": "Hardoi", "region": "N2", "latitude": 27.395, "longitude": 80.13},
    {"station_name": "Hathras District", "hub_code": "hathras_up", "state": "Uttar Pradesh", "district": "Hathras", "region": "N2", "latitude": 27.596, "longitude": 78.053},
    {"station_name": "Jalaun District", "hub_code": "jalaun_up", "state": "Uttar Pradesh", "district": "Jalaun", "region": "N2", "latitude": 25.99, "longitude": 79.45},
    {"station_name": "Jaunpur District", "hub_code": "jaunpur_up", "state": "Uttar Pradesh", "district": "Jaunpur", "region": "N2", "latitude": 25.7463, "longitude": 82.6836},
    {"station_name": "Jhansi District", "hub_code": "jhansi_up", "state": "Uttar Pradesh", "district": "Jhansi", "region": "N2", "latitude": 25.4484, "longitude": 78.5685},
    {"station_name": "Kannauj District", "hub_code": "kannauj_up", "state": "Uttar Pradesh", "district": "Kannauj", "region": "N2", "latitude": 27.0514, "longitude": 79.9151},
    {"station_name": "Kanpur Dehat District", "hub_code": "kanpur_dehat_up", "state": "Uttar Pradesh", "district": "Kanpur Dehat", "region": "N2", "latitude": 26.43, "longitude": 79.99},
    {"station_name": "Kanpur Nagar District", "hub_code": "kanpur_nagar_up", "state": "Uttar Pradesh", "district": "Kanpur Nagar", "region": "N2", "latitude": 26.4499, "longitude": 80.3319},
    {"station_name": "Kasganj District", "hub_code": "kasganj_up", "state": "Uttar Pradesh", "district": "Kasganj", "region": "N2", "latitude": 27.808, "longitude": 78.648},
    {"station_name": "Kaushambi District", "hub_code": "kaushambi_up", "state": "Uttar Pradesh", "district": "Kaushambi", "region": "N2", "latitude": 25.53, "longitude": 81.38},
    {"station_name": "Kushinagar District", "hub_code": "kushinagar_up", "state": "Uttar Pradesh", "district": "Kushinagar", "region": "N2", "latitude": 26.905, "longitude": 83.98},
    {"station_name": "Lakhimpur Kheri District", "hub_code": "lakhimpur_kheri_up", "state": "Uttar Pradesh", "district": "Lakhimpur Kheri", "region": "N2", "latitude": 27.947, "longitude": 80.78},
    {"station_name": "Lalitpur District", "hub_code": "lalitpur_up", "state": "Uttar Pradesh", "district": "Lalitpur", "region": "N2", "latitude": 24.69, "longitude": 78.41},
    {"station_name": "Lucknow District", "hub_code": "lucknow_up", "state": "Uttar Pradesh", "district": "Lucknow", "region": "N2", "latitude": 26.8467, "longitude": 80.9462},
    {"station_name": "Maharajganj District", "hub_code": "maharajganj_up", "state": "Uttar Pradesh", "district": "Maharajganj", "region": "N2", "latitude": 27.14, "longitude": 83.56},
    {"station_name": "Mahoba District", "hub_code": "mahoba_up", "state": "Uttar Pradesh", "district": "Mahoba", "region": "N2", "latitude": 25.292, "longitude": 79.873},
    {"station_name": "Mainpuri District", "hub_code": "mainpuri_up", "state": "Uttar Pradesh", "district": "Mainpuri", "region": "N2", "latitude": 27.235, "longitude": 79.025},
    {"station_name": "Mathura District", "hub_code": "mathura_up", "state": "Uttar Pradesh", "district": "Mathura", "region": "N2", "latitude": 27.4924, "longitude": 77.6737},
    {"station_name": "Mau District", "hub_code": "mau_up", "state": "Uttar Pradesh", "district": "Mau", "region": "N2", "latitude": 25.9417, "longitude": 83.5611},
    {"station_name": "Meerut District", "hub_code": "meerut_up", "state": "Uttar Pradesh", "district": "Meerut", "region": "N2", "latitude": 28.9845, "longitude": 77.7064},
    {"station_name": "Mirzapur District", "hub_code": "mirzapur_up", "state": "Uttar Pradesh", "district": "Mirzapur", "region": "N2", "latitude": 25.146, "longitude": 82.569},
    {"station_name": "Moradabad District", "hub_code": "moradabad_up", "state": "Uttar Pradesh", "district": "Moradabad", "region": "N2", "latitude": 28.8386, "longitude": 78.7733},
    {"station_name": "Muzaffarnagar District", "hub_code": "muzaffarnagar_up", "state": "Uttar Pradesh", "district": "Muzaffarnagar", "region": "N2", "latitude": 29.4727, "longitude": 77.7085},
    {"station_name": "Pilibhit District", "hub_code": "pilibhit_up", "state": "Uttar Pradesh", "district": "Pilibhit", "region": "N2", "latitude": 28.631, "longitude": 79.804},
    {"station_name": "Pratapgarh (UP) District", "hub_code": "pratapgarh_up", "state": "Uttar Pradesh", "district": "Pratapgarh", "region": "N2", "latitude": 25.897, "longitude": 81.945},
    {"station_name": "Prayagraj District", "hub_code": "prayagraj_up", "state": "Uttar Pradesh", "district": "Prayagraj", "region": "N2", "latitude": 25.4358, "longitude": 81.8463},
    {"station_name": "Raebareli District", "hub_code": "raebareli_up", "state": "Uttar Pradesh", "district": "Raebareli", "region": "N2", "latitude": 26.2345, "longitude": 81.2409},
    {"station_name": "Rampur District", "hub_code": "rampur_up", "state": "Uttar Pradesh", "district": "Rampur", "region": "N2", "latitude": 28.81, "longitude": 79.03},
    {"station_name": "Saharanpur District", "hub_code": "saharanpur_up", "state": "Uttar Pradesh", "district": "Saharanpur", "region": "N2", "latitude": 29.968, "longitude": 77.551},
    {"station_name": "Sambhal District", "hub_code": "sambhal_up", "state": "Uttar Pradesh", "district": "Sambhal", "region": "N2", "latitude": 28.585, "longitude": 78.571},
    {"station_name": "Sant Kabir Nagar District", "hub_code": "sant_kabir_nagar_up", "state": "Uttar Pradesh", "district": "Sant Kabir Nagar", "region": "N2", "latitude": 26.77, "longitude": 83.07},
    {"station_name": "Shahjahanpur District", "hub_code": "shahjahanpur_up", "state": "Uttar Pradesh", "district": "Shahjahanpur", "region": "N2", "latitude": 27.883, "longitude": 79.91},
    {"station_name": "Shamli District", "hub_code": "shamli_up", "state": "Uttar Pradesh", "district": "Shamli", "region": "N2", "latitude": 29.45, "longitude": 77.31},
    {"station_name": "Shravasti District", "hub_code": "shravasti_up", "state": "Uttar Pradesh", "district": "Shravasti", "region": "N2", "latitude": 27.69, "longitude": 81.93},
    {"station_name": "Siddharthnagar District", "hub_code": "siddharthnagar_up", "state": "Uttar Pradesh", "district": "Siddharthnagar", "region": "N2", "latitude": 27.29, "longitude": 83.09},
    {"station_name": "Sitapur District", "hub_code": "sitapur_up", "state": "Uttar Pradesh", "district": "Sitapur", "region": "N2", "latitude": 27.565, "longitude": 80.683},
    {"station_name": "Sonbhadra District", "hub_code": "sonbhadra_up", "state": "Uttar Pradesh", "district": "Sonbhadra", "region": "N2", "latitude": 24.69, "longitude": 83.07},
    {"station_name": "Sultanpur District", "hub_code": "sultanpur_up", "state": "Uttar Pradesh", "district": "Sultanpur", "region": "N2", "latitude": 26.2648, "longitude": 82.0727},
    {"station_name": "Unnao District", "hub_code": "unnao_up", "state": "Uttar Pradesh", "district": "Unnao", "region": "N2", "latitude": 26.547, "longitude": 80.488},
    {"station_name": "Varanasi District", "hub_code": "varanasi_up", "state": "Uttar Pradesh", "district": "Varanasi", "region": "N2", "latitude": 25.3176, "longitude": 82.9739},
]


# ============================================================
# 3. LOGGING
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)

logger = logging.getLogger(__name__)


# ============================================================
# 4. HTTP SESSION WITH RETRIES
# ============================================================

def create_http_session():
    """
    Creates a requests session with automatic retries.
    """
    retry_strategy = Retry(
        total=5,
        connect=5,
        read=5,
        backoff_factor=2,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
        raise_on_status=False,
    )

    adapter = HTTPAdapter(
        max_retries=retry_strategy,
        pool_connections=10,
        pool_maxsize=10,
    )

    session = requests.Session()
    session.mount("https://", adapter)
    session.mount("http://", adapter)

    session.headers.update(
        {
            "User-Agent": "solar-weather-ingestion/1.0",
            "Accept": "application/json",
        }
    )

    return session


# ============================================================
# 5. DATABASE CONNECTION
# ============================================================

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)


# ============================================================
# 6. CREATE / ENSURE TABLE & COLUMNS
# ============================================================

def create_table(conn):
    """
    Ensures the weather table and all required columns exist.
    Targets public.weather_regionwise with PRIMARY KEY (location, time).
    """

    create_sql = f"""
    CREATE TABLE IF NOT EXISTS public.{TABLE_NAME} (
        location TEXT NOT NULL,
        hub_name TEXT NOT NULL,
        state TEXT NOT NULL,
        district TEXT NOT NULL,
        region TEXT NOT NULL,

        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,

        time TIMESTAMPTZ NOT NULL,

        wind_speed_10m DOUBLE PRECISION,
        shortwave_radiation DOUBLE PRECISION,

        direct_radiation DOUBLE PRECISION,
        diffuse_radiation DOUBLE PRECISION,
        direct_normal_irradiance DOUBLE PRECISION,

        wind_speed_80m DOUBLE PRECISION,
        wind_speed_120m DOUBLE PRECISION,
        wind_direction_80m DOUBLE PRECISION,
        wind_direction_120m DOUBLE PRECISION,
        wind_gusts_10m DOUBLE PRECISION,

        temperature_2m DOUBLE PRECISION,
        relative_humidity_2m DOUBLE PRECISION,
        dew_point_2m DOUBLE PRECISION,

        precipitation DOUBLE PRECISION,

        cloud_cover DOUBLE PRECISION,
        cloud_cover_low DOUBLE PRECISION,
        cloud_cover_mid DOUBLE PRECISION,
        cloud_cover_high DOUBLE PRECISION,

        visibility DOUBLE PRECISION,
        surface_pressure DOUBLE PRECISION,

        soil_moisture_0_to_1cm DOUBLE PRECISION,
        soil_moisture_1_to_3cm DOUBLE PRECISION,

        is_day INTEGER,

        created_at TIMESTAMPTZ DEFAULT NOW(),

        PRIMARY KEY (location, time)
    );
    """

    new_cols = [
        ("state", "TEXT"),
        ("district", "TEXT"),
        ("wind_speed_10m", "DOUBLE PRECISION"),
        ("shortwave_radiation", "DOUBLE PRECISION"),
        ("direct_radiation", "DOUBLE PRECISION"),
        ("diffuse_radiation", "DOUBLE PRECISION"),
        ("direct_normal_irradiance", "DOUBLE PRECISION"),
        ("wind_speed_80m", "DOUBLE PRECISION"),
        ("wind_speed_120m", "DOUBLE PRECISION"),
        ("wind_direction_80m", "DOUBLE PRECISION"),
        ("wind_direction_120m", "DOUBLE PRECISION"),
        ("wind_gusts_10m", "DOUBLE PRECISION"),
        ("temperature_2m", "DOUBLE PRECISION"),
        ("relative_humidity_2m", "DOUBLE PRECISION"),
        ("dew_point_2m", "DOUBLE PRECISION"),
        ("precipitation", "DOUBLE PRECISION"),
        ("cloud_cover", "DOUBLE PRECISION"),
        ("cloud_cover_low", "DOUBLE PRECISION"),
        ("cloud_cover_mid", "DOUBLE PRECISION"),
        ("cloud_cover_high", "DOUBLE PRECISION"),
        ("visibility", "DOUBLE PRECISION"),
        ("surface_pressure", "DOUBLE PRECISION"),
        ("soil_moisture_0_to_1cm", "DOUBLE PRECISION"),
        ("soil_moisture_1_to_3cm", "DOUBLE PRECISION"),
        ("is_day", "INTEGER"),
    ]

    index_sql = f"""
    CREATE INDEX IF NOT EXISTS idx_{TABLE_NAME}_hub_time
        ON public.{TABLE_NAME} (hub_name, time);

    CREATE INDEX IF NOT EXISTS idx_{TABLE_NAME}_state_time
        ON public.{TABLE_NAME} (state, time);

    CREATE INDEX IF NOT EXISTS idx_{TABLE_NAME}_region_time
        ON public.{TABLE_NAME} (region, time);

    CREATE INDEX IF NOT EXISTS idx_{TABLE_NAME}_time
        ON public.{TABLE_NAME} (time);
    """

    with conn.cursor() as cur:
        cur.execute(create_sql)
        for col_name, col_type in new_cols:
            cur.execute(f"ALTER TABLE public.{TABLE_NAME} ADD COLUMN IF NOT EXISTS {col_name} {col_type};")
        cur.execute(index_sql)

    conn.commit()
    logger.info("Database table 'public.%s' and indexes are verified ready.", TABLE_NAME)


# ============================================================
# 7. API PARAMETERS
# ============================================================

def build_api_params(latitude, longitude):
    """
    Builds the Open-Meteo Historical Forecast API parameters.
    Includes wind_speed_10m + all 22 ML variables without *_instant variables.
    """

    minutely_15_variables = ",".join(
        [
            # Solar
            "shortwave_radiation",
            "direct_radiation",
            "diffuse_radiation",
            "direct_normal_irradiance",

            # Wind
            "wind_speed_10m",
            "wind_speed_80m",
            "wind_speed_120m",
            "wind_direction_80m",
            "wind_direction_120m",
            "wind_gusts_10m",

            # Temperature / humidity
            "temperature_2m",
            "relative_humidity_2m",
            "dew_point_2m",

            # Precipitation
            "precipitation",

            # Clouds
            "cloud_cover",
            "cloud_cover_low",
            "cloud_cover_mid",
            "cloud_cover_high",

            # Atmospheric
            "visibility",
            "surface_pressure",

            # Soil
            "soil_moisture_0_to_1cm",
            "soil_moisture_1_to_3cm",

            # Day / night
            "is_day",
        ]
    )

    return {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": START_DATE,
        "end_date": END_DATE,
        "minutely_15": minutely_15_variables,
        "timezone": TIMEZONE,
        "wind_speed_unit": "ms",
        "temperature_unit": "celsius",
        "precipitation_unit": "mm",
    }


# ============================================================
# 8. FETCH WEATHER DATA
# ============================================================

def fetch_weather(session, location):
    """
    Downloads historical weather data for one location.
    """

    params = build_api_params(
        location["latitude"],
        location["longitude"],
    )

    station_name = location.get("station_name", location.get("hub_name"))
    hub_code = location.get("hub_code", location.get("location"))

    logger.info(
        "Requesting %s (%s) | %s to %s",
        station_name,
        hub_code,
        START_DATE,
        END_DATE,
    )

    response = session.get(
        OPEN_METEO_WEATHER_URL,
        params=params,
        timeout=120,
    )

    if response.status_code != 200:
        raise RuntimeError(
            f"Open-Meteo API error "
            f"{response.status_code}: {response.text[:1000]}"
        )

    data = response.json()

    if "minutely_15" not in data:
        raise RuntimeError(
            "API response does not contain 'minutely_15'."
        )

    return data["minutely_15"]


# ============================================================
# 9. SAFE VALUE EXTRACTION
# ============================================================

def get_value(data, key, index):
    """
    Safely gets one value from an Open-Meteo array.
    """

    values = data.get(key)
    if values is None or index >= len(values):
        return None
    return values[index]


# ============================================================
# 10. PARSE API RESPONSE
# ============================================================

def parse_weather_rows(weather_data, location):
    """
    Converts Open-Meteo minutely_15 response into PostgreSQL rows matching weather_regionwise.
    """

    times = weather_data.get("time", [])
    rows = []

    station_name = location.get("station_name", location.get("hub_name"))
    hub_code = location.get("hub_code", location.get("location"))

    for i, timestamp in enumerate(times):
        row = (
            # Location in weather_regionwise = Station Name
            station_name,
            # Hub_name in weather_regionwise = Hub Cluster Code
            hub_code,
            location["state"],
            location["district"],
            location["region"],
            location["latitude"],
            location["longitude"],

            # Time
            timestamp,

            # Standard 10m wind speed
            get_value(weather_data, "wind_speed_10m", i),

            # Solar
            get_value(weather_data, "shortwave_radiation", i),
            get_value(weather_data, "direct_radiation", i),
            get_value(weather_data, "diffuse_radiation", i),
            get_value(weather_data, "direct_normal_irradiance", i),

            # Wind
            get_value(weather_data, "wind_speed_80m", i),
            get_value(weather_data, "wind_speed_120m", i),
            get_value(weather_data, "wind_direction_80m", i),
            get_value(weather_data, "wind_direction_120m", i),
            get_value(weather_data, "wind_gusts_10m", i),

            # Temperature / humidity
            get_value(weather_data, "temperature_2m", i),
            get_value(weather_data, "relative_humidity_2m", i),
            get_value(weather_data, "dew_point_2m", i),

            # Precipitation
            get_value(weather_data, "precipitation", i),

            # Clouds
            get_value(weather_data, "cloud_cover", i),
            get_value(weather_data, "cloud_cover_low", i),
            get_value(weather_data, "cloud_cover_mid", i),
            get_value(weather_data, "cloud_cover_high", i),

            # Atmospheric
            get_value(weather_data, "visibility", i),
            get_value(weather_data, "surface_pressure", i),

            # Soil
            get_value(weather_data, "soil_moisture_0_to_1cm", i),
            get_value(weather_data, "soil_moisture_1_to_3cm", i),

            # Day / night
            get_value(weather_data, "is_day", i),
        )

        rows.append(row)

    return rows


# ============================================================
# 11. INSERT / UPSERT DATA
# ============================================================

def insert_weather_rows(conn, rows):
    """
    Inserts rows into PostgreSQL table weather_regionwise.
    Existing rows are updated using PRIMARY KEY (location, time).
    """

    if not rows:
        return 0

    insert_sql = f"""
    INSERT INTO public.{TABLE_NAME} (
        location,
        hub_name,
        state,
        district,
        region,
        latitude,
        longitude,
        time,

        wind_speed_10m,
        shortwave_radiation,
        direct_radiation,
        diffuse_radiation,
        direct_normal_irradiance,

        wind_speed_80m,
        wind_speed_120m,
        wind_direction_80m,
        wind_direction_120m,
        wind_gusts_10m,

        temperature_2m,
        relative_humidity_2m,
        dew_point_2m,

        precipitation,

        cloud_cover,
        cloud_cover_low,
        cloud_cover_mid,
        cloud_cover_high,

        visibility,
        surface_pressure,

        soil_moisture_0_to_1cm,
        soil_moisture_1_to_3cm,

        is_day
    )
    VALUES %s

    ON CONFLICT (location, time)
    DO UPDATE SET

        hub_name = EXCLUDED.hub_name,
        state = EXCLUDED.state,
        district = EXCLUDED.district,
        region = EXCLUDED.region,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,

        wind_speed_10m = EXCLUDED.wind_speed_10m,
        shortwave_radiation = EXCLUDED.shortwave_radiation,
        direct_radiation = EXCLUDED.direct_radiation,
        diffuse_radiation = EXCLUDED.diffuse_radiation,
        direct_normal_irradiance = EXCLUDED.direct_normal_irradiance,

        wind_speed_80m = EXCLUDED.wind_speed_80m,
        wind_speed_120m = EXCLUDED.wind_speed_120m,
        wind_direction_80m = EXCLUDED.wind_direction_80m,
        wind_direction_120m = EXCLUDED.wind_direction_120m,
        wind_gusts_10m = EXCLUDED.wind_gusts_10m,

        temperature_2m = EXCLUDED.temperature_2m,
        relative_humidity_2m = EXCLUDED.relative_humidity_2m,
        dew_point_2m = EXCLUDED.dew_point_2m,

        precipitation = EXCLUDED.precipitation,

        cloud_cover = EXCLUDED.cloud_cover,
        cloud_cover_low = EXCLUDED.cloud_cover_low,
        cloud_cover_mid = EXCLUDED.cloud_cover_mid,
        cloud_cover_high = EXCLUDED.cloud_cover_high,

        visibility = EXCLUDED.visibility,
        surface_pressure = EXCLUDED.surface_pressure,

        soil_moisture_0_to_1cm = EXCLUDED.soil_moisture_0_to_1cm,
        soil_moisture_1_to_3cm = EXCLUDED.soil_moisture_1_to_3cm,

        is_day = EXCLUDED.is_day;
    """

    total_inserted = 0

    with conn.cursor() as cur:
        for start in range(0, len(rows), BATCH_SIZE):
            batch = rows[start:start + BATCH_SIZE]
            execute_values(
                cur,
                insert_sql,
                batch,
                page_size=BATCH_SIZE,
            )
            total_inserted += len(batch)

    conn.commit()
    return total_inserted


# ============================================================
# 12. PROCESS ONE LOCATION
# ============================================================

def process_location(location, index, total):
    """
    Fetch + parse + insert one location into weather_regionwise.
    """
    station_name = location.get("station_name", location.get("hub_name"))
    session = create_http_session()
    conn = None

    try:
        conn = get_db_connection()
        weather_data = fetch_weather(
            session,
            location,
        )

        rows = parse_weather_rows(
            weather_data,
            location,
        )

        if not rows:
            logger.warning(
                "No rows returned for %s",
                station_name,
            )
            return 0

        inserted = insert_weather_rows(
            conn,
            rows,
        )

        logger.info(
            "SUCCESS [%2d/%2d] | %-30s | rows=%d",
            index, total, station_name, inserted,
        )

        return inserted

    except Exception as exc:
        if conn:
            conn.rollback()
        logger.exception(
            "FAILED  [%2d/%2d] | %s | %s",
            index, total, station_name, exc,
        )
        return 0
    finally:
        if conn:
            conn.close()
        session.close()


# ============================================================
# 13. MAIN
# ============================================================

def main():
    start_time = datetime.now()
    total_locations = len(LOCATIONS)

    logger.info("=" * 70)
    logger.info("SOLAR-STATE DISTRICT WEATHER INGESTION -> public.%s", TABLE_NAME)
    logger.info("=" * 70)
    logger.info("Date range: %s -> %s", START_DATE, END_DATE)
    logger.info("Locations (districts): %d", total_locations)
    logger.info("Timezone: %s", TIMEZONE)
    logger.info("Target Table: public.%s", TABLE_NAME)
    logger.info("Workers: %d concurrent threads", MAX_WORKERS)

    conn = None
    try:
        conn = get_db_connection()
        logger.info("Connected to PostgreSQL [%s@%s:%s].", DB_CONFIG["database"], DB_CONFIG["host"], DB_CONFIG["port"])
        create_table(conn)
    except Exception as exc:
        logger.exception("Fatal error during init: %s", exc)
        if conn:
            conn.close()
        raise
    finally:
        if conn:
            conn.close()

    total_rows = 0
    successful_locations = 0
    failed_locations = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_loc = {
            executor.submit(process_location, loc, idx, total_locations): loc
            for idx, loc in enumerate(LOCATIONS, 1)
        }

        for future in as_completed(future_to_loc):
            loc = future_to_loc[future]
            try:
                inserted = future.result()
                if inserted > 0:
                    successful_locations += 1
                    total_rows += inserted
                else:
                    failed_locations += 1
            except Exception as e:
                logger.error("Exception for %s: %s", loc.get("station_name", loc.get("hub_name")), e)
                failed_locations += 1

    # Verification query
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(f"""
                SELECT count(*), min(time), max(time), count(DISTINCT location), count(DISTINCT state), count(DISTINCT region)
                FROM public.{TABLE_NAME};
            """)
            db_stats = cur.fetchone()
            cur.execute(f"""
                SELECT count(*)
                FROM public.{TABLE_NAME}
                WHERE temperature_2m IS NOT NULL;
            """)
            enriched_count = cur.fetchone()[0]

            logger.info("=" * 70)
            logger.info("Table Verification [public.%s]:", TABLE_NAME)
            logger.info("  Total Records in DB      : %s", f"{db_stats[0]:,}" if db_stats[0] else "0")
            logger.info("  Records with ML Features : %s", f"{enriched_count:,}")
            logger.info("  Earliest Timestamp       : %s", db_stats[1])
            logger.info("  Latest Timestamp         : %s", db_stats[2])
            logger.info("  Distinct Stations        : %s", db_stats[3])
            logger.info("  Distinct States          : %s", db_stats[4])
            logger.info("  Distinct Regions         : %s", db_stats[5])
            logger.info("=" * 70)
        conn.close()
    except Exception as exc:
        logger.error("Verification failed: %s", exc)

    elapsed = datetime.now() - start_time

    logger.info("=" * 70)
    logger.info("INGESTION COMPLETE")
    logger.info("=" * 70)
    logger.info("Successful locations: %d / %d", successful_locations, total_locations)
    logger.info("Failed locations: %d", failed_locations)
    logger.info("Total rows processed: %d", total_rows)
    logger.info("Elapsed time: %s", elapsed)


# ============================================================
# 14. ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()
