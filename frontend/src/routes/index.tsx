import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import DashboardLayout from '../layouts/DashboardLayout';
import ModuleLayout from '../layouts/ModuleLayout';
import ProtectedRoute from '../components/ProtectedRoute';

// Lazy Loaded Pages
const DAMPage = lazy(() => import('../pages/DAMPage'));
const GDAMPage = lazy(() => import('../pages/GDAMPage'));
const RTMPage = lazy(() => import('../pages/RTMPage'));
const RECPage = lazy(() => import('../pages/RECPage'));
const RegionStatePage = lazy(() => import('../pages/resource-center/RegionStatePage'));
const DiscomListPage = lazy(() => import('../pages/resource-center/DiscomListPage'));
const IstsChargesPage = lazy(() => import('../pages/resource-center/IstsChargesPage'));
const IexFeesPage = lazy(() => import('../pages/resource-center/IexFeesPage'));

const CtuChargesPage = lazy(() => import('../pages/resource-center/CtuChargesPage'));
const StateChargesPage = lazy(() => import('../pages/resource-center/StateChargesPage'));
const StateTariffPage = lazy(() => import('../pages/resource-center/StateTariffPage'));
const FppaChargesPage = lazy(() => import('../pages/resource-center/FppaChargesPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const AdminPage = lazy(() => import('../pages/AdminPage'));
const MarketDataAdminPage = lazy(() => import('../pages/admin/MarketDataAdminPage'));
const ResourceCenterAdminPage = lazy(() => import('../pages/admin/ResourceCenterAdminPage'));
const AdminResourcePage = lazy(() => import('../pages/admin/resource-center/AdminResourcePage'));
const ApiLogsAdminPage = lazy(() => import('../pages/admin/ApiLogsAdminPage'));
const UserManagementPage = lazy(() => import('../pages/UserManagementPage'));
const DatabasePage = lazy(() => import('../pages/DatabasePage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const MarketOperationsPage = lazy(() => import('../pages/market-operations/MarketOperationsPage'));
const McpAnalystPage = lazy(() => import('../pages/market-operations/McpAnalystPage'));
const BiddingStrategyPage = lazy(() => import('../pages/market-operations/BiddingStrategyPage'));
const SavingsCalculatorPage = lazy(() => import('../pages/SavingsCalculatorPage'));
const SavingsCalculatorViewPage = lazy(() => import('../pages/SavingsCalculatorViewPage'));
const SavingsCalculatorAnalysisPage = lazy(() => import('../pages/SavingsCalculatorAnalysisPage'));
const ForecastPage = lazy(() => import('../pages/ForecastPage'));
const CustomerLeadPage = lazy(() => import('../pages/CustomerLeadPage'));

const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <CircularProgress />
  </Box>
);

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="customer-lead" element={<CustomerLeadPage />} />
          <Route path="savings-calculator" element={<SavingsCalculatorPage />} />
          <Route path="savings-calculator/view/:id" element={<SavingsCalculatorViewPage />} />
          <Route path="savings-calculator/analysis/:id" element={<SavingsCalculatorAnalysisPage />} />
          
          {/* Module Layout wrapping all module sub-pages */}
          <Route element={<ModuleLayout />}>
            {/* Database Sub-pages */}
            <Route element={<ProtectedRoute requireAdmin />}>
              <Route path="database/all-india-demand" element={<DatabasePage />} />
              <Route path="database/generation-data" element={<DatabasePage />} />
              <Route path="database/state-wise-demand" element={<DatabasePage />} />
              <Route path="database/city-state-data" element={<DatabasePage />} />
              <Route path="database/weather" element={<Navigate to="/database/weather/forecast" replace />} />
              <Route path="database/weather/forecast" element={<DatabasePage />} />
              <Route path="database/weather/historical" element={<DatabasePage />} />
              <Route path="database/holiday-calendar" element={<DatabasePage />} />
              <Route path="database" element={<Navigate to="/database/all-india-demand" replace />} />
            </Route>

            {/* Market Sub-pages */}
            <Route path="dam" element={<DAMPage />} />
            <Route path="gdam" element={<GDAMPage />} />
            <Route path="rtm" element={<RTMPage />} />
            <Route path="rec" element={<RECPage />} />
            <Route path="market-operations" element={<Navigate to="/market-operations/trend" replace />} />
            <Route path="market-operations/trend" element={<MarketOperationsPage />} />
            <Route path="market-operations/mcp-analyst" element={<McpAnalystPage />} />
            <Route path="market-operations/bidding-strategy" element={<BiddingStrategyPage />} />
            <Route path="markets" element={<Navigate to="/dam" replace />} />
            
            {/* Forecast Sub-pages */}
            <Route path="forecast/price/dam" element={<ForecastPage />} />
            <Route path="forecast/price/rtm" element={<ForecastPage />} />
            <Route path="forecast/price/gdam" element={<ForecastPage />} />
            <Route path="forecast/demand/consumer" element={<ForecastPage />} />
            <Route path="forecast/demand/all-india" element={<ForecastPage />} />
            <Route path="forecast/generation/npp" element={<ForecastPage />} />
            <Route path="forecast/generation/npf" element={<Navigate to="/forecast/generation/npp" replace />} />
            <Route path="forecast" element={<Navigate to="/forecast/price/dam" replace />} />
            
            {/* Resource Center Sub-pages */}
            <Route path="resource-center/region-state" element={<RegionStatePage />} />
            <Route path="resource-center/discom-list" element={<DiscomListPage />} />
            <Route path="resource-center/ists-charges" element={<IstsChargesPage />} />
            <Route path="resource-center/iex-fees" element={<IexFeesPage />} />

            <Route path="resource-center/ctu-charges" element={<CtuChargesPage />} />
            <Route path="resource-center/state-charges" element={<StateChargesPage />} />
            <Route path="resource-center/state-tariff" element={<StateTariffPage />} />
            <Route path="resource-center/fppa-charges" element={<FppaChargesPage />} />
            <Route path="resource-center" element={<Navigate to="/resource-center/region-state" replace />} />
          </Route>
          
          {/* Admin routes are now restricted to admins only */}
          <Route element={<ProtectedRoute requireAdmin />}>
            <Route path="admin">
              <Route index element={<AdminPage />} />
              <Route path="market-data" element={<MarketDataAdminPage />} />
              <Route path="resource-center" element={<ResourceCenterAdminPage />} />
              <Route path="resource-center/:resourceType" element={<AdminResourcePage />} />
              <Route path="api-logs" element={<ApiLogsAdminPage />} />
            </Route>
          </Route>
          
          <Route element={<ProtectedRoute requireSuperAdmin />}>
            <Route path="admin/users" element={<UserManagementPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
    </Suspense>
  );
}
