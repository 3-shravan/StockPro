import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail01Icon, LockPasswordIcon, ArrowRight01Icon, PackageIcon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { showToast } from '@/lib/toast';
import { Role, type User } from '@/types';

const decodeJwtPayload = (token: string): Partial<Pick<User, 'role' | 'userId' | 'email'>> => {
  try {
    const payload = token.split('.')[1];
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decodedPayload = JSON.parse(atob(normalizedPayload));

    return {
      email: decodedPayload.sub,
      role: decodedPayload.role,
      userId: Number(decodedPayload.userId),
    };
  } catch {
    return {};
  }
};

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const redirectPathByRole: Record<Role, string> = {
    [Role.ADMIN]: '/admin',
    [Role.MANAGER]: '/manager',
    [Role.STAFF]: '/warehouse',
    [Role.OFFICER]: '/purchase',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      const tokenClaims = decodeJwtPayload(response.token);
      const role = response.role ?? tokenClaims.role;
      const userId = response.userId ?? tokenClaims.userId;

      if (!response.token || !role || !userId) {
        throw new Error('Login response is missing token, role, or userId.');
      }

      const fallbackUser: User = {
        userId,
        fullName: 'StockPro User',
        email: tokenClaims.email ?? email,
        role,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      setAuth(fallbackUser, response.token);

      try {
        const profile = await authApi.getMe(response.token);
        setAuth(profile, response.token);
      } catch {
        try {
          const profile = await authApi.getProfile(userId);
          setAuth(profile, response.token);
        } catch {
          // Keep the fallback session when profile endpoints are unavailable.
        }
      }

      showToast.success('Welcome back to StockPro!');
      navigate(redirectPathByRole[role], { replace: true });
    } catch (error: any) {
      // Handled globally by apiClient interceptor
      console.error('Login failed:', error);
      showToast.error(error?.message ?? 'Unable to sign in. Please try again.');
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
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="bg-primary p-2 rounded-xl">
              <PackageIcon className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight font-heading">StockPro</span>
          </div>
          <h1 className="text-3xl font-bold font-heading">Sign In</h1>
          <p className="text-muted-foreground mt-2">Enter your credentials to access your workspace</p>
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
      </div>
    </div>
  );
};
