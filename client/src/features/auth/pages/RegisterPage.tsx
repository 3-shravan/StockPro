import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail01Icon,
  LockPasswordIcon,
  UserIcon,
  ArrowRight01Icon,
  PackageIcon,
  Briefcase01Icon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { authApi } from '../api/auth.api';
import { showToast } from '@/lib/toast';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    department: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { fullName, email, password } = formData;

    if (!fullName || !email || !password) {
      showToast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.register({
        ...formData,
        role: 'STAFF', // Default role for new registrations
      });

      showToast.success('Account created successfully! Please sign in.');
      navigate('/login');
    } catch (error: any) {
      // 400 errors (validation) are not toasted by the global interceptor
      if (error.response?.status === 400) {
        const message = error.response?.data?.message || 'Registration failed. Please check your inputs.';
        showToast.error(message);
      }
      console.error('Registration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="bg-primary p-2 rounded-xl">
              <PackageIcon className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight font-heading">StockPro</span>
          </Link>
          <h1 className="text-3xl font-bold font-heading">Create Account</h1>
          <p className="text-muted-foreground mt-2">Start managing your inventory professionally</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium px-1">Full Name</label>
            <div className="relative group">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full h-12 pl-11 pr-4 rounded-2xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium px-1">Email Address</label>
            <div className="relative group">
              <Mail01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="w-full h-12 pl-11 pr-4 rounded-2xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium px-1">Department (Optional)</label>
            <div className="relative group">
              <Briefcase01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="Logistics"
                className="w-full h-12 pl-11 pr-4 rounded-2xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium px-1">Password</label>
            <div className="relative group">
              <LockPasswordIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
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
            {isLoading ? 'Creating Account...' : 'Get Started'}
            {!isLoading && <ArrowRight01Icon className="w-5 h-5 ml-2" />}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};
