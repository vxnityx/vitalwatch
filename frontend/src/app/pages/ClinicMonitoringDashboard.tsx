import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Heart, Activity, AlertTriangle } from 'lucide-react';
import { KPICard, Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { FacultyRecord, normalizeRiskLevel, recordDateLabel, wellnessApi } from '../api/wellnessApi';

function riskVariant(risk: string): 'danger' | 'warning' | 'info' | 'success' {
  if (risk === 'Critical') return 'danger';
  if (risk === 'High') return 'warning';
  if (risk === 'Moderate') return 'info';
  return 'success';
}

const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function ClinicMonitoringDashboard() {
  const [records, setRecords] = useState<FacultyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const facultyRecords = await wellnessApi.getFacultyRecords();
        if (!cancelled) setRecords(facultyRecords);
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load clinic records.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  const feverTrendData = useMemo(() => {
    const grouped = new Map<string, number>();

    records.forEach((record) => {
      if (record.Body_Temperature_C < 37.5) return;
      const key = record.Month;
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    });

    return Array.from(grouped.entries())
      .map(([day, cases]) => ({ day: day.slice(0, 3), month: day, cases }))
      .sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));
  }, [records]);

  const bpSeverityData = useMemo(() => {
    const counts = new Map<string, number>([
      ['Normal', 0],
      ['Elevated', 0],
      ['Stage 1', 0],
      ['Stage 2', 0],
      ['Critical', 0],
    ]);

    records.forEach((record) => {
      if (record.Systolic_BP >= 180 || record.Diastolic_BP >= 120) counts.set('Critical', (counts.get('Critical') ?? 0) + 1);
      else if (record.Systolic_BP >= 140 || record.Diastolic_BP >= 90) counts.set('Stage 2', (counts.get('Stage 2') ?? 0) + 1);
      else if (record.Systolic_BP >= 130 || record.Diastolic_BP >= 80) counts.set('Stage 1', (counts.get('Stage 1') ?? 0) + 1);
      else if (record.Systolic_BP >= 120) counts.set('Elevated', (counts.get('Elevated') ?? 0) + 1);
      else counts.set('Normal', (counts.get('Normal') ?? 0) + 1);
    });

    return Array.from(counts.entries()).map(([category, count]) => ({ category, count }));
  }, [records]);

  const heartRateData = useMemo(() => {
    const grouped = new Map<string, number[]>();

    records.forEach((record) => {
      const values = grouped.get(record.Month) ?? [];
      values.push(record.Heart_Rate_bpm);
      grouped.set(record.Month, values);
    });

    return Array.from(grouped.entries())
      .map(([time, values]) => ({ time: time.slice(0, 3), month: time, avgHR: Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)) }))
      .sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));
  }, [records]);

  const clinicalRecords = useMemo(() => {
    return [...records]
      .map((record) => ({
        id: record.id,
        patient: record.EmployeeID_or_Guest,
        bp: record.Blood_Pressure,
        temp: `${record.Body_Temperature_C.toFixed(1)}°C`,
        hr: `${record.Heart_Rate_bpm} bpm`,
        risk: normalizeRiskLevel(record.Risk_Level),
        status: record.Alert_Status,
        date: recordDateLabel(record),
      }))
      .slice(0, 12);
  }, [records]);

  const criticalCount = clinicalRecords.filter((record) => record.risk === 'Critical').length;
  const feverCount = records.filter((record) => record.Body_Temperature_C >= 37.5).length;
  const highBpCount = records.filter((record) => record.Systolic_BP >= 140 || record.Diastolic_BP >= 90).length;
  const elevatedHrCount = records.filter((record) => record.Heart_Rate_bpm >= 100).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Clinic Monitoring Dashboard</h1>
        <p className="text-gray-600 mt-1">Healthcare personnel monitoring and critical case management</p>
      </div>

      {error && <Card className="border border-red-200 bg-red-50 text-red-700">Unable to load clinic records: {error}</Card>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Red Flag Cases" value={loading ? '...' : criticalCount} icon={<AlertTriangle className="w-6 h-6" />} color="red" />
        <KPICard title="Fever Cases" value={loading ? '...' : feverCount} icon={<Thermometer className="w-6 h-6" />} color="orange" />
        <KPICard title="High BP Cases" value={loading ? '...' : highBpCount} icon={<Heart className="w-6 h-6" />} color="purple" />
        <KPICard title="Elevated Heart Rate" value={loading ? '...' : elevatedHrCount} icon={<Activity className="w-6 h-6" />} color="teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fever Trend Chart</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={feverTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Line type="monotone" dataKey="cases" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">BP Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bpSeverityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="category" stroke="#6b7280" angle={-15} textAnchor="end" height={80} />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="count" fill="#EF4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Heart Rate Monitoring</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={heartRateData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Line type="monotone" dataKey="avgHR" stroke="#14B8A6" strokeWidth={2} dot={{ fill: '#14B8A6' }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Records</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Patient</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Blood Pressure</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Temperature</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Heart Rate</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Risk Level</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {clinicalRecords.map((record) => (
                <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{record.patient}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.bp}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.temp}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.hr}</td>
                  <td className="py-3 px-4">
                    <Badge variant={riskVariant(record.risk)}>{record.risk}</Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.status}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{record.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
