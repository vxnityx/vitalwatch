import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, UserRound, Thermometer, Activity, AlertTriangle } from 'lucide-react';
import { KPICard, Card } from '../components/Card';
import {
  EmployeeJoinedRecord,
  JoinedStudentRecord,
  wellnessApi,
} from '../api/wellnessApi';

export function AdminDashboard() {
  const [students, setStudents] = useState<JoinedStudentRecord[]>([]);
  const [faculty, setFaculty] = useState<EmployeeJoinedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [studentRecords, facultyRecords] = await Promise.all([
          wellnessApi.getJoinedStudentRecords(),
          wellnessApi.getJoinedEmployeeRecords(),
        ]);

        if (!cancelled) {
          setStudents(studentRecords);
          setFaculty(facultyRecords);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load dashboard data.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  const studentRecords = students.length;
  const employeeRecords = faculty.length;

  const recentStudentRecords = useMemo(
    () =>
      [...students]
        .sort((left, right) => new Date(right.timelog).getTime() - new Date(left.timelog).getTime())
        .slice(0, 5),
    [students],
  );

  const recentEmployeeRecords = useMemo(
    () =>
      [...faculty]
        .sort((left, right) => new Date(right.timelog).getTime() - new Date(left.timelog).getTime())
        .slice(0, 5),
    [faculty],
  );

  const studentHighTempCount = useMemo(
    () => students.filter((record) => record.temperature >= 37.5).length,
    [students],
  );

  const employeeHighTempCount = useMemo(
    () => faculty.filter((record) => record.temperature >= 37.5).length,
    [faculty],
  );

  const studentAbnormalHRCount = useMemo(
    () => students.filter((record) => record.heart_rate < 60 || record.heart_rate > 100).length,
    [students],
  );

  const employeeAbnormalHRCount = useMemo(
    () => faculty.filter((record) => record.heart_rate < 60 || record.heart_rate > 100).length,
    [faculty],
  );

  const employeeHighHrCount = useMemo(
    () => faculty.filter((record) => record.heart_rate < 60 || record.heart_rate > 100).length,
    [faculty],
  );

  const studentVsEmployeeData = useMemo(
    () => [
      { name: 'Students', value: studentRecords },
      { name: 'Employees', value: employeeRecords },
    ],
    [studentRecords, employeeRecords],
  );

  const overallSummaryData = useMemo(
    () => [
      { name: 'Student High Temp', value: studentHighTempCount },
      { name: 'Employee High Temp', value: employeeHighTempCount },
      { name: 'Student Abnormal HR', value: studentAbnormalHRCount },
      { name: 'Employee Abnormal HR', value: employeeAbnormalHRCount },
      { name: 'Employee High HR', value: employeeHighHrCount },
    ],
    [
      studentHighTempCount,
      employeeHighTempCount,
      studentAbnormalHRCount,
      employeeAbnormalHRCount,
      employeeHighHrCount,
    ],
  );

  const redirectSections = [
    {
      title: 'Student Wellness',
      description: 'View student health and wellness records.',
      to: '/dashboard/student-wellness',
    },
    {
      title: 'Employee Wellness',
      description: 'Monitor employee vital signs and wellness trends.',
      to: '/dashboard/employee-wellness',
    },
    {
      title: 'Clinic Monitoring',
      description: 'Access clinic-focused health monitoring.',
      to: '/dashboard/clinic-monitoring',
    },
    {
      title: 'HR Monitoring / Wellness',
      description: 'Review HR health and wellness insights.',
      to: '/dashboard/hr-wellness',
    },
    {
      title: 'Guidance Monitoring / Wellness',
      description: 'Review guidance and emotional wellness indicators.',
      to: '/dashboard/guidance-monitoring',
    },
    {
      title: 'Report',
      description: 'Generate and review wellness reports.',
      to: '/dashboard/reports',
    },
    {
      title: 'Management',
      description: 'Manage record uploads and operations.',
      to: '/dashboard/record-upload',
    },
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions.',
      to: '/dashboard/user-management',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Overview</h1>
          <p className="text-gray-600 mt-1">Central dashboard for live Supabase-backed student and employee wellness records.</p>
        </div>
      </div>

      {error && (
        <Card className="border border-red-200 bg-red-50 text-red-700">
          Unable to load Supabase-backed dashboard data: {error}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title="Student Records" value={loading ? '...' : studentRecords} icon={<Users className="w-6 h-6" />} color="blue" />
        <KPICard title="Employee Records" value={loading ? '...' : employeeRecords} icon={<UserRound className="w-6 h-6" />} color="teal" />
        <KPICard title="Student High Temp (Count)" value={loading ? '...' : studentHighTempCount} icon={<Thermometer className="w-6 h-6" />} color="orange" />
        <KPICard title="Employee High Temp (Count)" value={loading ? '...' : employeeHighTempCount} icon={<Thermometer className="w-6 h-6" />} color="orange" />
        <KPICard title="Student Abnormal HR" value={loading ? '...' : studentAbnormalHRCount} icon={<Activity className="w-6 h-6" />} color="red" />
        <KPICard title="Employee Abnormal HR" value={loading ? '...' : employeeAbnormalHRCount} icon={<Activity className="w-6 h-6" />} color="red" />
        <KPICard title="Employee High HR" value={loading ? '...' : employeeHighHrCount} icon={<AlertTriangle className="w-6 h-6" />} color="emerald" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Student Records from Supabase</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Student ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Program</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">College</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Temperature</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Heart Rate</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentStudentRecords.map((record) => (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{record.student_id}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{record.program || 'Unknown'}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{record.college || 'Unknown'}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{record.temperature.toFixed(1)}°C</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{record.heart_rate}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{new Date(record.timelog).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Employee Records from Supabase</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Employee</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Office</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">College</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Temperature</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Heart Rate</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentEmployeeRecords.map((record) => (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{record.full_name || String(record.employee_id)}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{record.office || 'Unknown'}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{record.college || 'CITC'}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{record.temperature.toFixed(1)}°C</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{record.heart_rate}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{new Date(record.timelog).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Student vs Employee Records</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={studentVsEmployeeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="value" fill="#A5D8FF" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Summary</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={overallSummaryData} layout="vertical" margin={{ left: 24, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis type="category" dataKey="name" stroke="#6b7280" width={180} />
              <Tooltip />
              <Bar dataKey="value" fill="#A5D8FF" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Redirect Sections</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {redirectSections.map((section) => (
            <Link
              key={section.title}
              to={section.to}
              className="block rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-[#0F6CBD] hover:bg-blue-50/40"
            >
              <h4 className="text-lg font-semibold text-slate-800">{section.title}</h4>
              <p className="mt-2 text-sm text-slate-600">{section.description}</p>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
