import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { wellnessApi, NotificationContact } from '../api/wellnessApi';

/*
  The rest of this page (KPIs, user table, quick actions, recent activity)
  is intentionally commented out. The Notification Contacts card remains
  active below for managing/send notifications.

  If you need to restore sections later, remove the surrounding comments.
*/

// Dummy users and other UI are commented out to keep only the notifications section.

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
      alert(`Notification sent to ${row.email}`);
    } catch (e) {
      alert('Failed to send');
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification Contacts - active */}
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

      {/* Other user management UI is intentionally commented out above */}
    </div>
  );
}
