import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowRight, GraduationCap, Calendar, Search, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { API_ENDPOINTS } from '../config/api';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

interface Level {
  id: number;
  name: string;
  description?: string;
  image?: string;
}

interface StudentLevel {
  id: number;
  studentId: number;
  levelId: number;
  levelName?: string;
  levelDescription?: string;
  levelImage?: string;
  status: string;
  enrollDate: string;
  endDate?: string;
  completePercent?: number;
  level?: Level;
}

interface Student {
  id: number;
  firstName?: string;
  lastName?: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

const getStudentName = (student: Student | null) => {
  if (!student) return '';
  const firstName = student.user?.firstName || student.firstName || '';
  const lastName = student.user?.lastName || student.lastName || '';
  return `${firstName} ${lastName}`.trim();
};

// قائمة منسدلة قابلة للبحث للمستويات
interface LevelSelectProps {
  options: Level[];
  value: number;
  onChange: (value: number) => void;
  excludeIds?: number[];
  placeholder?: string;
}

function LevelSearchableSelect({ options, value, onChange, excludeIds = [], placeholder = 'اختر مستوى...' }: LevelSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter(opt =>
    !excludeIds.includes(opt.id) &&
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="input-field cursor-pointer flex items-center justify-between"
      >
        <span className={selectedOption ? 'text-slate-900' : 'text-slate-500'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <GraduationCap className="w-4 h-4 text-slate-600" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-hidden">
          <div className="p-2 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث..."
                className="w-full bg-slate-100 border-none rounded-lg pr-9 py-2 text-sm focus:ring-1 focus:ring-primary-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-slate-500 text-sm">لا توجد نتائج</div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`p-3 cursor-pointer hover:bg-slate-100 flex items-center gap-3 ${
                    value === opt.id ? 'bg-primary-500/20 text-primary-400' : ''
                  }`}
                >
                  <GraduationCap className="w-5 h-5 text-slate-600" />
                  <div>
                    <div className="font-medium">{opt.name}</div>
                    {opt.description && (
                      <div className="text-xs text-slate-500 line-clamp-1">{opt.description}</div>
                    )}
                  </div>
                  {value === opt.id && <CheckCircle className="w-4 h-4 mr-auto" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}

export default function StudentLevels() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [studentLevels, setStudentLevels] = useState<StudentLevel[]>([]);
  const [allLevels, setAllLevels] = useState<Level[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<StudentLevel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    levelId: 0,
    status: 'enrolled',
    enrollDate: new Date().toISOString().split('T')[0],
  });

  const fetchStudentLevels = useCallback(async () => {
    if (!studentId) return;
    try {
      const response = await api.get(API_ENDPOINTS.studentLevels(parseInt(studentId)));
      setStudentLevels(response.data.data || response.data || []);
    } catch {
      toast.error('فشل في جلب مستويات الطالب');
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  const fetchAllLevels = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.levels);
      setAllLevels(response.data.data || response.data || []);
    } catch {
      toast.error('فشل في جلب المستويات');
    }
  };

  const fetchStudent = useCallback(async () => {
    if (!studentId) return;
    try {
      const response = await api.get(`${API_ENDPOINTS.students}/${studentId}`);
      setStudent(response.data);
    } catch {
      // silent
    }
  }, [studentId]);

  useEffect(() => {
    fetchStudentLevels();
    fetchAllLevels();
    fetchStudent();
  }, [fetchStudentLevels, fetchStudent]);

  const existingLevelIds = studentLevels.map(sl => sl.levelId);

  const handleOpenModal = () => {
    setFormData({
      levelId: 0,
      status: 'enrolled',
      enrollDate: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !formData.levelId) {
      toast.error('يرجى اختيار مستوى');
      return;
    }
    setIsSubmitting(true);

    try {
      const params = new URLSearchParams();
      params.append('levelId', formData.levelId.toString());
      if (formData.status) {
        params.append('status', formData.status);
      }
      if (formData.enrollDate) {
        params.append('enrollDate', formData.enrollDate);
      }

      await api.post(API_ENDPOINTS.studentLevels(parseInt(studentId)), params);
      toast.success('تم إضافة المستوى بنجاح');
      setIsModalOpen(false);
      fetchStudentLevels();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLevel || !studentId) return;
    setIsSubmitting(true);

    try {
      await api.delete(`${API_ENDPOINTS.studentLevels(parseInt(studentId))}/${selectedLevel.levelId}`);
      toast.success('تم حذف المستوى بنجاح');
      setIsDeleteDialogOpen(false);
      fetchStudentLevels();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'فشل في الحذف');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      enrolled: { label: 'مسجل', className: 'bg-blue-500/20 text-blue-400' },
      in_progress: { label: 'قيد التقدم', className: 'bg-amber-500/20 text-amber-400' },
      completed: { label: 'مكتمل', className: 'bg-emerald-500/20 text-emerald-400' },
    };
    const s = statusMap[status] || { label: status, className: 'bg-slate-500/20 text-slate-600' };
    return <span className={`px-2.5 py-1 rounded-full text-xs ${s.className}`}>{s.label}</span>;
  };

  // دالة للحصول على اسم المستوى
  const getLevelName = (item: StudentLevel) => {
    // أولاً: تحقق من الحقول المباشرة
    if (item.levelName) return item.levelName;
    // ثانياً: تحقق من الكائن المتداخل
    if (item.level?.name) return item.level.name;
    // ثالثاً: ابحث في قائمة المستويات
    const level = allLevels.find(l => l.id === item.levelId);
    return level?.name || `مستوى #${item.levelId}`;
  };

  const columns = [
    { key: 'id', header: '#' },
    {
      key: 'level',
      header: 'المستوى',
      render: (item: StudentLevel) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <span className="font-medium block">{getLevelName(item)}</span>
            {item.completePercent !== undefined && (
              <span className="text-xs text-slate-500">اكتمال: {item.completePercent}%</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'الحالة',
      render: (item: StudentLevel) => getStatusBadge(item.status),
    },
    {
      key: 'enrollDate',
      header: 'تاريخ التسجيل',
      render: (item: StudentLevel) => (
        <div className="flex items-center gap-2 text-slate-600">
          <Calendar className="w-4 h-4" />
          <span>{item.enrollDate ? new Date(item.enrollDate).toLocaleDateString('ar-SYRIA-SYRIAN-ARABIC') : '-'}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (item: StudentLevel) => (
        <button
          onClick={() => {
            setSelectedLevel(item);
            setIsDeleteDialogOpen(true);
          }}
          className="p-2 cursor-pointer rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="حذف"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const studentName = getStudentName(student);

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={() => navigate('/students')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للطلاب
        </button>
      </div>

      <PageHeader
        title={`مستويات الطالب${studentName ? `: ${studentName}` : ''}`}
        description={`${studentLevels.length} مستوى مسجل`}
        action={
          <button onClick={handleOpenModal} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة مستوى
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={studentLevels}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        emptyMessage="لا توجد مستويات مسجلة لهذا الطالب"
      />

      {/* Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="إضافة مستوى للطالب"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-600 text-sm mb-2">المستوى *</label>
            <LevelSearchableSelect
              options={allLevels}
              value={formData.levelId}
              onChange={(value) => setFormData({ ...formData, levelId: value })}
              excludeIds={existingLevelIds}
              placeholder="اختر مستوى..."
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm mb-2">الحالة</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="input-field"
            >
              <option value="enrolled">مسجل</option>
              <option value="in_progress">قيد التقدم</option>
              <option value="completed">مكتمل</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 text-sm mb-2">تاريخ التسجيل</label>
            <input
              type="date"
              value={formData.enrollDate}
              onChange={(e) => setFormData({ ...formData, enrollDate: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الإضافة...' : 'إضافة'}
            </button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="حذف المستوى"
        message={`هل أنت متأكد من حذف المستوى "${selectedLevel ? getLevelName(selectedLevel) : ''}" من الطالب؟`}
        confirmText="حذف"
        isLoading={isSubmitting}
      />
    </div>
  );
}

