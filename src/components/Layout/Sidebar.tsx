import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Layers,
  Upload,
  ClipboardList,
  HelpCircle,
  Blocks,
  UserCog,
  School,
  FolderOpen,
  LogOut,
  Users,
  Award,
  X,
  CreditCard,
  UserPlus,
  Receipt,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { path: '/admin-accounts', icon: UserCog, label: 'حسابات المشرفين' },
  { path: '/levels', icon: Layers, label: 'المستويات' },
  { path: '/lessons', icon: BookOpen, label: 'الدروس' },
  { path: '/teachers', icon: GraduationCap, label: 'المعلمين' },
  { path: '/students', icon: Users, label: 'الطلاب' },
  { path: '/teacher-classes', icon: School, label: 'صفوف المعلمين' },
  { path: '/assignments', icon: ClipboardList, label: 'الواجبات' },
  { path: '/assignment-blocks', icon: Blocks, label: 'كتل الواجبات' },
  { path: '/questions', icon: HelpCircle, label: 'الأسئلة' },
  { path: '/certificates', icon: Award, label: 'الشهادات' },
  { path: '/plans', icon: CreditCard, label: 'الخطط' },
  { path: '/student-subscribes', icon: UserPlus, label: 'اشتراكات الطلاب' },
  { path: '/student-transactions', icon: Receipt, label: 'معاملات الطلاب' },
  { path: '/answer-reviews', icon: FileCheck, label: 'مراجعة الإجابات' },
  { path: '/files', icon: FolderOpen, label: 'الملفات' },
  { path: '/upload', icon: Upload, label: 'رفع الملفات' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { logout, user } = useAuth();

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Mobile Close Button */}
      <button
        onClick={onClose}
        className="sidebar-close-btn"
        aria-label="إغلاق القائمة"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Logo */}
      <div className="sidebar-logo">
        <h1 className="gradient-text sidebar-title">
          تعلم العربية
        </h1>
        <p className="sidebar-subtitle">لوحة الإدارة</p>
      </div>

      {/* User Info */}
      <div className="sidebar-user">
        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar">
            {user?.firstName?.charAt(0) || 'م'}
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="sidebar-user-email truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <item.icon className="sidebar-item-icon" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="sidebar-footer">
        <button
          onClick={() => {
            logout();
            onClose();
          }}
          className="sidebar-item sidebar-logout"
        >
          <LogOut className="sidebar-item-icon" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
