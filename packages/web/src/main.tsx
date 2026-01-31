import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { HomePage } from "./pages/home";
import { SessionPage } from "./pages/session";
import { AdminPage } from "./pages/admin";
import { FeedbackWidget } from "./components/feedback-widget";
import "./index.css";

// Redirect old report URLs to session page
function ReportRedirect() {
  const { id } = useParams();
  return <Navigate to={`/devil/session/${id}`} replace />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <Routes>
          <Route path="/" element={<Navigate to="/devil" replace />} />
          <Route path="/devil" element={<HomePage />} />
          <Route path="/devil/session/:id" element={<SessionPage />} />
          <Route path="/devil/report/:id" element={<ReportRedirect />} />
          <Route path="/devil/admin" element={<AdminPage />} />
        </Routes>
        <FeedbackWidget />
      </div>
    </BrowserRouter>
  </React.StrictMode>
);
