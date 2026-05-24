import { KPICard, Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Brain, Frown, Angry, TrendingDown, Smile } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const emotionTrendData = [
  { week: 'Week 1', happy: 280, neutral: 150, sad: 65, angry: 35, stressed: 95 },
  { week: 'Week 2', happy: 310, neutral: 140, sad: 58, angry: 28, stressed: 88 },
  { week: 'Week 3', happy: 295, neutral: 160, sad: 72, angry: 42, stressed: 102 },
  { week: 'Week 4', happy: 320, neutral: 155, sad: 60, angry: 30, stressed: 85 },
];

const emotionDistributionData = [
  { name: 'Happy', value: 320, color: '#22C55E' },
  { name: 'Neutral', value: 180, color: '#94A3B8' },
  { name: 'Sad', value: 75, color: '#3B82F6' },
  { name: 'Angry', value: 42, color: '#EF4444' },
  { name: 'Stressed', value: 110, color: '#F59E0B' },
];

const yearLevelData = [
  { year: '1st Year', happy: 85, sad: 25, angry: 15, stressed: 30 },
  { year: '2nd Year', happy: 78, sad: 32, angry: 18, stressed: 38 },
  { year: '3rd Year', happy: 72, sad: 40, angry: 22, stressed: 45 },
  { year: '4th Year', happy: 85, sad: 28, angry: 12, stressed: 35 },
];

const emotionalRecords = [
  { id: 1, student: 'John Doe', emotion: 'Stressed', risk: 'High', course: 'Computer Science', year: '3rd Year', date: '2026-05-23' },
  { id: 2, student: 'Sarah Johnson', emotion: 'Sad', risk: 'Moderate', course: 'Engineering', year: '2nd Year', date: '2026-05-23' },
  { id: 3, student: 'Mike Williams', emotion: 'Angry', risk: 'High', course: 'Business', year: '4th Year', date: '2026-05-23' },
  { id: 4, student: 'Emily Brown', emotion: 'Happy', risk: 'Normal', course: 'Medicine', year: '1st Year', date: '2026-05-23' },
  { id: 5, student: 'David Lee', emotion: 'Sad', risk: 'Moderate', course: 'Arts', year: '3rd Year', date: '2026-05-23' },
  { id: 6, student: 'Lisa Anderson', emotion: 'Stressed', risk: 'Critical', course: 'Engineering', year: '3rd Year', date: '2026-05-23' },
];

export function GuidanceMonitoringDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Guidance Monitoring Dashboard</h1>
          <p className="text-gray-600 mt-1">Emotional wellness tracking and mental health support</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Emotional Risk Cases"
          value="47"
          icon={<Brain className="w-6 h-6" />}
          trend="-8% from last month"
          trendUp={true}
          color="purple"
        />
        <KPICard
          title="Sad Emotion Cases"
          value="75"
          icon={<Frown className="w-6 h-6" />}
          color="blue"
        />
        <KPICard
          title="Angry Emotion Cases"
          value="42"
          icon={<Angry className="w-6 h-6" />}
          color="red"
        />
        <KPICard
          title="Wellness Score"
          value="76.8%"
          icon={<Smile className="w-6 h-6" />}
          trend="+4.2% improvement"
          trendUp={true}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Emotion Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={emotionTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="happy" stroke="#22C55E" strokeWidth={2} />
              <Line type="monotone" dataKey="sad" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="stressed" stroke="#F59E0B" strokeWidth={2} />
              <Line type="monotone" dataKey="angry" stroke="#EF4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Emotion Distribution</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={emotionDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {emotionDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {emotionDistributionData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-700">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Year-Level Emotional Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={yearLevelData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="happy" fill="#22C55E" radius={[8, 8, 0, 0]} />
            <Bar dataKey="sad" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            <Bar dataKey="angry" fill="#EF4444" radius={[8, 8, 0, 0]} />
            <Bar dataKey="stressed" fill="#F59E0B" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Emotional Records</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Student</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Emotion</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Risk Level</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Course</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Year Level</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {emotionalRecords.map((record) => (
                <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{record.student}</td>
                  <td className="py-3 px-4">
                    <Badge variant={
                      record.emotion === 'Happy' ? 'success' :
                      record.emotion === 'Sad' ? 'info' :
                      record.emotion === 'Angry' ? 'danger' :
                      record.emotion === 'Stressed' ? 'warning' : 'neutral'
                    }>
                      {record.emotion}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={
                      record.risk === 'Critical' ? 'danger' :
                      record.risk === 'High' ? 'warning' :
                      record.risk === 'Moderate' ? 'info' : 'success'
                    }>
                      {record.risk}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.course}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.year}</td>
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
