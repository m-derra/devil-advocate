import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "./pages/home";
import { SessionPage } from "./pages/session";
import { ReportPage } from "./pages/report";
import { AdminPage } from "./pages/admin";
import { FeedbackWidget } from "./components/feedback-widget";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <Routes>
          <Route path="/" element={<Navigate to="/devil" replace />} />
          <Route path="/devil" element={<HomePage />} />
          <Route path="/devil/session/:id" element={<SessionPage />} />
          <Route path="/devil/report/:id" element={<ReportPage />} />
          <Route path="/devil/admin" element={<AdminPage />} />
        </Routes>
        <FeedbackWidget />
      </div>
    </BrowserRouter>
  </React.StrictMode>
);
