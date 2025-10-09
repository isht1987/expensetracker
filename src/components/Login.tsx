import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus } from 'lucide-react';

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

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (err) {
      // Try to parse field-level auth errors returned by the backend
      // Common shape: { status: 'error', message: '...', data: { non_field_errors: 'Invalid email or password' } }
      // Or DRF common: { non_field_errors: ['Invalid credentials'] }
      // We'll map non_field_errors to both email and password fields for visibility.
      // Fallback to generic message in top-level error box.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyErr: any = err;
      let nf: string | undefined;
      try {
        // common shapes
        nf = anyErr.response?.data?.data?.non_field_errors || anyErr.response?.data?.non_field_errors;
        if (Array.isArray(nf)) nf = nf[0];
        // sometimes message is at response.data.message
        if (!nf) nf = anyErr.response?.data?.message || anyErr.response?.data?.data?.message;
        // some backends put the string directly in data.non_field_errors
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
            <LogIn className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Expense Tracker</h1>
          <p className="text-slate-500 mt-2">
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  placeholder="Enter your first name (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  placeholder="Enter your last name (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  placeholder="Enter your company name (optional)"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(''); setError(''); }}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              placeholder="Enter your email"
              required
            />
            {emailError && <p className="text-sm text-red-600 mt-2">{emailError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(''); setError(''); }}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              placeholder="Enter your password"
              required
            />
            {passwordError && <p className="text-sm text-red-600 mt-2">{passwordError}</p>}
          </div>
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                placeholder="Confirm your password"
                required
              />
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}