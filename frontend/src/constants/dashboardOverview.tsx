import React from 'react';
import { 
  BarChart as ChartIcon, 
  ElectricBolt as BoltIcon, 
  Timer as TimerIcon,
  Public as PublicIcon,
  Business as BusinessIcon,
  ReceiptLong as ReceiptIcon,
  AccountBalanceWallet as WalletIcon,
  Hub as HubIcon,
  SettingsInputComponent as SettingsIcon,
  PriceCheck as PriceCheckIcon,
  Timeline as TimelineIcon,
  Map as MapIcon,
  Cloud as CloudIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';

export type OverviewItemType = 'market' | 'resource' | 'database';

export interface OverviewItemConfig {
  key: string;
  title: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  color: string;
  subItems?: { key: string; title: string; path: string; icon?: React.ReactNode; }[];
}

export const MARKET_ITEMS: OverviewItemConfig[] = [
  { 
    key: 'dam', 
    title: 'Day Ahead Market', 
    description: 'Day Ahead Market analytics and data.',
    path: '/dam', 
    icon: <ChartIcon fontSize="medium" />, 
    color: '#3B8FF3'
  },
  { 
    key: 'gdam', 
    title: 'Green Day Ahead Market', 
    description: 'Green Day Ahead Market analytics and data.',
    path: '/gdam', 
    icon: <BoltIcon fontSize="medium" />, 
    color: '#34B1AA'
  },
  { 
    key: 'rtm', 
    title: 'Real Time Market', 
    description: 'Real Time Market analytics and data.',
    path: '/rtm', 
    icon: <TimerIcon fontSize="medium" />, 
    color: '#E0B50F'
  },
];

export const RESOURCE_CENTER_ITEMS: OverviewItemConfig[] = [
  {
    key: 'region-state',
    title: 'Region State',
    description: 'Master mapping of Regions, Regional Grids, States and Union Territories.',
    path: '/resource-center/region-state',
    icon: <PublicIcon fontSize="medium" />,
    color: '#8E24AA'
  },
  {
    key: 'discom-list',
    title: 'Discom List',
    description: 'Master catalogue of all DISCOMs and their classifications.',
    path: '/resource-center/discom-list',
    icon: <BusinessIcon fontSize="medium" />,
    color: '#00897B'
  },
  {
    key: 'ists-charges',
    title: 'ISTS Charges',
    description: 'Interstate Transmission System loss percentages.',
    path: '/resource-center/ists-charges',
    icon: <BoltIcon fontSize="medium" />,
    color: '#E53935'
  },
  {
    key: 'iex-fees',
    title: 'IEX Fees',
    description: 'Exchange fee configuration and associated charges.',
    path: '/resource-center/iex-fees',
    icon: <ReceiptIcon fontSize="medium" />,
    color: '#FB8C00'
  },
  {
    key: 'prolt-margin',
    title: 'ProLT Margin',
    description: 'Customer trading and ProLT margin definitions.',
    path: '/resource-center/prolt-margin',
    icon: <WalletIcon fontSize="medium" />,
    color: '#3949AB'
  },
  {
    key: 'ctu-charges',
    title: 'CTU Charges',
    description: 'Central Transmission Utility charge configurations.',
    path: '/resource-center/ctu-charges',
    icon: <HubIcon fontSize="medium" />,
    color: '#C0CA33'
  },
  {
    key: 'stu-charges',
    title: 'STU Charges',
    description: 'State Transmission Utility charges and wheeling configurations.',
    path: '/resource-center/stu-charges',
    icon: <SettingsIcon fontSize="medium" />,
    color: '#546E7A'
  },
  {
    key: 'state-tariff',
    title: 'State Tariff',
    description: 'State-wise tariff schedules and Time-of-Day energy charges.',
    path: '/resource-center/state-tariff',
    icon: <PriceCheckIcon fontSize="medium" />,
    color: '#00ACC1'
  }
];

export const DATABASE_ITEMS: OverviewItemConfig[] = [
  {
    key: 'demand-generation',
    title: 'Demand & Generation',
    description: 'National power demand met and generation data across India.',
    path: '/database/all-india-demand', // fallback path
    icon: <TimelineIcon fontSize="medium" />,
    color: '#3B8FF3',
    subItems: [
      { key: 'all-india-demand', title: 'All India Demand', path: '/database/all-india-demand', icon: <TimelineIcon fontSize="small" /> },
      { key: 'state-wise-demand', title: 'State Wise Demand', path: '/database/state-wise-demand', icon: <MapIcon fontSize="small" /> }
    ]
  },
  {
    key: 'weather',
    title: 'Weather Analytics',
    description: 'Historical weather data from Open-Meteo.',
    path: '/database/weather',
    icon: <CloudIcon fontSize="medium" />,
    color: '#E0B50F'
  },
  {
    key: 'holiday-calendar',
    title: 'Holiday Calendar',
    description: 'Trading and settlement holidays for power exchanges.',
    path: '/database/holiday-calendar',
    icon: <CalendarIcon fontSize="medium" />,
    color: '#E91E63'
  }
];
