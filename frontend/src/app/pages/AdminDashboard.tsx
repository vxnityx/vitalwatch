import { KPICard, Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Users, Activity, AlertTriangle, Heart, TrendingUp, Brain } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const wellnessTrendData = [
  { month: 'Jan', wellness: 85, checks: 420 },
  { month: 'Feb', wellness: 87, checks: 450 },
  { month: 'Mar', wellness: 84, checks: 480 },
  { month: 'Apr', wellness: 88, checks: 510 },
  { month: 'May', wellness: 90, checks: 540 },
  { month: 'Jun', wellness: 89, checks: 520 },
];

const riskDistributionData = [
  { name: 'Normal', value: 450, color: '#22C55E' },
  { name: 'Moderate', value: 120, color: '#F59E0B' },
  { name: 'High', value: 45, color: '#EF4444' },
  { name: 'Critical', value: 12, color: '#991B1B' },
];

const collegeComparisonData = [
  { college: 'Engineering', wellness: 88, students: 320 },
  { college: 'Medicine', wellness: 92, students: 280 },
  { college: 'Business', wellness: 85, students: 350 },
  { college: 'Arts', wellness: 87, students: 290 },
  { college: 'Science', wellness: 89, students: 310 },
];

const recentActivities = [
  { id: 1, student: 'John Doe', type: 'High BP Alert', time: '5 mins ago', status: 'danger' },
  { id: 2, student: 'Jane Smith', type: 'Temperature Check', time: '12 mins ago', status: 'success' },
  { id: 3, student: 'Mike Johnson', type: 'Emotional Risk', time: '25 mins ago', status: 'warning' },
  { id: 4, student: 'Sarah Williams', type: 'Health Check', time: '1 hour ago', status: 'success' },
  { id: 5, student: 'David Brown', type: 'Heart Rate Alert', time: '2 hours ago', status: 'warning' },
];

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your wellness overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]">
            <option>Last 30 Days</option>
            <option>Last 7 Days</option>
            <option>Last 90 Days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Total Students"
          value="2,547"
          icon={<Users className="w-6 h-6" />}
          trend="+12% from last month"
          trendUp={true}
          color="blue"
        />
        <KPICard
          title="Total Employees"
          value="834"
          icon={<Users className="w-6 h-6" />}
          trend="+5% from last month"
          trendUp={true}
          color="teal"
        />
        <KPICard
          title="Health Checks Today"
          value="342"
          icon={<Activity className="w-6 h-6" />}
          trend="+18% from yesterday"
          trendUp={true}
          color="emerald"
        />
        <KPICard
          title="Active Red Flags"
          value="23"
          icon={<AlertTriangle className="w-6 h-6" />}
          trend="-8% from last week"
          trendUp={true}
          color="red"
        />
        <KPICard
          title="Wellness Score"
          value="88.5%"
          icon={<Heart className="w-6 h-6" />}
          trend="+2.3% improvement"
          trendUp={true}
          color="purple"
        />
        <KPICard
          title="Emotional Risk Cases"
          value="47"
          icon={<Brain className="w-6 h-6" />}
          trend="-5% from last month"
          trendUp={true}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Wellness Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={wellnessTrendData}>
              <defs>
                <linearGradient id="colorWellness" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F6CBD" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0F6CBD" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Area type="monotone" dataKey="wellness" stroke="#0F6CBD" fill="url(#colorWellness)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Check Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={wellnessTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="checks" stroke="#14B8A6" strokeWidth={2} dot={{ fill: '#14B8A6' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {riskDistributionData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-700">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">College Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={collegeComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="college" stroke="#6b7280" angle={-15} textAnchor="end" height={80} />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="wellness" fill="#0F6CBD" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Student</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Activity Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Time</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.map((activity) => (
                <tr key={activity.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-900">{activity.student}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{activity.type}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{activity.time}</td>
                  <td className="py-3 px-4">
                    <Badge variant={activity.status as any}>
                      {activity.status === 'success' ? 'Completed' : activity.status === 'warning' ? 'Needs Attention' : 'Critical'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
