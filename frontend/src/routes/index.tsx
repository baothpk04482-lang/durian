import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import LoginPage from "@/pages/auth/Login";
import RegisterPage from "@/pages/auth/Register";
import DashboardPage from "@/pages/dashboard/Dashboard";
import CompaniesPage from "@/pages/companies/Companies";
import FarmsPage from "@/pages/farms/Farms";
import ZonesPage from "@/pages/zones/Zones";
import TreesPage from "@/pages/trees/Trees";
import UsersPage from "@/pages/users/Users";
import InspectionsPage from "@/pages/inspections/Inspections";
import DetectionResultsPage from "@/pages/detection-results/DetectionResults";
import DiseaseHistoryPage from "@/pages/disease-history/DiseaseHistory";
import AlertsPage from "@/pages/alerts/Alerts";
import DiseasesPage from "@/pages/diseases/Diseases";
import SettingsPage from "@/pages/settings/Settings";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "companies",
        element: <CompaniesPage />,
      },
      {
        path: "farms",
        element: <FarmsPage />,
      },
      {
        path: "zones",
        element: <ZonesPage />,
      },
      {
        path: "trees",
        element: <TreesPage />,
      },
      {
        path: "users",
        element: <UsersPage />,
      },
      {
        path: "inspections",
        element: <InspectionsPage />,
      },
      {
        path: "detection-results",
        element: <DetectionResultsPage />,
      },
      {
        path: "disease-history",
        element: <DiseaseHistoryPage />,
      },
      {
        path: "alerts",
        element: <AlertsPage />,
      },
      {
        path: "diseases",
        element: <DiseasesPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
