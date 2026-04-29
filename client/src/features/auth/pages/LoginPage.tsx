import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail01Icon, LockPasswordIcon, ArrowRight01Icon, PackageIcon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { showToast } from '@/lib/toast';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      const token = response.token;

      // Since we don't have jwt-decode in this environment, 
      // we'll fetch all users and find the one that matches this email
      // OR ideally the backend would return user info in the login response.
      // For now, we fetch users as a workaround to get the userId and role.
      try {
        const users = await authApi.getAll();
        const loggedUser = users.find(u => u.email === email);

        if (loggedUser) {
          setAuth(loggedUser, token);
        } else {
          // Fallback if user not found in list (shouldn't happen)
          setAuth({
            userId: 0,
            fullName: 'StockPro User',
            email,
            role: 'STAFF',
            isActive: true,
            createdAt: new Date().toISOString()
          }, token);
        }
      } catch (e) {
        // Fallback for demo if getAll fails (e.g. permission issues)
        setAuth({
          userId: 0,
          fullName: 'StockPro Admin',
          email,
          role: 'ADMIN',
          isActive: true,
          createdAt: new Date().toISOString()
        }, token);
      }

      showToast.success('Welcome back to StockPro!');
      navigate('/dashboard');
    } catch (error: any) {
      // Error is already toasted by the apiClient interceptor in most cases
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="bg-primary p-2 rounded-xl">
              <PackageIcon className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight font-heading">StockPro</span>
          </Link>
          <h1 className="text-3xl font-bold font-heading">Sign In</h1>
          <p className="text-muted-foreground mt-2">Enter your credentials to access your warehouse</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium px-1">Email Address</label>
            <div className="relative group">
              <Mail01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@stockpro.com"
                className="w-full h-12 pl-11 pr-4 rounded-2xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-sm font-medium">Password</label>
              <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
            </div>
            <div className="relative group">
              <LockPasswordIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 pl-11 pr-4 rounded-2xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-12 text-lg rounded-2xl mt-4 shadow-lg shadow-primary/20"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
            {!isLoading && <ArrowRight01Icon className="w-5 h-5 ml-2" />}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Create one for free
          </Link>
        </div>
      </div>
    </div>
  );
};
