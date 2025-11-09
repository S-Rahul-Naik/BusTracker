import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import Dashboard from "../pages/dashboard/page";
import AdminDashboard from "../pages/admin/page";
import Routes from "../pages/routes/page";
import Schedule from "../pages/schedule/page";
import LiveTracking from "../pages/live-tracking/page";
import Notifications from "../pages/notifications/page";
import SignInPage from "../pages/auth/SignInPage";
import SignUpPage from "../pages/auth/SignUpPage";
import UnifiedLoginPage from "../pages/auth/UnifiedLoginPage";
import Phase4Dashboard from "../pages/phase4/page";
import LoginPage from "../pages/auth/LoginPage";
import { AdminRoute, UserRoute, AuthenticatedRoute } from "../components/auth/ProtectedRoute";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  // Unified Login - automatically detects role from database
  {
    path: "/login",
    element: <UnifiedLoginPage />,
  },
  // New Authentication routes
  {
    path: "/signin",
    element: <SignInPage />,
  },
  {
    path: "/signup", 
    element: <SignUpPage />,
  },
  // Legacy authentication routes (still supported)
  {
    path: "/login/admin",
    element: <LoginPage role="admin" />,
  },
  {
    path: "/login/user",
    element: <LoginPage role="user" />,
  },
  // Protected user routes
  {
    path: "/dashboard",
    element: (
      <UserRoute>
        <Dashboard />
      </UserRoute>
    ),
  },
  {
    path: "/routes",
    element: (
      <AuthenticatedRoute>
        <Routes />
      </AuthenticatedRoute>
    ),
  },
  {
    path: "/notifications",
    element: (
      <AuthenticatedRoute>
        <Notifications />
      </AuthenticatedRoute>
    ),
  },
  // Protected admin routes
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminDashboard />
      </AdminRoute>
    ),
  },
  {
    path: "/schedule",
    element: (
      <AdminRoute>
        <Schedule />
      </AdminRoute>
    ),
  },
  {
    path: "/live-tracking",
    element: (
      <AuthenticatedRoute>
        <LiveTracking />
      </AuthenticatedRoute>
    ),
  },
  {
    path: "/phase4",
    element: <Phase4Dashboard />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
