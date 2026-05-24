import { Link } from 'react-router';
import { Button } from '../components/Button';
import {
  Activity,
  Heart,
  Thermometer,
  Gauge,
  Brain,
  Shield,
  BarChart3,
  FileText,
  CheckCircle,
  TrendingUp,
  Database,
  Lock,
} from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0F6CBD] to-[#14B8A6] rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">VitalWatch+</h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Link to="/login">
              <Button variant="ghost" className="w-full sm:w-auto">Sign In</Button>
            </Link>
            <Link to="/login">
              <Button variant="primary" className="w-full sm:w-auto">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-16 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Monitor Wellness. Detect Risks. Improve Health Outcomes.
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8">
              An intelligent wellness monitoring platform that tracks blood pressure, temperature, heart rate, and emotional wellness for students and employees.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <Link to="/login">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">Get Started</Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">Sign In</Button>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-8 border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 text-center">
              <div className="p-6 bg-blue-50 rounded-2xl">
                <Heart className="w-8 h-8 text-[#0F6CBD] mx-auto mb-2" />
                <p className="text-sm text-gray-600">Blood Pressure</p>
              </div>
              <div className="p-6 bg-teal-50 rounded-2xl">
                <Thermometer className="w-8 h-8 text-[#14B8A6] mx-auto mb-2" />
                <p className="text-sm text-gray-600">Temperature</p>
              </div>
              <div className="p-6 bg-emerald-50 rounded-2xl">
                <Activity className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Heart Rate</p>
              </div>
              <div className="p-6 bg-purple-50 rounded-2xl">
                <Brain className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Emotional Wellness</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Heart className="w-6 h-6" />, title: 'Blood Pressure Monitoring', color: 'blue' },
              { icon: <Thermometer className="w-6 h-6" />, title: 'Temperature Monitoring', color: 'teal' },
              { icon: <Activity className="w-6 h-6" />, title: 'Heart Rate Tracking', color: 'emerald' },
              { icon: <Brain className="w-6 h-6" />, title: 'Emotional Wellness Analysis', color: 'purple' },
              { icon: <BarChart3 className="w-6 h-6" />, title: 'Real-Time Analytics', color: 'blue' },
              { icon: <Shield className="w-6 h-6" />, title: 'Risk Detection Alerts', color: 'red' },
              { icon: <Gauge className="w-6 h-6" />, title: 'Role-Based Dashboards', color: 'teal' },
              { icon: <FileText className="w-6 h-6" />, title: 'Report Generation', color: 'emerald' },
            ].map((feature, i) => (
              <div key={i} className="p-6 bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 bg-${feature.color}-50 text-${feature.color}-600 rounded-xl flex items-center justify-center mb-4`}>
                  {feature.icon}
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-600">Comprehensive monitoring and tracking capabilities.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Record Health Data', description: 'Easily log vital signs and emotional wellness data through our intuitive interface.' },
              { step: '2', title: 'Analyze Wellness Trends', description: 'Our system analyzes patterns and identifies potential health risks in real-time.' },
              { step: '3', title: 'Generate Insights & Reports', description: 'Get actionable insights and comprehensive reports for better health outcomes.' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#0F6CBD] to-[#14B8A6] text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <CheckCircle className="w-6 h-6" />, title: 'Early Risk Detection', description: 'Identify health risks before they become critical.' },
              { icon: <TrendingUp className="w-6 h-6" />, title: 'Improved Wellness Monitoring', description: 'Track wellness trends over time with precision.' },
              { icon: <BarChart3 className="w-6 h-6" />, title: 'Data-Driven Decision Making', description: 'Make informed decisions based on comprehensive analytics.' },
              { icon: <Database className="w-6 h-6" />, title: 'Comprehensive Analytics', description: 'Access detailed reports and visualizations.' },
              { icon: <Lock className="w-6 h-6" />, title: 'Secure Health Records', description: 'Enterprise-grade security for sensitive health data.' },
            ].map((benefit, i) => (
              <div key={i} className="p-6 bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl">
                <div className="w-12 h-12 bg-white text-[#0F6CBD] rounded-xl flex items-center justify-center mb-4">
                  {benefit.icon}
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{benefit.title}</h4>
                <p className="text-sm text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#0F6CBD] to-[#14B8A6] rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold">VitalWatch+</h3>
              </div>
              <p className="text-gray-400 text-sm">Intelligent wellness monitoring for universities and organizations.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2026 VitalWatch+. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
