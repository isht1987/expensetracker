import { useState, type SyntheticEvent, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus, Mail, Lock, User, Building2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Logo from './Logo';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login, register } = useAuth();
  const [logoAnim, setLogoAnim] = useState(false);

  useEffect(() => {
    // small timeout so animation runs after initial paint
    const t = setTimeout(() => setLogoAnim(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (password !== passwordConfirm) {
          setError('Passwords do not match.');
          setIsLoading(false);
          return;
        }
        await register({
          username,
          email,
          password,
          password_confirm: passwordConfirm,
          first_name: firstName || username,
          last_name: lastName,
          company_name: companyName,
        });
      }
    } catch (err: any) {
      const anyErr = err;
      let nf;
      try {
        nf = anyErr.response?.data?.data?.non_field_errors || anyErr.response?.data?.non_field_errors;
        if (Array.isArray(nf)) nf = nf[0];
        if (!nf) nf = anyErr.response?.data?.message || anyErr.response?.data?.data?.message;
        if (!nf && anyErr.response?.data?.data && typeof anyErr.response.data.data === 'string') {
          nf = anyErr.response.data.data;
        }
      } catch (e) {
        nf = undefined;
      }

      if (nf) {
        setEmailError(nf);
        setPasswordError(nf);
      } else {
        setError(anyErr.response?.data?.message || (err instanceof Error ? err.message : 'An error occurred'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = (pass: string) => {
    if (pass.length === 0) return 0;
    if (pass.length < 6) return 1;
    if (pass.length < 10) return 2;
    return 3;
  };

  const getStrengthColor = (strength: number) => {
    if (strength === 1) return 'bg-red-500';
    if (strength === 2) return 'bg-yellow-500';
    if (strength === 3) return 'bg-green-500';
    return 'bg-gray-300';
  };

  const getStrengthText = (strength: number) => {
    if (strength === 1) return 'Weak';
    if (strength === 2) return 'Medium';
    if (strength === 3) return 'Strong';
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

  <div className="relative w-full max-w-sm">
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 sm:px-8 py-6 sm:py-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black/5"></div>
            <div className="relative">
              {/* Logo */}
              <div className="inline-flex flex-col items-center justify-center mb-4">
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shadow-lg flex items-center justify-center overflow-hidden mb-4 logo-anim-container ${logoAnim ? 'shrunk' : ''}`}>
                  <Logo className={`w-full h-full object-cover logo-anim-img ${logoAnim ? 'zoomed' : ''}`} />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">The Billman</h1>
              <p className="text-emerald-50 text-sm sm:text-base">
                {isLogin ? 'Welcome back! Sign in to continue' : 'Create your account to get started'}
              </p>
            </div>
          </div>

          {/* Form Container */}
          <div className="px-6 sm:px-8 py-6 sm:py-8">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                  <span className="text-red-600 text-xs font-bold">!</span>
                </div>
                <p className="text-sm flex-1">{error}</p>
              </div>
            )}

            <div className="space-y-4 sm:space-y-5">
              {!isLogin && (
                <>
                  {/* Username */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Username</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="w-5 h-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 sm:py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm sm:text-base"
                        placeholder="Choose a username"
                        required
                      />
                    </div>
                  </div>

                  {/* Name Fields - Side by Side on Desktop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-3 sm:py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm sm:text-base"
                        placeholder="First name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-3 sm:py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm sm:text-base"
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  {/* Company Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Company Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Building2 className="w-5 h-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 sm:py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm sm:text-base"
                        placeholder="Your company (optional)"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); setError(''); }}
                    className={`w-full pl-12 pr-4 py-3 sm:py-3.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition text-sm sm:text-base ${
                      emailError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-emerald-500'
                    }`}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                {emailError && (
                  <p className="text-sm text-red-600 flex items-center gap-2 mt-1">
                    <span className="w-1 h-1 rounded-full bg-red-600"></span>
                    {emailError}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setPasswordError(''); setError(''); }}
                    className={`w-full pl-12 pr-12 py-3 sm:py-3.5 border rounded-xl focus:ring-2 outline-none transition text-sm sm:text-base ${
                      passwordError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500'
                    }`}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-sm text-red-600 flex items-center gap-2 mt-1">
                    <span className="w-1 h-1 rounded-full bg-red-600"></span>
                    {passwordError}
                  </p>
                )}
                {!isLogin && password && (
                  <div className="space-y-2 mt-3">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            passwordStrength(password) >= level ? getStrengthColor(passwordStrength(password)) : 'bg-gray-200'
                          }`}
                        ></div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-600">
                      Password strength: <span className="font-semibold">{getStrengthText(passwordStrength(password))}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              {!isLogin && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 sm:py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm sm:text-base"
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {passwordConfirm && password === passwordConfirm && (
                    <p className="text-sm text-green-600 flex items-center gap-2 mt-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Passwords match
                    </p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3.5 sm:py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-emerald-500/30 text-sm sm:text-base mt-6"
              >
                {isLogin ? (
                  <>
                    <LogIn className="w-5 h-5" />
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </>
                )}
              </button>
            </div>

            {/* Toggle Login/Register */}
            <div className="mt-6 sm:mt-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setEmailError('');
                  setPasswordError('');
                }}
                className="mt-4 text-emerald-600 hover:text-emerald-700 font-semibold transition text-sm sm:text-base"
              >
                {isLogin ? 'Create a new account' : 'Sign in instead'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs sm:text-sm mt-6 px-4">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}