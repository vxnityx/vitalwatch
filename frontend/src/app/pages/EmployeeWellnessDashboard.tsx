import { KPICard, Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Briefcase, AlertTriangle, TrendingUp, Heart } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const wellnessTrendData = [
  { month: 'Jan', wellness: 82 },
  { month: 'Feb', wellness: 85 },
  { month: 'Mar', wellness: 83 },
  { month: 'Apr', wellness: 87 },
  { month: 'May', wellness: 89 },
  { month: 'Jun', wellness: 90 },
];

const departmentData = [
  { dept: 'IT', wellness: 88 },
  { dept: 'HR', wellness: 92 },
  { dept: 'Finance', wellness: 85 },
  { dept: 'Operations', wellness: 87 },
  { dept: 'Marketing', wellness: 90 },
];

const riskData = [
  { name: 'Normal', value: 680, color: '#22C55E' },
  { name: 'Moderate', value: 110, color: '#F59E0B' },
  { name: 'High', value: 35, color: '#EF4444' },
  { name: 'Critical', value: 9, color: '#991B1B' },
];

const employeeRecords = [
  { id: 1, name: 'Alice Johnson', dept: 'IT', bp: '125/82', temp: '36.7°C', emotion: 'Happy', risk: 'Normal', date: '2026-05-23' },
  { id: 2, name: 'Bob Smith', dept: 'HR', bp: '138/88', temp: '36.9°C', emotion: 'Neutral', risk: 'Moderate', date: '2026-05-23' },
  { id: 3, name: 'Carol White', dept: 'Finance', bp: '145/95', temp: '37.2°C', emotion: 'Stressed', risk: 'High', date: '2026-05-23' },
  { id: 4, name: 'David Brown', dept: 'Operations', bp: '120/78', temp: '36.5°C', emotion: 'Happy', risk: 'Normal', date: '2026-05-23' },
  { id: 5, name: 'Emma Davis', dept: 'Marketing', bp: '132/85', temp: '36.8°C', emotion: 'Neutral', risk: 'Normal', date: '2026-05-23' },
];

export function EmployeeWellnessDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Wellness Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor employee health and wellness metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Wellness Records"
          value="834"
          icon={<Briefcase className="w-6 h-6" />}
          trend="+8% from last month"
          trendUp={true}
          color="blue"
        />
        <KPICard
          title="Elevated BP Cases"
          value="44"
          icon={<Heart className="w-6 h-6" />}
          trend="-12% from last month"
          trendUp={true}
          color="red"
        />
        <KPICard
          title="Emotional Wellness"
          value="32"
          icon={<AlertTriangle className="w-6 h-6" />}
          color="orange"
        />
        <KPICard
          title="Wellness Score"
          value="89.2%"
          icon={<TrendingUp className="w-6 h-6" />}
          trend="+3.5% improvement"
          trendUp={true}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Wellness Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={wellnessTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="wellness" stroke="#0F6CBD" strokeWidth={2} dot={{ fill: '#0F6CBD' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Wellness Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dept" stroke="#6b7280" angle={-15} textAnchor="end" height={80} />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="wellness" fill="#14B8A6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Level Distribution</h3>
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
                dataKey="value"
              >
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4">
          {riskData.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="text-sm text-gray-700">{item.name}: {item.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Wellness Records</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Employee</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Department</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">BP</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Temperature</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Emotion</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Risk Level</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Last Check</th>
              </tr>
            </thead>
            <tbody>
              {employeeRecords.map((employee) => (
                <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{employee.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{employee.dept}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{employee.bp}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{employee.temp}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{employee.emotion}</td>
                  <td className="py-3 px-4">
                    <Badge variant={employee.risk === 'High' ? 'danger' : employee.risk === 'Moderate' ? 'warning' : 'success'}>
                      {employee.risk}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{employee.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
