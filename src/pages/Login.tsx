import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Mail, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ padding: '24px' }}>
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <div className="w-full relative" style={{ maxWidth: '480px' }}>
        {/* Logo */}
        <div className="text-center" style={{ marginBottom: '40px' }}>
          <div 
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg shadow-primary-500/30"
            style={{ width: '88px', height: '88px', marginBottom: '20px' }}
          >
            <BookOpen style={{ width: '44px', height: '44px', color: 'white' }} />
          </div>
          <h1 className="gradient-text" style={{ fontSize: '42px', fontWeight: 700 }}>تعلم العربية</h1>
          <p style={{ color: '#64748b', marginTop: '10px', fontSize: '17px' }}>لوحة تحكم المشرفين</p>
        </div>

        {/* Login Form */}
        <div className="glass rounded-3xl" style={{ padding: '40px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 700, color: 'white', textAlign: 'center', marginBottom: '32px' }}>
            تسجيل الدخول
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label className="form-label">البريد الإلكتروني</label>
              <div className="relative">
                <Mail 
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{ right: '18px', width: '22px', height: '22px', color: '#64748b' }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  style={{ paddingRight: '52px' }}
                  placeholder="admin@example.com"
                  dir="ltr"
                />
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label className="form-label">كلمة المرور</label>
              <div className="relative">
                <Lock 
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{ right: '18px', width: '22px', height: '22px', color: '#64748b' }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingRight: '52px' }}
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
              style={{ padding: '18px 28px' }}
            >
              {isLoading ? (
                <>
                  <Loader2 style={{ width: '22px', height: '22px' }} className="animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', marginTop: '32px' }}>
          © 2024 تعلم العربية. جميع الحقوق محفوظة.
        </p>
      </div>
    </div>
  );
}
