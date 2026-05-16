import { useEffect, useState } from 'react';
import { authApi } from '@/features/auth/api/auth.api';
import type { User } from '@/types';
import { UserIcon } from 'hugeicons-react';

interface UserSelectProps {
  value: number;
  onChange: (userId: number, user?: User) => void;
  roleFilter?: string;
  className?: string;
  placeholder?: string;
}

export const UserSelect = ({ 
  value, 
  onChange, 
  roleFilter,
  className = '', 
  placeholder = 'Select user...' 
}: UserSelectProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let allUsers = await authApi.getAll();
        if (roleFilter) {
          allUsers = allUsers.filter(u => u.role === roleFilter);
        }
        setUsers(allUsers);
      } catch (error) {
        console.error('Failed to load users', error);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [roleFilter]);

  return (
    <div className={`relative ${className}`}>
      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <select
        value={value}
        onChange={(e) => {
          const id = Number(e.target.value);
          const user = users.find(u => u.userId === id);
          onChange(id, user);
        }}
        className="h-11 w-full rounded-2xl border border-input/60 bg-background pl-9 pr-3 text-sm focus:border-primary outline-none appearance-none"
      >
        <option value={0}>{loading ? 'Loading...' : placeholder}</option>
        {users.map((u) => (
          <option key={u.userId} value={u.userId}>
            {u.fullName} ({u.role})
          </option>
        ))}
      </select>
    </div>
  );
};
