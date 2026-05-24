import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { AdminDashboard } from "./pages/AdminDashboard";
import { StudentWellnessDashboard } from "./pages/StudentWellnessDashboard";
import { EmployeeWellnessDashboard } from "./pages/EmployeeWellnessDashboard";
import { ClinicMonitoringDashboard } from "./pages/ClinicMonitoringDashboard";
import { GuidanceMonitoringDashboard } from "./pages/GuidanceMonitoringDashboard";
import { HRWellnessDashboard } from "./pages/HRWellnessDashboard";
import { ReportsDashboard } from "./pages/ReportsDashboard";
import { UserManagementDashboard } from "./pages/UserManagementDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/dashboard",
    Component: DashboardLayout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "student-wellness", Component: StudentWellnessDashboard },
      { path: "employee-wellness", Component: EmployeeWellnessDashboard },
      { path: "clinic-monitoring", Component: ClinicMonitoringDashboard },
      { path: "guidance-monitoring", Component: GuidanceMonitoringDashboard },
      { path: "hr-wellness", Component: HRWellnessDashboard },
      { path: "reports", Component: ReportsDashboard },
      { path: "user-management", Component: UserManagementDashboard },
    ],
  },
]);
