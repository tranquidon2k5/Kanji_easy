'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Mode = 'login' | 'signup';

export default function LoginForm({ error }: { error?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(
    error ? { type: 'error', text: 'Đăng nhập thất bại. Vui lòng thử lại.' } : null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const supabase = createClient();

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ type: 'error', text: mapError(error.message) });
        setIsLoading(false);
      } else {
        router.push('/active-learning');
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage({ type: 'error', text: mapError(error.message) });
        setIsLoading(false);
      } else {
        setMessage({
          type: 'success',
          text: 'Tạo tài khoản thành công! Vui lòng kiểm tra email để xác nhận (hoặc đăng nhập ngay nếu tắt xác nhận email).',
        });
        setIsLoading(false);
        setMode('login');
      }
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      {/* Tab switcher */}
      <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
        <button
          type="button"
          onClick={() => { setMode('login'); setMessage(null); }}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            mode === 'login'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Đăng nhập
        </button>
        <button
          type="button"
          onClick={() => { setMode('signup'); setMessage(null); }}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            mode === 'signup'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Đăng ký
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Mật khẩu
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            minLength={6}
            placeholder="••••••••"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
          />
          {mode === 'signup' && (
            <p className="text-xs text-gray-400 mt-1">Tối thiểu 6 ký tự</p>
          )}
        </div>

        {message && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              message.type === 'error'
                ? 'bg-red-50 text-red-700'
                : 'bg-green-50 text-green-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors text-sm"
        >
          {isLoading
            ? 'Đang xử lý...'
            : mode === 'login'
            ? 'Đăng nhập'
            : 'Tạo tài khoản'}
        </button>
      </form>
    </div>
  );
}

function mapError(msg: string): string {
  if (msg.includes('Invalid login credentials'))
    return 'Email hoặc mật khẩu không đúng.';
  if (msg.includes('Email not confirmed'))
    return 'Vui lòng xác nhận email trước khi đăng nhập.';
  if (msg.includes('User already registered'))
    return 'Email này đã được đăng ký. Vui lòng đăng nhập.';
  if (msg.includes('Password should be at least'))
    return 'Mật khẩu phải có ít nhất 6 ký tự.';
  return 'Có lỗi xảy ra. Vui lòng thử lại.';
}
