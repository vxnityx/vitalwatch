import { KPICard, Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Stethoscope, Thermometer, Heart, Activity, AlertTriangle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const feverTrendData = [
  { day: 'Mon', cases: 12 },
  { day: 'Tue', cases: 15 },
  { day: 'Wed', cases: 9 },
  { day: 'Thu', cases: 18 },
  { day: 'Fri', cases: 14 },
  { day: 'Sat', cases: 8 },
  { day: 'Sun', cases: 6 },
];

const bpSeverityData = [
  { category: 'Normal', count: 580 },
  { category: 'Elevated', count: 150 },
  { category: 'Stage 1', count: 85 },
  { category: 'Stage 2', count: 42 },
  { category: 'Critical', count: 18 },
];

const heartRateData = [
  { time: '8:00', avgHR: 68 },
  { time: '10:00', avgHR: 72 },
  { time: '12:00', avgHR: 75 },
  { time: '14:00', avgHR: 73 },
  { time: '16:00', avgHR: 70 },
  { time: '18:00', avgHR: 68 },
];

const clinicalRecords = [
  { id: 1, patient: 'John Doe', bp: '155/102', temp: '38.2°C', hr: '95 bpm', risk: 'Critical', status: 'Urgent', date: '2026-05-23 10:30' },
  { id: 2, patient: 'Sarah Smith', bp: '145/90', temp: '37.8°C', hr: '88 bpm', risk: 'High', status: 'Monitor', date: '2026-05-23 11:15' },
  { id: 3, patient: 'Mike Johnson', bp: '138/88', temp: '37.2°C', hr: '82 bpm', risk: 'Moderate', status: 'Follow-up', date: '2026-05-23 12:00' },
  { id: 4, patient: 'Emily Brown', bp: '120/78', temp: '36.6°C', hr: '70 bpm', risk: 'Normal', status: 'Cleared', date: '2026-05-23 13:45' },
  { id: 5, patient: 'David Lee', bp: '148/95', temp: '37.5°C', hr: '90 bpm', risk: 'High', status: 'Monitor', date: '2026-05-23 14:20' },
];

export function ClinicMonitoringDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clinic Monitoring Dashboard</h1>
          <p className="text-gray-600 mt-1">Healthcare personnel monitoring and critical case management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Red Flag Cases"
          value="18"
          icon={<AlertTriangle className="w-6 h-6" />}
          trend="-22% from last week"
          trendUp={true}
          color="red"
        />
        <KPICard
          title="Fever Cases"
          value="42"
          icon={<Thermometer className="w-6 h-6" />}
          trend="+5 new today"
          trendUp={false}
          color="orange"
        />
        <KPICard
          title="High BP Cases"
          value="67"
          icon={<Heart className="w-6 h-6" />}
          trend="-8% improvement"
          trendUp={true}
          color="purple"
        />
        <KPICard
          title="Elevated Heart Rate"
          value="34"
          icon={<Activity className="w-6 h-6" />}
          color="teal"
        />
      </div>

      <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Priority Alerts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border-l-4 border-red-600">
            <h4 className="text-sm font-semibold text-red-600 mb-1">Critical BP</h4>
            <p className="text-2xl font-bold text-gray-900">18</p>
            <p className="text-xs text-gray-600 mt-1">Requires immediate attention</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-l-4 border-orange-600">
            <h4 className="text-sm font-semibold text-orange-600 mb-1">Fever Alerts</h4>
            <p className="text-2xl font-bold text-gray-900">23</p>
            <p className="text-xs text-gray-600 mt-1">Above 37.5°C</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-l-4 border-purple-600">
            <h4 className="text-sm font-semibold text-purple-600 mb-1">Emergency Cases</h4>
            <p className="text-2xl font-bold text-gray-900">5</p>
            <p className="text-xs text-gray-600 mt-1">Active now</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fever Trend Chart</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={feverTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
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
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date & Time</th>
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
                    <Badge variant={record.risk === 'Critical' ? 'danger' : record.risk === 'High' ? 'warning' : record.risk === 'Moderate' ? 'info' : 'success'}>
                      {record.risk}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={record.status === 'Urgent' ? 'danger' : record.status === 'Monitor' ? 'warning' : record.status === 'Follow-up' ? 'info' : 'success'}>
                      {record.status}
                    </Badge>
                  </td>
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
