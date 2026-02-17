import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Mail, Calendar, Search, UserCheck, UserX, X, Phone, MapPin, GraduationCap, BookOpen, Wallet, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

interface Student {
  id: number;
  userId?: number;
  birthdate?: string;
  gender?: string;
  address?: string;
  mobile?: string;
  avatarUrl?: string;
  balance?: string;
  // قد تأتي البيانات مباشرة أو داخل user
  firstName?: string;
  lastName?: string;
  email?: string;
  isEmailConfirmed?: boolean;
  createdAt?: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    isEmailConfirmed?: boolean;
    createdAt: string;
  };
}

// دالة مساعدة للحصول على بيانات الطالب
const getStudentData = (student: Student) => ({
  firstName: student.user?.firstName || student.firstName || '',
  lastName: student.user?.lastName || student.lastName || '',
  email: student.user?.email || student.email || '',
  isEmailConfirmed: student.user?.isEmailConfirmed ?? student.isEmailConfirmed,
  createdAt: student.user?.createdAt || student.createdAt || '',
});

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    birthdate: '',
    gender: '',
    address: '',
    mobile: '',
    avatarUrl: '',
  });

  const fetchStudents = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.students);
      const data = response.data.data || response.data || [];
      setStudents(data);
      setFilteredStudents(data);
    } catch {
      toast.error('فشل في جلب البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // تصفية الطلاب حسب البحث
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = students.filter(student => {
      const data = getStudentData(student);
      const fullName = `${data.firstName} ${data.lastName}`.toLowerCase();
      const email = data.email.toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });
    setFilteredStudents(filtered);
  }, [searchQuery, students]);

  const uploadImage = async (file: File): Promise<string | null> => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('حجم الصورة يجب أن يكون أقل من 5MB');
      return null;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('يجب أن تكون الصورة من نوع JPG, PNG, GIF أو WebP');
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(API_ENDPOINTS.upload.image, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(percent);
        },
      });

      const imageUrl = response.data.path || response.data.url || response.data;
      toast.success('تم رفع الصورة بنجاح');
      return imageUrl;
    } catch {
      toast.error('فشل في رفع الصورة');
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const url = await uploadImage(file);
      if (url) {
        setFormData(prev => ({ ...prev, avatarUrl: url }));
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadImage(file);
      if (url) {
        setFormData(prev => ({ ...prev, avatarUrl: url }));
      }
    }
  };

  const handleOpenModal = (student?: Student) => {
    if (student) {
      setSelectedStudent(student);
      const data = getStudentData(student);
      setFormData({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: '',
        birthdate: student.birthdate ? student.birthdate.split('T')[0] : '',
        gender: student.gender || '',
        address: student.address || '',
        mobile: student.mobile || '',
        avatarUrl: student.avatarUrl || '',
      });
    } else {
      setSelectedStudent(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        birthdate: '',
        gender: '',
        address: '',
        mobile: '',
        avatarUrl: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const params = new URLSearchParams();
      params.append('firstName', formData.firstName);
      params.append('lastName', formData.lastName);
      params.append('email', formData.email);
      if (formData.password) {
        params.append('password', formData.password);
      }
      if (formData.birthdate) {
        params.append('birthdate', formData.birthdate);
      }
      if (formData.gender) {
        params.append('gender', formData.gender);
      }
      if (formData.address) {
        params.append('address', formData.address);
      }
      if (formData.mobile) {
        params.append('mobile', formData.mobile);
      }
      if (formData.avatarUrl) {
        params.append('avatarUrl', formData.avatarUrl);
      }

      if (selectedStudent) {
        // تحديث طالب موجود
        await api.patch(`${API_ENDPOINTS.students}/${selectedStudent.id}`, params);
        toast.success('تم تحديث الطالب بنجاح');
      } else {
        // إنشاء طالب جديد
        await api.post(API_ENDPOINTS.students, params);
        toast.success('تم إضافة الطالب بنجاح');
      }

      setIsModalOpen(false);
      fetchStudents();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStudent) return;
    setIsSubmitting(true);

    try {
      await api.delete(`${API_ENDPOINTS.students}/${selectedStudent.id}`);
      toast.success('تم حذف الطالب بنجاح');
      setIsDeleteDialogOpen(false);
      fetchStudents();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'فشل في حذف الطالب');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvatarUrl = (avatarUrl?: string) => {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('http')) return avatarUrl;
    return `${API_BASE_URL}/${avatarUrl}`;
  };

  const columns = [
    { key: 'id', header: '#' },
    {
      key: 'name',
      header: 'الاسم',
      render: (student: Student) => {
        const data = getStudentData(student);
        return (
          <div className="flex items-center gap-3">
            {student.avatarUrl ? (
              <img
                src={getAvatarUrl(student.avatarUrl) || ''}
                alt={data.firstName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-slate-900 font-bold">
                {data.firstName?.charAt(0) || '?'}
              </div>
            )}
            <div>
              <span className="font-medium">{data.firstName} {data.lastName}</span>
              {student.gender && (
                <span className="block text-xs text-slate-500">
                  {student.gender === 'male' ? 'ذكر' : 'أنثى'}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'email',
      header: 'البريد الإلكتروني',
      render: (student: Student) => {
        const data = getStudentData(student);
        return (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-500" />
            <span dir="ltr" className="text-sm">{data.email}</span>
          </div>
        );
      },
    },
    {
      key: 'balance',
      header: 'الرصيد',
      render: (student: Student) => (
        <span className="px-2.5 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
          {student.balance || '0'} $
        </span>
      ),
    },
    {
      key: 'status',
      header: 'حالة الحساب',
      render: (student: Student) => {
        const data = getStudentData(student);
        return (
          <div className="flex items-center gap-2">
            {data.isEmailConfirmed ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
                <UserCheck className="w-3.5 h-3.5" />
                مفعّل
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400">
                <UserX className="w-3.5 h-3.5" />
                غير مفعّل
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'تاريخ التسجيل',
      render: (student: Student) => {
        const data = getStudentData(student);
        return (
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <Calendar className="w-4 h-4" />
            <span>
              {data.createdAt ? new Date(data.createdAt).toLocaleDateString('ar-SYRIA-SYRIAN-ARABIC') : '-'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'management',
      header: 'إدارة',
      render: (student: Student) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/students/${student.id}/levels`)}
            className="p-2 cursor-pointer rounded-lg text-slate-600 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
            title="المستويات"
          >
            <GraduationCap className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/students/${student.id}/lessons`)}
            className="p-2 cursor-pointer rounded-lg text-slate-600 hover:text-green-400 hover:bg-green-500/10 transition-colors"
            title="الدروس"
          >
            <BookOpen className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/students/${student.id}/balance`)}
            className="p-2 cursor-pointer rounded-lg text-slate-600 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
            title="الرصيد"
          >
            <Wallet className="w-4 h-4" />
          </button>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (student: Student) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(student)}
            className="p-2 cursor-pointer rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-colors"
            title="تعديل"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedStudent(student);
              setIsDeleteDialogOpen(true);
            }}
            className="p-2 cursor-pointer rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="حذف"
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
        title="الطلاب"
        description={`إدارة حسابات الطلاب (${students.length} طالب)`}
        action={
          <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة طالب
          </button>
        }
      />

      {/* شريط البحث */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن طالب بالاسم أو البريد الإلكتروني..."
            className="input-field pr-12 w-full"
          />
        </div>
        {searchQuery && (
          <p className="text-slate-500 text-sm mt-2">
            عدد النتائج: {filteredStudents.length} من {students.length}
          </p>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredStudents}
        isLoading={isLoading}
        keyExtractor={(student) => student.id}
        emptyMessage={searchQuery ? 'لا توجد نتائج للبحث' : 'لا يوجد طلاب'}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* صورة الطالب */}
          <div>
            <label className="block text-slate-600 text-sm mb-2">صورة الطالب</label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-slate-600 hover:border-slate-500'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {isUploading ? (
                <div className="py-4">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full border-4 border-primary-500/30 border-t-primary-500 animate-spin" />
                  <p className="text-primary-400 font-medium">{uploadProgress}%</p>
                </div>
              ) : formData.avatarUrl ? (
                <div className="relative inline-block">
                  <img
                    src={getAvatarUrl(formData.avatarUrl) || ''}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover mx-auto"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData(prev => ({ ...prev, avatarUrl: '' }));
                    }}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-slate-900 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="py-4">
                  <Image className="w-12 h-12 mx-auto text-slate-500 mb-2" />
                  <p className="text-slate-600 text-sm">اسحب صورة هنا أو انقر للاختيار</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-sm mb-2">الاسم الأول *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 text-sm mb-2">الاسم الأخير *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-sm mb-2">البريد الإلكتروني *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                dir="ltr"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 text-sm mb-2">
                كلمة المرور {selectedStudent && '(اختياري)'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field"
                dir="ltr"
                minLength={8}
                placeholder={selectedStudent ? '••••••••' : ''}
                {...(!selectedStudent && { required: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-sm mb-2">تاريخ الميلاد</label>
              <input
                type="date"
                value={formData.birthdate}
                onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-slate-600 text-sm mb-2">الجنس</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="input-field"
              >
                <option value="">اختر الجنس</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 text-sm mb-2">
              <Phone className="w-4 h-4 inline ml-1" />
              رقم الهاتف
            </label>
            <input
              type="tel"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              className="input-field"
              dir="ltr"
              placeholder="+201234567890"
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm mb-2">
              <MapPin className="w-4 h-4 inline ml-1" />
              العنوان
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input-field"
              placeholder="المدينة، الدولة"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1" disabled={isSubmitting || isUploading}>
              {isSubmitting ? 'جاري الحفظ...' : selectedStudent ? 'تحديث' : 'إضافة'}
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
        title="حذف الطالب"
        message={selectedStudent ? `هل أنت متأكد من حذف الطالب "${getStudentData(selectedStudent).firstName} ${getStudentData(selectedStudent).lastName}"؟ سيتم حذف جميع بياناته.` : ''}
        confirmText="حذف"
        isLoading={isSubmitting}
      />
    </div>
  );
}
