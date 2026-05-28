import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Activity, Heart, TrendingUp, Users } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 bg-gradient-to-br from-[#0F6CBD] via-[#0D5AAD] to-[#14B8A6] p-12 flex flex-col justify-between text-white">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold">VitalWatch+</h1>
          </div>

          <div className="max-w-md">
            <h2 className="text-4xl font-bold mb-4">
              Welcome to Intelligent Wellness Monitoring
            </h2>
            <p className="text-blue-100 text-lg mb-12">
              Track health metrics, detect risks early, and improve wellness outcomes for your organization.
            </p>

            <div className="space-y-6">
              {/* <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">10,000+</h3>
                    <p className="text-sm text-blue-100">Active users monitored</p>
                  </div>
                </div>
              </div> */}

              {/* <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">50,000+</h3>
                    <p className="text-sm text-blue-100">Health checks completed</p>
                  </div>
                </div>
              </div> */}

              {/* <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">95%</h3>
                    <p className="text-sm text-blue-100">Early risk detection rate</p>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </div>

        <div className="text-sm text-blue-100">
          <p>&copy; 2026 VitalWatch+. All rights reserved.</p>
        </div>
      </div>

      <div className="flex-1 bg-white flex items-center justify-center p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
            <p className="text-gray-600">Access your wellness dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              type="email"
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#0F6CBD] focus:ring-[#0F6CBD]"
                />
                <span className="text-sm text-gray-700">Remember me</span>
              </label>
              <a href="#" className="text-sm text-[#0F6CBD] hover:underline">
                Forgot Password?
              </a>
            </div>

            <Button type="submit" variant="primary" className="w-full">
              Sign In
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="#" className="text-[#0F6CBD] font-medium hover:underline">
                  Create Account
                </a>
              </p>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
