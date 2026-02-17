import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';
import { Menu } from 'lucide-react';

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // إغلاق القائمة عند تغيير الصفحة
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // إغلاق القائمة عند الضغط على Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className="min-h-screen flex">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#ffffff',
            color: '#1e293b',
            border: '1px solid rgba(203,213,225,0.5)',
            borderRadius: '12px',
            padding: '14px 20px',
            fontSize: '14px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="mobile-menu-btn"
        aria-label="فتح القائمة"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />
      
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 min-h-screen overflow-x-hidden main-content">
        <div className="main-content-inner">
          <Outlet />
        </div>
      </main>

      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-96 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>
    </div>
  );
}
