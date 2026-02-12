import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import TasksPage from "./pages/TasksPage";
import BountiesPage from "./pages/BountiesPage";
import ShopPage from "./pages/ShopPage";
import HistoryPage from "./pages/HistoryPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/tasks" replace />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/bounties" element={<BountiesPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="*" element={<Navigate to="/tasks" replace />} />
      </Routes>
    </Layout>
  );
}
