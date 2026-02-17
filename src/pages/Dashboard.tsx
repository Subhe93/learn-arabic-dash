import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  ClipboardList,
  TrendingUp,
  Activity,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import api from '../lib/axios';
import { API_ENDPOINTS } from '../config/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [levelsCount, setLevelsCount] = useState<number>(0);
  const [lessonsCount, setLessonsCount] = useState<number>(0);
  const [teachersCount, setTeachersCount] = useState<number>(0);
  const [assignmentsCount, setAssignmentsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const stats = [
    {
      label: 'المستويات',
      value: isLoading ? '...' : levelsCount.toString(),
      icon: Layers,
      iconColor: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.2)',
    },
    {
      label: 'الدروس',
      value: isLoading ? '...' : lessonsCount.toString(),
      icon: BookOpen,
      iconColor: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.2)',
    },
    {
      label: 'المعلمين',
      value: isLoading ? '...' : teachersCount.toString(),
      icon: GraduationCap,
      iconColor: '#a855f7',
      bgColor: 'rgba(168, 85, 247, 0.2)',
    },
    {
      label: 'الواجبات',
      value: isLoading ? '...' : assignmentsCount.toString(),
      icon: ClipboardList,
      iconColor: '#f97316',
      bgColor: 'rgba(249, 115, 22, 0.2)',
    },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // جلب عدد المستويات
        try {
          const levelsRes = await api.get(API_ENDPOINTS.levels);
          const levelsData = levelsRes.data.data || levelsRes.data || [];
          setLevelsCount(Array.isArray(levelsData) ? levelsData.length : 0);
        } catch {
          setLevelsCount(0);
        }

        // جلب عدد الدروس (نحتاج لجلب جميع المستويات أولاً ثم الدروس لكل مستوى)
        try {
          const levelsRes = await api.get(API_ENDPOINTS.levels);
          const levelsData = levelsRes.data.data || levelsRes.data || [];
          let totalLessons = 0;
          
          if (Array.isArray(levelsData)) {
            for (const level of levelsData) {
              try {
                const lessonsRes = await api.get(API_ENDPOINTS.lessonsForLevel(level.id));
                const lessonsData = lessonsRes.data.data || lessonsRes.data || [];
                totalLessons += Array.isArray(lessonsData) ? lessonsData.length : 0;
              } catch {
                // تجاهل الأخطاء للمستويات الفارغة
              }
            }
          }
          setLessonsCount(totalLessons);
        } catch {
          setLessonsCount(0);
        }

        // جلب عدد المعلمين
        try {
          const teachersRes = await api.get(API_ENDPOINTS.teachers);
          const teachersData = teachersRes.data.data || teachersRes.data || [];
          setTeachersCount(Array.isArray(teachersData) ? teachersData.length : 0);
        } catch {
          setTeachersCount(0);
        }

        // جلب عدد الواجبات
        try {
          const assignmentsRes = await api.get(API_ENDPOINTS.assignments);
          const assignmentsData = assignmentsRes.data.data || assignmentsRes.data || [];
          setAssignmentsCount(Array.isArray(assignmentsData) ? assignmentsData.length : 0);
        } catch {
          setAssignmentsCount(0);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <PageHeader
        title="لوحة التحكم"
        description="مرحباً بك في لوحة تحكم تعلم العربية"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" style={{ gap: '28px', marginBottom: '40px' }}>
        {stats.map((stat) => (
          <div key={stat.label} className="card group hover:scale-105" style={{ cursor: 'pointer' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '8px' }}>{stat.label}</p>
                <p style={{ color: '#1e293b', fontSize: '40px', fontWeight: 700 }}>{stat.value}</p>
              </div>
              <div 
                className="rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ width: '72px', height: '72px', background: stat.bgColor }}
              >
                <stat.icon style={{ width: '36px', height: '36px', color: stat.iconColor }} />
              </div>
            </div>
            <div 
              className="flex items-center"
              style={{ gap: '10px', paddingTop: '16px', borderTop: '1px solid rgba(203, 213, 225, 0.5)' }}
            >
              <TrendingUp style={{ width: '18px', height: '18px', color: '#10b981' }} />
              <span style={{ color: '#10b981', fontSize: '14px' }}>+12%</span>
              <span style={{ color: '#64748b', fontSize: '14px' }}>من الشهر الماضي</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '28px' }}>
        <div className="card">
          <h3 className="flex items-center" style={{ gap: '14px', fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '28px' }}>
            <Activity style={{ width: '26px', height: '26px', color: '#0ea5e9' }} />
            الإجراءات السريعة
          </h3>
          <div className="grid grid-cols-2" style={{ gap: '16px' }}>
            <button 
              onClick={() => navigate('/levels')}
              className="text-right rounded-xl bg-white border border-slate-200/50 hover:bg-slate-100/50 transition-colors"
              style={{ padding: '24px' }}
            >
              <Layers style={{ width: '32px', height: '32px', color: '#3b82f6', marginBottom: '14px' }} />
              <p style={{ color: '#1e293b', fontWeight: 600, fontSize: '17px' }}>إضافة مستوى</p>
              <p style={{ color: '#64748b', marginTop: '6px', fontSize: '14px' }}>إنشاء مستوى جديد</p>
            </button>
            <button 
              onClick={() => navigate('/lessons')}
              className="text-right rounded-xl bg-white border border-slate-200/50 hover:bg-slate-100/50 transition-colors"
              style={{ padding: '24px' }}
            >
              <BookOpen style={{ width: '32px', height: '32px', color: '#10b981', marginBottom: '14px' }} />
              <p style={{ color: '#1e293b', fontWeight: 600, fontSize: '17px' }}>إضافة درس</p>
              <p style={{ color: '#64748b', marginTop: '6px', fontSize: '14px' }}>إنشاء درس جديد</p>
            </button>
            <button 
              onClick={() => navigate('/teachers')}
              className="text-right rounded-xl bg-white border border-slate-200/50 hover:bg-slate-100/50 transition-colors"
              style={{ padding: '24px' }}
            >
              <GraduationCap style={{ width: '32px', height: '32px', color: '#a855f7', marginBottom: '14px' }} />
              <p style={{ color: '#1e293b', fontWeight: 600, fontSize: '17px' }}>إضافة معلم</p>
              <p style={{ color: '#64748b', marginTop: '6px', fontSize: '14px' }}>تسجيل معلم جديد</p>
            </button>
            <button 
              onClick={() => navigate('/assignments')}
              className="text-right rounded-xl bg-white border border-slate-200/50 hover:bg-slate-100/50 transition-colors"
              style={{ padding: '24px' }}
            >
              <ClipboardList style={{ width: '32px', height: '32px', color: '#f97316', marginBottom: '14px' }} />
              <p style={{ color: '#1e293b', fontWeight: 600, fontSize: '17px' }}>إضافة واجب</p>
              <p style={{ color: '#64748b', marginTop: '6px', fontSize: '14px' }}>إنشاء واجب جديد</p>
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="flex items-center" style={{ gap: '14px', fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '28px' }}>
            <Users style={{ width: '26px', height: '26px', color: '#0ea5e9' }} />
            آخر النشاطات
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { action: 'تم إضافة درس جديد', time: 'منذ 5 دقائق', color: '#10b981' },
              { action: 'تم تحديث المستوى الأول', time: 'منذ 30 دقيقة', color: '#3b82f6' },
              { action: 'تم إضافة معلم جديد', time: 'منذ ساعة', color: '#a855f7' },
              { action: 'تم إنشاء واجب جديد', time: 'منذ ساعتين', color: '#f97316' },
            ].map((activity, index) => (
              <div 
                key={index} 
                className="flex items-center rounded-xl bg-white border border-slate-200/30"
                style={{ gap: '16px', padding: '18px 20px' }}
              >
                <div 
                  className="rounded-full"
                  style={{ width: '12px', height: '12px', background: activity.color, flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#1e293b', fontSize: '15px' }}>{activity.action}</p>
                  <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
