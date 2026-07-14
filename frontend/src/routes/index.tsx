import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import ModuleLayout from '../layouts/ModuleLayout';
import DAMPage from '../pages/DAMPage';
import GDAMPage from '../pages/GDAMPage';
import RTMPage from '../pages/RTMPage';
import RECPage from '../pages/RECPage';
import RegionStatePage from '../pages/resource-center/RegionStatePage';
import DiscomListPage from '../pages/resource-center/DiscomListPage';
import IstsChargesPage from '../pages/resource-center/IstsChargesPage';
import IexFeesPage from '../pages/resource-center/IexFeesPage';
import ProltMarginPage from '../pages/resource-center/ProltMarginPage';
import CtuChargesPage from '../pages/resource-center/CtuChargesPage';
import StateChargesPage from '../pages/resource-center/StateChargesPage';
import StateTariffPage from '../pages/resource-center/StateTariffPage';
import DashboardPage from '../pages/DashboardPage';
import AdminPage from '../pages/AdminPage';
import MarketDataAdminPage from '../pages/admin/MarketDataAdminPage';
import ResourceCenterAdminPage from '../pages/admin/ResourceCenterAdminPage';
import AdminResourcePage from '../pages/admin/resource-center/AdminResourcePage';
import ApiLogsAdminPage from '../pages/admin/ApiLogsAdminPage';
import DatabasePage from '../pages/DatabasePage';
import LoginPage from '../pages/LoginPage';
import ProtectedRoute from '../components/ProtectedRoute';

import MarketOperationsPage from '../pages/market-operations/MarketOperationsPage';
import SavingsCalculatorPage from '../pages/SavingsCalculatorPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="savings-calculator" element={<SavingsCalculatorPage />} />
          
          {/* Module Layout wrapping all module sub-pages */}
          <Route element={<ModuleLayout />}>
            {/* Database Sub-pages */}
            <Route path="database/all-india-demand" element={<DatabasePage />} />
            <Route path="database/generation-data" element={<DatabasePage />} />
            <Route path="database/state-wise-demand" element={<DatabasePage />} />
            <Route path="database/city-state-data" element={<DatabasePage />} />
            <Route path="database/weather" element={<Navigate to="/database/weather/forecast" replace />} />
            <Route path="database/weather/forecast" element={<DatabasePage />} />
            <Route path="database/weather/historical" element={<DatabasePage />} />
            <Route path="database/holiday-calendar" element={<DatabasePage />} />
            <Route path="database" element={<Navigate to="/database/all-india-demand" replace />} />

            {/* Market Sub-pages */}
            <Route path="dam" element={<DAMPage />} />
            <Route path="gdam" element={<GDAMPage />} />
            <Route path="rtm" element={<RTMPage />} />
            <Route path="rec" element={<RECPage />} />
            <Route path="market-operations" element={<MarketOperationsPage />} />
            <Route path="markets" element={<Navigate to="/dam" replace />} />
            
            {/* Resource Center Sub-pages */}
            <Route path="resource-center/region-state" element={<RegionStatePage />} />
            <Route path="resource-center/discom-list" element={<DiscomListPage />} />
            <Route path="resource-center/ists-charges" element={<IstsChargesPage />} />
            <Route path="resource-center/iex-fees" element={<IexFeesPage />} />
            <Route path="resource-center/prolt-margin" element={<ProltMarginPage />} />
            <Route path="resource-center/ctu-charges" element={<CtuChargesPage />} />
            <Route path="resource-center/state-charges" element={<StateChargesPage />} />
            <Route path="resource-center/state-tariff" element={<StateTariffPage />} />
            <Route path="resource-center" element={<Navigate to="/resource-center/region-state" replace />} />
          </Route>
          
          {/* Admin routes are now just nested under the already protected layout */}
          <Route path="admin">
            <Route index element={<AdminPage />} />
            <Route path="market-data" element={<MarketDataAdminPage />} />
            <Route path="resource-center" element={<ResourceCenterAdminPage />} />
            <Route path="resource-center/:resourceType" element={<AdminResourcePage />} />
            <Route path="api-logs" element={<ApiLogsAdminPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
