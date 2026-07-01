import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import DAMPage from '../pages/DAMPage';
import GDAMPage from '../pages/GDAMPage';
import RTMPage from '../pages/RTMPage';
import RegionStatePage from '../pages/resource-center/RegionStatePage';
import DiscomListPage from '../pages/resource-center/DiscomListPage';
import IstsChargesPage from '../pages/resource-center/IstsChargesPage';
import IexFeesPage from '../pages/resource-center/IexFeesPage';
import ProltMarginPage from '../pages/resource-center/ProltMarginPage';
import CtuChargesPage from '../pages/resource-center/CtuChargesPage';
import StuChargesPage from '../pages/resource-center/StuChargesPage';
import StateTariffPage from '../pages/resource-center/StateTariffPage';
import DashboardPage from '../pages/DashboardPage';
import ModuleLandingPage from '../pages/ModuleLandingPage';
import AdminPage from '../pages/AdminPage';
import MarketDataAdminPage from '../pages/admin/MarketDataAdminPage';
import ResourceCenterAdminPage from '../pages/admin/ResourceCenterAdminPage';
import AdminResourcePage from '../pages/admin/resource-center/AdminResourcePage';
import DatabasePage from '../pages/DatabasePage';
import LoginPage from '../pages/LoginPage';
import ProtectedRoute from '../components/ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          
          {/* Module Landing Pages */}
          <Route path="database" element={<ModuleLandingPage type="database" />} />
          <Route path="markets" element={<ModuleLandingPage type="market" />} />
          <Route path="resource-center" element={<ModuleLandingPage type="resource" />} />

          {/* Database Sub-pages */}
          <Route path="database/all-india-demand" element={<DatabasePage />} />
          <Route path="database/generation-data" element={<DatabasePage />} />
          <Route path="database/state-wise-demand" element={<DatabasePage />} />
          <Route path="database/weather" element={<DatabasePage />} />

          {/* Market Sub-pages */}
          <Route path="dam" element={<DAMPage />} />
          <Route path="gdam" element={<GDAMPage />} />
          <Route path="rtm" element={<RTMPage />} />
          
          {/* Resource Center Sub-pages */}
          <Route path="resource-center/region-state" element={<RegionStatePage />} />
          <Route path="resource-center/discom-list" element={<DiscomListPage />} />
          <Route path="resource-center/ists-charges" element={<IstsChargesPage />} />
          <Route path="resource-center/iex-fees" element={<IexFeesPage />} />
          <Route path="resource-center/prolt-margin" element={<ProltMarginPage />} />
          <Route path="resource-center/ctu-charges" element={<CtuChargesPage />} />
          <Route path="resource-center/stu-charges" element={<StuChargesPage />} />
          <Route path="resource-center/state-tariff" element={<StateTariffPage />} />
          
          {/* Admin routes are now just nested under the already protected layout */}
          <Route path="admin">
            <Route index element={<AdminPage />} />
            <Route path="market-data" element={<MarketDataAdminPage />} />
            <Route path="resource-center" element={<ResourceCenterAdminPage />} />
            <Route path="resource-center/:resourceType" element={<AdminResourcePage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
