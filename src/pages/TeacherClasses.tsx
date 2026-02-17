import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Users, Calendar, FolderOpen, Search, ChevronDown, X, User, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { API_ENDPOINTS } from '../config/api';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
}

interface TeacherClass {
  id: number;
  name: string;
  description: string;
  sortOrder: number;
  userId: number;
  teacher?: Teacher;
  createdAt: string;
}

// مكون القائمة المنسدلة مع البحث
interface SearchableSelectProps {
  options: Teacher[];
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  required?: boolean;
}

function SearchableSelect({ options, value, onChange, placeholder = 'اختر...', required }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // الخيار المحدد حالياً
  const selectedOption = options.find(opt => opt.id === value);

  // تصفية الخيارات حسب البحث
  const filteredOptions = options.filter(teacher => {
    const fullName = `${teacher.firstName} ${teacher.lastName}`.toLowerCase();
    const email = teacher.email?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // التركيز على حقل البحث عند فتح القائمة
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (teacherId: number) => {
    onChange(teacherId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(0);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      {/* الزر الرئيسي */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full input-field flex items-center justify-between gap-2 text-right
          ${isOpen ? 'ring-2 ring-emerald-500/50 border-emerald-500' : ''}
          ${!selectedOption ? 'text-slate-500' : 'text-slate-900'}
        `}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {selectedOption ? (
            <>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-slate-900" />
              </div>
              <div className="flex flex-col items-start min-w-0">
                <span className="font-medium truncate">
                  {selectedOption.firstName} {selectedOption.lastName}
                </span>
                {selectedOption.email && (
                  <span className="text-xs text-slate-500 truncate">
                    {selectedOption.email}
                  </span>
                )}
              </div>
            </>
          ) : (
            <span>{placeholder}</span>
          )}
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedOption && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown className={`w-5 h-5 text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* إدخال مخفي للتحقق من الصحة */}
      {required && (
        <input
          type="text"
          value={value || ''}
          onChange={() => {}}
          required
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* القائمة المنسدلة */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* حقل البحث */}
          <div className="p-3 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن معلم..."
                className="w-full bg-white border border-slate-600 rounded-lg py-2 pr-10 pl-4 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* قائمة الخيارات */}
          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((teacher) => (
                <button
                  key={teacher.id}
                  type="button"
                  onClick={() => handleSelect(teacher.id)}
                  className={`
                    w-full flex items-center gap-3 p-3 text-right transition-colors
                    ${teacher.id === value 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'hover:bg-slate-100/50 text-slate-600'
                    }
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                    ${teacher.id === value 
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                      : 'bg-slate-100'
                    }
                  `}>
                    <User className="w-5 h-5 text-slate-900" />
                  </div>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="font-medium truncate">
                      {teacher.firstName} {teacher.lastName}
                    </span>
                    {teacher.email && (
                      <span className="text-xs text-slate-500 truncate">
                        {teacher.email}
                      </span>
                    )}
                  </div>
                  {teacher.id === value && (
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  )}
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-slate-500">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>لا توجد نتائج</p>
                <p className="text-xs mt-1">جرب كلمات بحث مختلفة</p>
              </div>
            )}
          </div>

          {/* عدد النتائج */}
          {filteredOptions.length > 0 && (
            <div className="p-2 border-t border-slate-200 text-center">
              <span className="text-xs text-slate-500">
                {filteredOptions.length} معلم
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TeacherClasses() {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<TeacherClass | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sortOrder: 1,
    userId: 0,
  });

  const fetchClasses = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.teacherClasses);
      setClasses(response.data.data || response.data || []);
    } catch {
      toast.error('فشل في جلب البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.teachers);
      setTeachers(response.data.data || response.data || []);
    } catch {
      console.error('Failed to fetch teachers');
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const handleOpenModal = (teacherClass?: TeacherClass) => {
    if (teacherClass) {
      setSelectedClass(teacherClass);
      setFormData({
        name: teacherClass.name,
        description: teacherClass.description,
        sortOrder: teacherClass.sortOrder,
        userId: teacherClass.userId,
      });
    } else {
      setSelectedClass(null);
      setFormData({ name: '', description: '', sortOrder: 1, userId: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userId) {
      toast.error('يرجى اختيار المعلم');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const params = new URLSearchParams();
      params.append('name', formData.name);
      params.append('description', formData.description);
      params.append('sortOrder', formData.sortOrder.toString());
      params.append('userId', formData.userId.toString());

      if (selectedClass) {
        await api.patch(`${API_ENDPOINTS.teacherClasses}/${selectedClass.id}`, params);
        toast.success('تم تحديث الصف بنجاح');
      } else {
        await api.post(API_ENDPOINTS.teacherClasses, params);
        toast.success('تم إضافة الصف بنجاح');
      }

      setIsModalOpen(false);
      fetchClasses();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClass) return;
    setIsSubmitting(true);

    try {
      await api.delete(`${API_ENDPOINTS.teacherClasses}/${selectedClass.id}`);
      toast.success('تم حذف الصف بنجاح');
      setIsDeleteDialogOpen(false);
      fetchClasses();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'فشل في حذف الصف');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { key: 'id', header: '#' },
    { key: 'name', header: 'اسم الصف' },
    {
      key: 'description',
      header: 'الوصف',
      render: (cls: TeacherClass) => (
        <span className="text-slate-600 line-clamp-1 max-w-xs">
          {cls.description || '-'}
        </span>
      ),
    },
    {
      key: 'teacher',
      header: 'المعلم',
      render: (cls: TeacherClass) => {
        const teacher = teachers.find((t) => t.id === cls.userId);
        return teacher ? (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-slate-900" />
            </div>
            <span>{teacher.firstName} {teacher.lastName}</span>
          </div>
        ) : '-';
      },
    },
    {
      key: 'sortOrder',
      header: 'الترتيب',
      render: (cls: TeacherClass) => (
        <span className="px-3 py-1 rounded-full text-xs bg-slate-100 text-slate-600">
          {cls.sortOrder}
        </span>
      ),
    },
    {
      key: 'manage',
      header: 'إدارة',
      render: (cls: TeacherClass) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/teacher-classes/${cls.id}/students`)}
            className="p-2 cursor-pointer rounded-lg text-slate-600 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
            title="الطلاب"
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/teacher-classes/${cls.id}/sessions`)}
            className="p-2 cursor-pointer rounded-lg text-slate-600 hover:text-green-400 hover:bg-green-500/10 transition-colors"
            title="الجلسات"
          >
            <Calendar className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/teacher-classes/${cls.id}/files`)}
            className="p-2 cursor-pointer rounded-lg text-slate-600 hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
            title="الملفات"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (cls: TeacherClass) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(cls)}
            className="p-2 cursor-pointer rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedClass(cls);
              setIsDeleteDialogOpen(true);
            }}
            className="p-2 cursor-pointer rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="صفوف المعلمين"
        description="إدارة صفوف المعلمين والطلاب"
        action={
          <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة صف
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={classes}
        isLoading={isLoading}
        keyExtractor={(cls) => cls.id}
        emptyMessage="لا توجد صفوف"
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedClass ? 'تعديل الصف' : 'إضافة صف جديد'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-600 text-sm mb-2">اسم الصف</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm mb-2">الوصف</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field min-h-[80px] resize-none"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-sm mb-2">المعلم</label>
              <SearchableSelect
                options={teachers}
                value={formData.userId}
                onChange={(value) => setFormData({ ...formData, userId: value })}
                placeholder="اختر المعلم"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 text-sm mb-2">الترتيب</label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 1 })}
                className="input-field"
                min={1}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : selectedClass ? 'تحديث' : 'إضافة'}
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
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
        title="حذف الصف"
        message={`هل أنت متأكد من حذف الصف "${selectedClass?.name}"؟`}
        confirmText="حذف"
        isLoading={isSubmitting}
      />
    </div>
  );
}
