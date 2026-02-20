import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WalletProvider } from "./hooks/useWallet";
import { NavBadgesProvider } from "./state/navBadges";
import { Layout } from "./components/layout/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { MarketsPage } from "./pages/MarketsPage";
import { GovernancePage } from "./pages/GovernancePage";
import { AdminLayout } from "./components/admin/AdminLayout";
import { ProposalsListPage } from "./pages/admin/ProposalsListPage";
import { ProposalDetailPage } from "./pages/admin/ProposalDetailPage";
import { AssetDetailPage } from "./pages/AssetDetailPage";
import { ActivityPage } from "./pages/ActivityPage";
import { SettingsPage } from "./pages/SettingsPage";
import { DiagnosticsPage } from "./pages/DiagnosticsPage";

export default function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
      <NavBadgesProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="markets" element={<MarketsPage />} />
          <Route path="markets/:assetId" element={<AssetDetailPage />} />
          <Route path="governance" element={<GovernancePage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="diagnostics" element={<DiagnosticsPage />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/proposals" replace />} />
          <Route path="proposals" element={<ProposalsListPage />} />
          <Route path="proposals/:id" element={<ProposalDetailPage />} />
        </Route>
      </Routes>
      </NavBadgesProvider>
      </WalletProvider>
    </BrowserRouter>
  );
}
