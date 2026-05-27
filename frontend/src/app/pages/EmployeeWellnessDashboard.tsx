import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, CartesianGrid, Cell, PieChart, Pie, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Briefcase, Heart, Thermometer, Activity, Users } from 'lucide-react';
import { KPICard, Card } from '../components/Card';
import { EmployeeJoinedRecord, MOOD_LEVEL_LABELS, average, wellnessApi } from '../api/wellnessApi';

const moodColors = ['#EF4444', '#F59E0B', '#3B82F6', '#14B8A6', '#22C55E'];

function moodLabel(moodLevel: number): string {
  return MOOD_LEVEL_LABELS[moodLevel] ?? 'Unknown';
}

function formatDateLabel(record: EmployeeJoinedRecord): string {
  if (!record.timelog) {
    return `${record.month}/${record.day}/${record.year}`;
  }

  const date = new Date(record.timelog);
  return Number.isNaN(date.getTime()) ? `${record.month}/${record.day}/${record.year}` : date.toLocaleDateString();
}

export function EmployeeWellnessDashboard() {
  const [records, setRecords] = useState<EmployeeJoinedRecord[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<string>('CITC');
  const [selectedOffice, setSelectedOffice] = useState<string>('All Offices');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('All Employees');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: Record<string, string | number> = {};
        if (selectedCollege !== 'CITC') params.college = selectedCollege;
        if (selectedOffice !== 'All Offices') params.office = selectedOffice;
        if (selectedEmployeeId !== 'All Employees') params.employee_id = selectedEmployeeId;

        const employeeRecords = await wellnessApi.getJoinedEmployeeRecords(Object.keys(params).length ? params : undefined);
        if (!cancelled) {
          setRecords(employeeRecords);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load employee records.');
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
  }, [selectedCollege, selectedOffice, selectedEmployeeId]);

  const filteredRecords = records;

  const officeData = useMemo(() => {
    const grouped = new Map<string, number>();

    filteredRecords.forEach((record) => {
      const key = record.office || 'Unknown';
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    });

    return Array.from(grouped.entries())
      .map(([office, count]) => ({ office, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredRecords]);

  const moodDistribution = useMemo(() => {
    const grouped = new Map<string, number>();

    filteredRecords.forEach((record) => {
      const label = moodLabel(record.mood_level);
      grouped.set(label, (grouped.get(label) ?? 0) + 1);
    });

    return Array.from(grouped.entries()).map(([label, count], index) => ({
      label,
      count,
      color: moodColors[index % moodColors.length],
    }));
  }, [filteredRecords]);

  const recentRecords = useMemo(() => [...filteredRecords].slice(0, 12), [filteredRecords]);

  const totalRecords = filteredRecords.length;
  const uniqueEmployees = new Set(filteredRecords.map((record) => record.employee_id)).size;
  const avgTemperature = average(filteredRecords.map((record) => record.temperature));
  const avgHeartRate = average(filteredRecords.map((record) => record.heart_rate));
  const highTempCount = filteredRecords.filter((record) => record.temperature >= 37.5).length;
  const abnormalHrCount = filteredRecords.filter((record) => record.heart_rate < 60 || record.heart_rate > 100).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Wellness Dashboard</h1>
          <p className="text-gray-600 mt-1">Live employee records from Supabase. College defaults to CITC.</p>
        </div>
      </div>

      {error && (
        <Card className="border border-red-200 bg-red-50 text-red-700">
          Unable to load employee records from backend: {error}
        </Card>
      )}

      <div className="flex gap-3 items-center flex-wrap">
        <select value={selectedCollege} onChange={(e) => setSelectedCollege(e.target.value)} className="p-2 border rounded">
          <option value="CITC">CITC</option>
          <option value="All Colleges">All Colleges</option>
        </select>
        <select value={selectedOffice} onChange={(e) => setSelectedOffice(e.target.value)} className="p-2 border rounded">
          <option>All Offices</option>
          {[...new Set(records.map((record) => record.office || 'Unknown'))].map((office) => (
            <option key={office}>{office}</option>
          ))}
        </select>
        <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} className="p-2 border rounded">
          <option>All Employees</option>
          {[...new Set(records.map((record) => String(record.employee_id || 'Unknown')))].map((employeeId) => (
            <option key={employeeId}>{employeeId}</option>
          ))}
        </select>
        <button
          onClick={() => {
            setSelectedCollege('CITC');
            setSelectedOffice('All Offices');
            setSelectedEmployeeId('All Employees');
          }}
          className="px-3 py-2 bg-gray-100 rounded"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title="Total Records" value={loading ? '...' : totalRecords} icon={<Briefcase className="w-6 h-6" />} color="blue" />
        <KPICard title="Unique Employees" value={loading ? '...' : uniqueEmployees} icon={<Users className="w-6 h-6" />} color="teal" />
        <KPICard title="Average Temperature" value={loading ? '...' : `${avgTemperature.toFixed(2)} °C`} icon={<Thermometer className="w-6 h-6" />} color="emerald" />
        <KPICard title="Average Heart Rate" value={loading ? '...' : `${avgHeartRate.toFixed(2)} bpm`} icon={<Heart className="w-6 h-6" />} color="orange" />
        <KPICard title="High Temperature" value={loading ? '...' : highTempCount} icon={<Activity className="w-6 h-6" />} color="red" />
        <KPICard title="Abnormal Heart Rate" value={loading ? '...' : abnormalHrCount} icon={<Activity className="w-6 h-6" />} color="purple" />
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Mood Level Reference</h3>
        <p className="text-sm text-gray-600">1: Anxious, 2: Worried, 3: Sad, 4: Neutral, 5: Happy</p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood Level Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={moodDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="count" label>
                {moodDistribution.map((entry, index) => (
                  <Cell key={`mood-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Offices by Records</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={officeData} layout="vertical" margin={{ left: 24, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="office" type="category" stroke="#6b7280" width={160} />
              <Tooltip />
              <Bar dataKey="count" fill="#0F6CBD" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Wellness Records</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Employee ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">College</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Office</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">BP</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Temperature</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Mood</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Last Check</th>
              </tr>
            </thead>
            <tbody>
              {recentRecords.map((record) => (
                <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{record.employee_id}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.college || 'CITC'}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.office || 'Unknown'}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.blood_pressure}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.temperature.toFixed(1)}°C</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{moodLabel(record.mood_level)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDateLabel(record)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}