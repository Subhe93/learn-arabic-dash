import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowRight, Search, ChevronDown, X, User, Check, Mail, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { API_ENDPOINTS } from '../config/api';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

// واجهة المستخدم الأساسية
interface UserInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

// واجهة الطالب من API /admin/students
interface StudentRecord {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  user?: UserInfo; // قد يكون موجوداً في بعض الحالات
  birthdate?: string;
  gender?: string;
  createdAt: string;
}

// واجهة طالب الصف من API teacher-classes/:id/students
interface ClassStudent {
  id: number;
  teacherClassId: number;
  studentId: number;
  student: {
    id: number;
    userId: number;
    user: UserInfo;
  };
  createdAt: string;
}

// واجهة للقائمة المنسدلة (بيانات مبسطة)
interface StudentOption {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

// مكون القائمة المنسدلة مع البحث للطلاب
interface StudentSelectProps {
  options: StudentOption[];
  value: number;
  onChange: (value: number) => void;
  excludeIds?: number[];
  placeholder?: string;
}

function StudentSearchableSelect({ options, value, onChange, excludeIds = [], placeholder = 'اختر طالب...' }: StudentSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // الخيار المحدد حالياً
  const selectedOption = options.find(opt => opt.id === value);

  // تصفية الخيارات (استبعاد الطلاب الموجودين بالفعل + البحث)
  const filteredOptions = options.filter(student => {
    // استبعاد الطلاب الموجودين بالفعل في الصف
    if (excludeIds.includes(student.id)) return false;
    
    // البحث
    if (!searchQuery.trim()) return true;
    
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const email = student.email?.toLowerCase() || '';
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

  const handleSelect = (studentId: number) => {
    onChange(studentId);
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
          ${isOpen ? 'ring-2 ring-blue-500/50 border-blue-500' : ''}
          ${!selectedOption ? 'text-slate-500' : 'text-slate-900'}
        `}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {selectedOption ? (
            <>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
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
                placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                className="w-full bg-white border border-slate-600 rounded-lg py-2 pr-10 pl-4 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
              />
            </div>
          </div>

          {/* قائمة الخيارات */}
          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => handleSelect(student.id)}
                  className={`
                    w-full flex items-center gap-3 p-3 text-right transition-colors
                    ${student.id === value 
                      ? 'bg-blue-500/20 text-blue-600' 
                      : 'hover:bg-slate-100 text-slate-900'
                    }
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                    ${student.id === value 
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                      : 'bg-slate-100'
                    }
                  `}>
                    <span className="text-white font-medium text-sm">
                      {student.firstName?.charAt(0) || student.lastName?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="font-medium truncate text-slate-900">
                      {student.firstName && student.lastName 
                        ? `${student.firstName} ${student.lastName}` 
                        : student.firstName || student.lastName || `طالب #${student.id}`}
                    </span>
                    {student.email && student.email !== 'لا يوجد إيميل' && (
                      <div className="flex items-center gap-1 text-xs text-slate-600 mt-0.5">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate" dir="ltr">{student.email}</span>
                      </div>
                    )}
                  </div>
                  {student.id === value && (
                    <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  )}
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-slate-500">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="font-medium">لا توجد نتائج</p>
                <p className="text-xs mt-1">
                  {searchQuery ? 'جرب كلمات بحث مختلفة' : 'جميع الطلاب مضافون للصف'}
                </p>
              </div>
            )}
          </div>

          {/* عدد النتائج */}
          {filteredOptions.length > 0 && (
            <div className="p-2 border-t border-slate-200 text-center bg-white border border-slate-200/50">
              <span className="text-xs text-slate-500">
                {filteredOptions.length} طالب متاح
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TeacherClassStudents() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);
  const [allStudents, setAllStudents] = useState<StudentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ClassStudent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(0);

  // جلب طلاب الصف
  const fetchClassStudents = async () => {
    if (!classId) return;
    try {
      const response = await api.get(API_ENDPOINTS.teacherClassStudents(parseInt(classId)));
      setClassStudents(response.data.data || response.data || []);
    } catch {
      toast.error('فشل في جلب طلاب الصف');
    } finally {
      setIsLoading(false);
    }
  };

  // جلب جميع الطلاب وتحويلهم للصيغة المطلوبة
  const fetchAllStudents = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.students);
      const studentsData: StudentRecord[] = response.data.data || response.data || [];
      
      // تحويل البيانات للصيغة المبسطة مع التحقق من البيانات
      // الـ API يعيد البيانات مباشرة بدون user object
      const mappedStudents: StudentOption[] = studentsData
        .map(student => ({
          id: student.id,
          // البيانات تأتي مباشرة من الـ API أو من user object
          firstName: student.firstName || student.user?.firstName || '',
          lastName: student.lastName || student.user?.lastName || '',
          email: student.email || student.user?.email || '',
        }))
        .filter(student => student.firstName || student.lastName); // استبعاد الطلاب بدون اسم
      
      setAllStudents(mappedStudents);
    } catch (error) {
      console.error('فشل في جلب قائمة الطلاب:', error);
      toast.error('فشل في جلب قائمة الطلاب');
    }
  };

