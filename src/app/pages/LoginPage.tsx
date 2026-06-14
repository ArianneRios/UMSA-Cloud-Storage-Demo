import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Shield, Eye, EyeOff, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await login({ email, password });
      
      if (result.success) {
        toast.success('Welcome to UMSA Cloud Storage!', {
          description: 'You have successfully logged in.',
        });
        
        // Navigate to intended destination or dashboard
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'Invalid credentials');
        toast.error('Login failed', {
          description: result.error || 'Please check your credentials and try again.',
        });
      }
    } catch (err) {
      setError('An unexpected error occurred');
      toast.error('Error', {
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="text-white space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">UMSA Cloud Storage</h1>
              <p className="text-cyan-400 text-sm">Secure Academic Storage</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-balance">
            Secure academic cloud storage for UMSA students
          </h2>

          <p className="text-slate-300 text-lg leading-relaxed">
            Store, organize, and access your academic files securely. Every file is
            automatically scanned for malware before becoming available.
          </p>

          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="font-semibold">Automatic Malware Scanning</div>
                <div className="text-sm text-slate-400">
                  VirusTotal integration for maximum security
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="font-semibold">AWS Cloud Infrastructure</div>
                <div className="text-sm text-slate-400">
                  S3, Lambda, and CloudWatch powered
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Sign in to your account</h3>
            <p className="text-slate-400">Enter your UMSA institutional credentials</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-300">{error}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="demo@cloud.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-12 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
            <div className="text-xs font-semibold text-cyan-400 mb-2">Demo Credentials</div>
            <div className="text-sm text-slate-300 space-y-1">
              <div>
                Email: <span className="text-white font-mono">demo@cloud.com</span>
              </div>
              <div>
                Password: <span className="text-white font-mono">123456</span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-slate-500">
            <p>In production, passwords are validated using bcrypt or Argon2 hashing.</p>
            <p>Never store plain text passwords in PostgreSQL.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
