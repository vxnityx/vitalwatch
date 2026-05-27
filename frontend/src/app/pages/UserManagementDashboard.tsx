import React, { useEffect, useState } from 'react';
import { KPICard, Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Users, UserPlus, UserCheck, Clock, Shield } from 'lucide-react';
import { wellnessApi, NotificationContact } from '../api/wellnessApi';

const users = [
  { id: 1, name: 'Dr. Sarah Johnson', email: 'sarah.johnson@vitawatch.edu', role: 'Admin', department: 'Administration', status: 'Active', lastLogin: '2026-05-23 09:30' },
  { id: 2, name: 'Dr. Michael Chen', email: 'michael.chen@vitawatch.edu', role: 'Clinic', department: 'Health Center', status: 'Active', lastLogin: '2026-05-23 08:15' },
  { id: 3, name: 'Prof. Emily Davis', email: 'emily.davis@vitawatch.edu', role: 'Guidance', department: 'Student Services', status: 'Active', lastLogin: '2026-05-22 16:45' },
  { id: 4, name: 'Ms. Amanda Brown', email: 'amanda.brown@vitawatch.edu', role: 'HR', department: 'Human Resources', status: 'Active', lastLogin: '2026-05-23 10:00' },
  { id: 5, name: 'Dr. Robert Wilson', email: 'robert.wilson@vitawatch.edu', role: 'Clinic', department: 'Health Center', status: 'Inactive', lastLogin: '2026-05-15 14:20' },
  { id: 6, name: 'Ms. Jessica Lee', email: 'jessica.lee@vitawatch.edu', role: 'HR', department: 'Human Resources', status: 'Active', lastLogin: '2026-05-23 07:30' },
  { id: 7, name: 'John Martinez', email: 'john.martinez@vitawatch.edu', role: 'Admin', department: 'IT', status: 'Pending', lastLogin: 'Never' },
];

export function UserManagementDashboard() {
  const [contacts, setContacts] = useState<NotificationContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingContacts(true);
      try {
        const data = await wellnessApi.getNotificationContacts();
        if (!cancelled) setContacts(data);
      } catch (e) {
        // ignore
      } finally {
        if (!cancelled) setLoadingContacts(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const ensureRowFor = (dept: 'clinic' | 'hr' | 'guidance') => {
    const found = contacts.find((c) => c.department === dept);
    if (found) return found;
    return { id: 0, department: dept, email: '' } as NotificationContact;
  };

  const handleSave = async (row: NotificationContact) => {
    try {
      if (row.id && row.id > 0) {
        const updated = await wellnessApi.updateNotificationContact(row.id, { email: row.email });
        setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const created = await wellnessApi.createNotificationContact({ department: row.department, email: row.email });
        setContacts((prev) => [...prev.filter((c) => c.department !== created.department), created]);
      }
      alert('Saved');
    } catch (e) {
      alert('Failed to save contact');
    }
  };

  const handleSend = async (row: NotificationContact) => {
    try {
      if (!row.id) return alert('Save contact first');
      await wellnessApi.sendNotificationContact(row.id);
      alert(`Notification queued to ${row.email}`);
    } catch (e) {
      alert('Failed to send');
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users and access control</p>
        </div>
        <Button variant="primary">
          <UserPlus className="w-4 h-4 mr-2" />
          Add New User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Users"
          value="247"
          icon={<Users className="w-6 h-6" />}
          trend="+8 this month"
          trendUp={true}
          color="blue"
        />
        <KPICard
          title="Active Users"
          value="232"
          icon={<UserCheck className="w-6 h-6" />}
          color="emerald"
        />
        <KPICard
          title="Pending Accounts"
          value="15"
          icon={<Clock className="w-6 h-6" />}
          color="orange"
        />
        <KPICard
          title="Admin Roles"
          value="12"
          icon={<Shield className="w-6 h-6" />}
          color="purple"
        />
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-teal-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">Admin</p>
            <p className="text-2xl font-bold text-gray-900">45</p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">Clinic Staff</p>
            <p className="text-2xl font-bold text-gray-900">68</p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">Guidance</p>
            <p className="text-2xl font-bold text-gray-900">52</p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">HR</p>
            <p className="text-2xl font-bold text-gray-900">82</p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Contacts</h3>
        <p className="text-sm text-gray-600 mb-3">Emails to receive reports for Clinic, HR, and Guidance.</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Department</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(['clinic','hr','guidance'] as const).map((dept) => {
                const row = ensureRowFor(dept);
                return (
                  <tr key={dept} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{dept.toUpperCase()}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      <input
                        className="w-full p-2 border rounded"
                        value={row.email ?? ''}
                        onChange={(e) => setContacts((prev) => {
                          const other = prev.filter((c) => c.department !== dept);
                          return [...other, { ...row, email: e.target.value }];
                        })}
                        placeholder={`email@${dept}.example`}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(row)}
                          className="px-3 py-2 bg-blue-600 text-white rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => handleSend(row)}
                          className="px-3 py-2 bg-emerald-600 text-white rounded text-sm"
                        >
                          Send Notification
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
          <div className="flex gap-3">
            <select className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F6CBD] text-sm">
              <option>All Roles</option>
              <option>Admin</option>
              <option>Clinic</option>
              <option>Guidance</option>
              <option>HR</option>
            </select>
            <select className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F6CBD] text-sm">
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>Pending</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Department</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Last Login</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{user.email}</td>
                  <td className="py-3 px-4">
                    <Badge variant="info">{user.role}</Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">{user.department}</td>
                  <td className="py-3 px-4">
                    <Badge variant={
                      user.status === 'Active' ? 'success' :
                      user.status === 'Pending' ? 'warning' : 'neutral'
                    }>
                      {user.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{user.lastLogin}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button className="text-[#0F6CBD] hover:text-[#0D5AAD] text-sm font-medium">
                        Edit
                      </button>
                      <button className="text-[#0F6CBD] hover:text-[#0D5AAD] text-sm font-medium">
                        {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <UserPlus className="w-4 h-4 mr-2" />
              Add New User
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="w-4 h-4 mr-2" />
              Bulk Import Users
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Shield className="w-4 h-4 mr-2" />
              Manage Roles & Permissions
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Clock className="w-4 h-4 mr-2" />
              Review Pending Accounts
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New user registered</p>
                <p className="text-xs text-gray-600">John Martinez - 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl">
              <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Account activated</p>
                <p className="text-xs text-gray-600">Dr. Sarah Johnson - 5 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl">
              <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Role changed</p>
                <p className="text-xs text-gray-600">Ms. Amanda Brown - 1 day ago</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
