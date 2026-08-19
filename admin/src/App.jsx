// App.js
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./admin/pages/Login";
import Dashboard from "./admin/pages/Dashboard";
import Users from "./admin/pages/Users";
import Deposits from "./admin/pages/Deposits";
import Withdrawals from "./admin/pages/Withdrawals";
import Transactions from "./admin/pages/Transactions";
import Reports from "./admin/pages/Reports";
import Notifications from "./admin/pages/Notifications";
import Settings from "./admin/pages/Settings";
import DepositSettingsAdmin from "./admin/pages/DepositSettingsAdmin";
import WithdrawalSettings from "./admin/pages/WithdrawalSettings";
import CreateWithdrawalSettings from "./admin/pages/createWithdrawalSettings";
import Banners from "./admin/pages/Banners";

import PrivateRoute from "./admin/routes/PrivateRoute";
import AdminLayout from "./admin/layouts/AdminLayout";
import AdminTicketType from "./admin/pages/AdminTicketType";

// 👇 Matka Admin Pages
import AdminMarkets from "./admin/pages/AdminMarkets";
import AdminBids from "./admin/pages/AdminBids";
import AdminResults from "./admin/pages/AdminResults";
import AdminCurrencyRates from "./admin/pages/AdminCurrencyRates";

// Australia
import AdminAustraliaGameCount from "./admin/pages/australia/AdminAustraliaGameCount";
import AdminAustraliaGameEntries from "./admin/pages/australia/AdminAustraliaGameEntries";
import AdminAustraliaPowerballResult from "./admin/pages/australia/AdminAustraliaPowerballResult";

// Pakistan
import AdminPakistanGameCount from "./admin/pages/pakistan/AdminPakistanGameCount";
import AdminPakistanGameEntries from "./admin/pages/pakistan/AdminPakistanGameEntries";
import AdminPakistanPowerballResult from "./admin/pages/pakistan/AdminPakistanPowerballResult";

// Canada
import AdminCanadaGameCount from "./admin/pages/canada/AdminCanadaGameCount";
import AdminCanadaGameEntries from "./admin/pages/canada/AdminCanadaGameEntries";
import AdminCanadaPowerballResult from "./admin/pages/canada/AdminCanadaPowerballResult";

// India
import AdminIndiaGameCount from "./admin/pages/india/AdminIndiaGameCount";
import AdminIndiaGameEntries from "./admin/pages/india/AdminIndiaGameEntries";
import AdminIndiaPowerballResult from "./admin/pages/india/AdminIndiaPowerballResult";

// Nepal
import AdminNepalGameCount from "./admin/pages/nepal/AdminNepalGameCount";
import AdminNepalGameEntries from "./admin/pages/nepal/AdminNepalGameEntries";
import AdminNepalPowerballResult from "./admin/pages/nepal/AdminNepalPowerballResult";

// UAE
import AdminUAEGameCount from "./admin/pages/uae/AdminUAEGameCount";
import AdminUAEGameEntries from "./admin/pages/uae/AdminUAEGameEntries";
import AdminUAEPowerballResult from "./admin/pages/uae/AdminUAEPowerballResult";
import ReferralLevels from "./admin/pages/ReferralLevels";
import AdminBettingBonus from "./admin/pages/AdminBettingBonus";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/login" replace />} />

      <Route path="/admin/login" element={<Login />} />

      <Route element={<PrivateRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/deposits" element={<Deposits />} />
          <Route path="/admin/withdrawals" element={<Withdrawals />} />
          <Route path="/admin/transactions" element={<Transactions />} />
          <Route path="/admin/reports" element={<Reports />} />
          <Route path="/admin/notifications" element={<Notifications />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/admin/ticketsetiings" element={<AdminTicketType />} />

          {/* Deposit Settings */}
          <Route path="/admin/deposit-settings" element={<DepositSettingsAdmin />} />

          {/* Withdrawal Settings */}
          <Route path="/admin/withdrawal-settings" element={<WithdrawalSettings />} />
          <Route path="/admin/withdrawal-settings/create" element={<CreateWithdrawalSettings />} />
          <Route
            path="/admin/currency-rates" element={<AdminCurrencyRates />
            }
          />

          {/* Banner Management */}
          <Route path="/admin/banners" element={<Banners />} />

          {/* ============================================================ */}
          {/* 👇 MATKA ADMIN PAGES */}
          {/* ============================================================ */}

          {/* Manage Markets */}
          <Route path="/admin/markets" element={<AdminMarkets />} />

          {/* View All Bids */}
          <Route path="/admin/bids" element={<AdminBids />} />

          {/* Manage Results */}
          <Route path="/admin/results" element={<AdminResults />} />

          {/* ============================================================ */}
          {/* 👇 POWERBALL RESULT PAGES */}
          {/* ============================================================ */}

          {/* Australia Powerball */}
          <Route
            path="/admin/australia/powerball-result"
            element={<AdminAustraliaPowerballResult />}
          />

          {/* Pakistan Powerball */}
          <Route
            path="/admin/pakistan/powerball-result"
            element={<AdminPakistanPowerballResult />}
          />

          {/* Canada Powerball */}
          <Route
            path="/admin/canada/powerball-result"
            element={<AdminCanadaPowerballResult />}
          />

          {/* India Powerball */}
          <Route
            path="/admin/india/powerball-result"
            element={<AdminIndiaPowerballResult />}
          />

          {/* Nepal Powerball */}
          <Route
            path="/admin/nepal/powerball-result"
            element={<AdminNepalPowerballResult />}
          />

          {/* UAE Powerball */}
          <Route
            path="/admin/uae/powerball-result"
            element={<AdminUAEPowerballResult />}
          />

          {/* ============================================================ */}
          {/* 👇 GAME COUNT & ENTRIES PAGES */}
          {/* ============================================================ */}

          {/* Australia */}
          <Route path="/admin/australia/gamecounts" element={<AdminAustraliaGameCount />} />
          <Route path="/admin/australia/gameEntries" element={<AdminAustraliaGameEntries />} />

          {/* Pakistan */}
          <Route path="/admin/pakistan/gamecounts" element={<AdminPakistanGameCount />} />
          <Route path="/admin/pakistan/gameEntries" element={<AdminPakistanGameEntries />} />

          {/* Canada */}
          <Route path="/admin/canada/gamecounts" element={<AdminCanadaGameCount />} />
          <Route path="/admin/canada/gameEntries" element={<AdminCanadaGameEntries />} />

          {/* India */}
          <Route path="/admin/india/gamecounts" element={<AdminIndiaGameCount />} />
          <Route path="/admin/india/gameEntries" element={<AdminIndiaGameEntries />} />

          {/* Nepal */}
          <Route path="/admin/nepal/gamecounts" element={<AdminNepalGameCount />} />
          <Route path="/admin/nepal/gameEntries" element={<AdminNepalGameEntries />} />

          {/* UAE */}
          <Route path="/admin/uae/gamecounts" element={<AdminUAEGameCount />} />
          <Route path="/admin/uae/gameEntries" element={<AdminUAEGameEntries />} />
          <Route
            path="/admin/referral-levels"
            element={<ReferralLevels />}
          />
          <Route
            path="/admin/betting-bonus"
            element={<AdminBettingBonus />}
          />

        </Route>
      </Route>
    </Routes>
  );
}

export default App;