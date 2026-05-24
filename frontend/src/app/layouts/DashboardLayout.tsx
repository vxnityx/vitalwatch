import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import {
  LayoutDashboard,
  GraduationCap,
  Briefcase,
  Stethoscope,
  Brain,
  UserCheck,
  FileText,
  Users,
  Settings,
  LogOut,
  Search,
  Bell,
  User,
  Activity,
  Menu,
  X,
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/dashboard/student-wellness', label: 'Student Wellness', icon: GraduationCap },
  { path: '/dashboard/employee-wellness', label: 'Employee Wellness', icon: Briefcase },
  { path: '/dashboard/clinic-monitoring', label: 'Clinic Monitoring', icon: Stethoscope },
  { path: '/dashboard/guidance-monitoring', label: 'Guidance Monitoring', icon: Brain },
  { path: '/dashboard/hr-wellness', label: 'HR Wellness', icon: UserCheck },
  { path: '/dashboard/reports', label: 'Reports', icon: FileText },
  { path: '/dashboard/user-management', label: 'User Management', icon: Users },
];

export function DashboardLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] lg:flex">
      {mobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform bg-white border-r border-gray-200 flex flex-col shadow-2xl transition-transform duration-300 lg:static lg:z-auto lg:w-64 lg:max-w-none lg:translate-x-0 lg:shadow-none ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between gap-3 p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0F6CBD] to-[#14B8A6] rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">VitalWatch+</h1>
          </div>

          <button
            type="button"
            className="rounded-xl p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
            aria-label="Close navigation menu"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 sm:p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-[#0F6CBD] font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 sm:p-4 border-t border-gray-200">
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 w-full transition-colors">
            <Settings className="w-5 h-5" />
            <span className="text-sm">Settings</span>
          </button>
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 w-full transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col lg:min-w-0">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-3 sm:px-6 lg:px-8 lg:py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                type="button"
                className="rounded-xl p-2 text-gray-700 hover:bg-gray-100"
                aria-label="Open navigation menu"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-gradient-to-br from-[#0F6CBD] to-[#14B8A6] rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-base font-semibold text-gray-900">VitalWatch+</h1>
              </div>
            </div>

            <div className="w-full lg:flex-1 lg:max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search..."
                  className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F6CBD] focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:gap-4 lg:ml-6">
              <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <Bell className="w-5 h-5 text-gray-700" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-gray-200 min-w-0">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
                  <p className="text-xs text-gray-600 truncate">Administrator</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-[#0F6CBD] to-[#14B8A6] rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