  useEffect(() => {
    fetchClassStudents();
    fetchAllStudents();
  }, [classId]);

  // معرّفات الطلاب الموجودين بالفعل في الصف
  const existingStudentIds = classStudents.map(cs => cs.studentId);

  // الحصول على بيانات الطالب من كائن ClassStudent
  const getStudentInfo = (item: ClassStudent) => {
    return {
      firstName: item.student?.user?.firstName || '',
      lastName: item.student?.user?.lastName || '',
      email: item.student?.user?.email || '',
    };
  };

  const handleOpenModal = () => {
    setSelectedStudentId(0);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !selectedStudentId) {
      toast.error('يرجى اختيار طالب');
      return;
    }
    setIsSubmitting(true);

    try {
      const params = new URLSearchParams();
      params.append('studentId', selectedStudentId.toString());

      await api.post(API_ENDPOINTS.teacherClassStudents(parseInt(classId)), params);
      toast.success('تم إضافة الطالب بنجاح');

      setIsModalOpen(false);
      setSelectedStudentId(0);
      fetchClassStudents();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStudent || !classId) return;
    setIsSubmitting(true);

    try {
      await api.delete(`${API_ENDPOINTS.teacherClassStudents(parseInt(classId))}/${selectedStudent.studentId}`);
      toast.success('تم حذف الطالب من الصف بنجاح');
      setIsDeleteDialogOpen(false);
      fetchClassStudents();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'فشل في حذف الطالب');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { key: 'id', header: '#' },
    {
      key: 'name',
      header: 'اسم الطالب',
      render: (item: ClassStudent) => {
        const info = getStudentInfo(item);
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-slate-900 font-bold">
              {info.firstName?.charAt(0) || 'ط'}
            </div>
            <span>
              {info.firstName && info.lastName 
                ? `${info.firstName} ${info.lastName}` 
                : `طالب #${item.studentId}`}
            </span>
          </div>
        );
      },
    },
    {
      key: 'email',
      header: 'البريد الإلكتروني',
      render: (item: ClassStudent) => {
        const info = getStudentInfo(item);
        return (
          <div className="flex items-center gap-2 text-slate-600">
            <Mail className="w-4 h-4" />
            <span dir="ltr">{info.email || '-'}</span>
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'تاريخ الإضافة',
      render: (item: ClassStudent) => (
        <span className="text-slate-600">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-SYRIA-SYRIAN-ARABIC') : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (item: ClassStudent) => (
        <button
          onClick={() => {
            setSelectedStudent(item);
            setIsDeleteDialogOpen(true);
          }}
          className="p-2 cursor-pointer rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="حذف من الصف"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/teacher-classes')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
          <span>العودة لصفوف المعلمين</span>
        </button>
      </div>

      <PageHeader
        title={`طلاب الصف #${classId}`}
        description={`إدارة طلاب هذا الصف • ${classStudents.length} طالب`}
        action={
          <button onClick={handleOpenModal} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة طالب
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={classStudents}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        emptyMessage="لا يوجد طلاب في هذا الصف"
      />

      {/* Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="إضافة طالب للصف"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-600 text-sm mb-2">اختر الطالب</label>
            <StudentSearchableSelect
              options={allStudents}
              value={selectedStudentId}
              onChange={setSelectedStudentId}
              excludeIds={existingStudentIds}
              placeholder="ابحث واختر طالب..."
            />
            <p className="text-slate-500 text-xs mt-2">
              {allStudents.length - existingStudentIds.length} طالب متاح للإضافة من أصل {allStudents.length}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="submit" 
              className="btn-primary flex-1" 
              disabled={isSubmitting || !selectedStudentId}
            >
              {isSubmitting ? 'جاري الإضافة...' : 'إضافة'}
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
        title="حذف الطالب من الصف"
        message={selectedStudent ? `هل أنت متأكد من حذف "${getStudentInfo(selectedStudent).firstName} ${getStudentInfo(selectedStudent).lastName}" من هذا الصف؟` : 'هل أنت متأكد من حذف هذا الطالب؟'}
        confirmText="حذف"
        isLoading={isSubmitting}
      />
    </div>
  );
}
