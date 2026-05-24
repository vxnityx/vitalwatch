import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { FileText, Download, Printer, Calendar, Filter } from 'lucide-react';

const reportCategories = [
  { id: 1, title: 'Daily Health Reports', description: 'Comprehensive daily health check summaries', icon: <FileText className="w-6 h-6" />, count: 547 },
  { id: 2, title: 'Monthly Wellness Reports', description: 'Monthly wellness trends and analytics', icon: <FileText className="w-6 h-6" />, count: 18 },
  { id: 3, title: 'Red Flag Summaries', description: 'Critical cases and urgent health alerts', icon: <FileText className="w-6 h-6" />, count: 23 },
  { id: 4, title: 'Emotional Wellness Reports', description: 'Mental health and emotional wellness tracking', icon: <FileText className="w-6 h-6" />, count: 127 },
  { id: 5, title: 'College-Based Analytics', description: 'Department and college comparison reports', icon: <FileText className="w-6 h-6" />, count: 12 },
  { id: 6, title: 'Employee Wellness Reports', description: 'Employee health and wellness summaries', icon: <FileText className="w-6 h-6" />, count: 84 },
];

const recentReports = [
  { id: 1, name: 'May 2026 Wellness Summary', type: 'Monthly Report', date: '2026-05-23', status: 'Ready' },
  { id: 2, name: 'Student Critical Cases - Week 20', type: 'Red Flag Report', date: '2026-05-22', status: 'Ready' },
  { id: 3, name: 'Engineering College Analytics', type: 'College Report', date: '2026-05-21', status: 'Ready' },
  { id: 4, name: 'Daily Health Check - May 23', type: 'Daily Report', date: '2026-05-23', status: 'Ready' },
  { id: 5, name: 'Emotional Wellness - Q2 2026', type: 'Quarterly Report', date: '2026-05-20', status: 'Ready' },
];

export function ReportsDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports Dashboard</h1>
          <p className="text-gray-600 mt-1">Generate and manage wellness reports</p>
        </div>
        <Button variant="primary">
          <FileText className="w-4 h-4 mr-2" />
          Generate New Report
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-teal-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
                <option>Custom Range</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">College</label>
            <select className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]">
              <option>All Colleges</option>
              <option>Engineering</option>
              <option>Business</option>
              <option>Medicine</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]">
              <option>All Departments</option>
              <option>IT</option>
              <option>HR</option>
              <option>Finance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
            <select className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]">
              <option>All Levels</option>
              <option>Normal</option>
              <option>Moderate</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>
        </div>
      </Card>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportCategories.map((category) => (
            <Card key={category.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 text-[#0F6CBD] rounded-xl">
                  {category.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{category.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                  <p className="text-xs text-gray-500">{category.count} reports available</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Export Options</h3>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Print Report
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download Analytics
            </Button>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Select a report category and filters to preview</p>
          <Button variant="primary">Generate Preview</Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Report Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Generated Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentReports.map((report) => (
                <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{report.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{report.type}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{report.date}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {report.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button className="text-[#0F6CBD] hover:text-[#0D5AAD] text-sm font-medium">
                        View
                      </button>
                      <button className="text-[#0F6CBD] hover:text-[#0D5AAD] text-sm font-medium">
                        Download
                      </button>
                      <button className="text-[#0F6CBD] hover:text-[#0D5AAD] text-sm font-medium">
                        Share
                      </button>
                    </div>
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
