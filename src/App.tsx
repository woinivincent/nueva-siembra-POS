// src/App.tsx
import { HashRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./renderer/components/layout/Layout";
import { Dashboard } from "./renderer/pages/Dashboard";
import { POSPage } from "./renderer/pages/POSpage";
import { Inventory } from "./renderer/pages/Inventory";
import { Customers } from "./renderer/pages/Customers";
import { Suppliers } from "./renderer/pages/Suppliers";
import { Expenses } from "./renderer/pages/Expenses";
import { Reports } from "./renderer/pages/Reports";
import { Settings } from "./renderer/pages/Settings";
import "./index.css";

function App() {
  return (
    <HashRouter>
      <div className="dark">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="pos" element={<POSPage />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="customers" element={<Customers />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="expenses" element={<Expenses />} />

            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;
