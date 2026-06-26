import { useState } from 'react';

export type IntervalFilter = '15min' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface MarketFilters {
  date: string; // YYYY-MM-DD
  interval: IntervalFilter;
}

export function useMarketFilters(initialDate: string = new Date().toISOString().split('T')[0], initialInterval: IntervalFilter = '15min') {
  const [filters, setFilters] = useState<MarketFilters>({
    date: initialDate,
    interval: initialInterval,
  });

  const handleDateChange = (newDate: string) => {
    setFilters((prev) => ({ ...prev, date: newDate }));
  };

  const handleIntervalChange = (newInterval: IntervalFilter) => {
    setFilters((prev) => ({ ...prev, interval: newInterval }));
  };

  const resetFilters = () => {
    setFilters({
      date: initialDate,
      interval: initialInterval,
    });
  };

  return {
    filters,
    handleDateChange,
    handleIntervalChange,
    resetFilters,
  };
}
