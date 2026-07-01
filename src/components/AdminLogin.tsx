import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { signInAdmin, AdminAuthError, type AdminSession } from '../lib/admin-auth';

interface AdminLoginProps {
  onAuthenticated: (session: AdminSession) => void;
}

export default function AdminLogin({ onAuthenticated }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const session = await signInAdmin(email.trim(), password);
      onAuthenticated(session);
    } catch (err) {
      setError(err instanceof AdminAuthError ? err.message : 'Ismeretlen hiba történt a bejelentkezés során.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto rounded-2xl border border-gray-150 bg-white px-6 py-10 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-brand-red/10 text-brand-red">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-gray-900">Admin belépés</h1>
          <p className="text-sm text-gray-500">Csak jogosult felhasználóknak.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5" htmlFor="admin-email">
            E-mail cím
          </label>
          <input
            id="admin-email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5" htmlFor="admin-password">
            Jelszó
          </label>
          <input
            id="admin-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-brand-red text-white font-bold py-2.5 text-sm disabled:opacity-60"
        >
          {isSubmitting ? 'Bejelentkezés...' : 'Bejelentkezés'}
        </button>
      </form>
    </div>
  );
}
