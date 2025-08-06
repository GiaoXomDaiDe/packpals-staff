import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LogIn, Package, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { authAPI } from '../lib/api/auth';
import { StaffLoginSchema, type StaffLoginFormData } from '../lib/schemas/auth.schema';

interface LoginProps {
  onLogin: (user: any, token: string) => Promise<void>;
  isLoading?: boolean;
}

export function Login({ onLogin, isLoading: externalLoading }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Setup form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors
  } = useForm<StaffLoginFormData>({
    resolver: zodResolver(StaffLoginSchema),
    mode: 'onChange',
    defaultValues: {
      username: '',
      password: '',
    }
  });

  const isLoading = externalLoading || isSubmitting;

  const onSubmit = async (data: StaffLoginFormData) => {
    if (isLoading) return;
    
    setIsSubmitting(true);
    clearErrors();
    
    try {
      const response = await authAPI.login({
        username: data.username,
        password: data.password,
      });

      if (response.success) {
        // Store token and user data in localStorage
        localStorage.setItem('staff_token', response.data.token);
        localStorage.setItem('staff_user', JSON.stringify(response.data.user));
        
        // Call parent onLogin with user data and token
        await onLogin(response.data.user, response.data.token);
      } else {
        setError('root', {
          type: 'manual',
          message: response.message || 'Đăng nhập thất bại'
        });
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError('root', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'Đăng nhập thất bại. Vui lòng thử lại.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Glass card effect */}
        <div className="backdrop-blur-lg bg-white/80 rounded-3xl shadow-2xl border border-white/20 p-8 md:p-10">
          {/* Logo and header */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <div className="mx-auto h-20 w-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
                <Package className="h-10 w-10 text-white" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-400 animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              PackPals Staff
            </h1>
            <p className="text-gray-600 text-sm">Chào mừng bạn trở lại! 👋</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Display general error */}
            {errors.root && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <p className="text-red-600 text-sm font-medium">{errors.root.message}</p>
              </div>
            )}

            {/* Username field */}
            <div className="relative">
              <div className={`relative transition-all duration-300 ${
                focusedField === 'username' ? 'transform scale-[1.02]' : ''
              }`}>
                <input
                  id="username"
                  type="text"
                  {...register('username')}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full px-5 py-4 bg-gray-50/50 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 placeholder-gray-400 font-medium ${
                    errors.username ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200'
                  }`}
                  placeholder="Tên đăng nhập"
                />
                {focusedField === 'username' && (
                  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-lg opacity-20"></div>
                )}
              </div>
              {errors.username && (
                <p className="text-red-500 text-xs mt-1 ml-2">{errors.username.message}</p>
              )}
            </div>

            {/* Password field */}
            <div className="relative">
              <div className={`relative transition-all duration-300 ${
                focusedField === 'password' ? 'transform scale-[1.02]' : ''
              }`}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full px-5 py-4 pr-14 bg-gray-50/50 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 placeholder-gray-400 font-medium ${
                    errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200'
                  }`}
                  placeholder="Mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all hover:scale-110"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                {focusedField === 'password' && (
                  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-lg opacity-20"></div>
                )}
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1 ml-2">{errors.password.message}</p>
              )}
            </div>

            {/* Remember me and forgot password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="ml-2 text-gray-600 group-hover:text-gray-800 transition-colors">
                  Ghi nhớ đăng nhập
                </span>
              </label>
              <a href="#" className="text-blue-600 hover:text-purple-600 transition-colors font-medium">
                Quên mật khẩu?
              </a>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl flex items-center justify-center group"
            >
              <span className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></span>
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Đăng nhập
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/80 text-gray-500">Hoặc</span>
            </div>
          </div>

          {/* Social login buttons */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center px-4 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="ml-2 text-gray-700 font-medium">Google</span>
            </button>
            <button className="flex items-center justify-center px-4 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="ml-2 text-gray-700 font-medium">GitHub</span>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              Bằng việc đăng nhập, bạn đồng ý với{' '}
              <a href="#" className="text-blue-600 hover:text-purple-600 transition-colors">
                Điều khoản sử dụng
              </a>{' '}
              và{' '}
              <a href="#" className="text-blue-600 hover:text-purple-600 transition-colors">
                Chính sách bảo mật
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}