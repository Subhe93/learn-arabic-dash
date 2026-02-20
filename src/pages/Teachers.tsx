import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { API_ENDPOINTS } from '../config/api';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import SearchableSelect from '../components/ui/SearchableSelect';

interface Country {
  id: number;
  name: string;
}

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  countryId: number;
  Country: {
    name: string;
  };
  createdAt: string;
}

export default function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    countryId: null as number | null,
  });

  const fetchTeachers = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.teachers);
      setTeachers(response.data.data || response.data || []);
    } catch (error) {
      toast.error('فشل في جلب بيانات المعلمين');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.countries);
      setCountries(response.data.data || response.data || []);
    } catch (error) {
      toast.error('فشل في جلب بيانات الدول');
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchCountries();
  }, []);

  const handleOpenModal = (teacher?: Teacher) => {
    if (teacher) {
      setSelectedTeacher(teacher);
      setFormData({
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        password: '',
        countryId: teacher.countryId,
      });
    } else {
      setSelectedTeacher(null);
      setFormData({ firstName: '', lastName: '', email: '', password: '', countryId: null });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.countryId) {
      toast.error('يرجى اختيار الدولة');
      return;
    }
    setIsSubmitting(true);

    try {
      const params = new URLSearchParams();
      params.append('firstName', formData.firstName);
      params.append('lastName', formData.lastName);
      params.append('email', formData.email);
      params.append('countryId', formData.countryId.toString());
      if (formData.password) {
        params.append('password', formData.password);
      }

      if (selectedTeacher) {
        await api.patch(`${API_ENDPOINTS.teachers}/${selectedTeacher.id}`, params);
        toast.success('تم تحديث المعلم بنجاح');
      } else {
        await api.post(API_ENDPOINTS.teachers, params);
        toast.success('تم إضافة المعلم بنجاح');
      }

      setIsModalOpen(false);
      fetchTeachers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTeacher) return;
    setIsSubmitting(true);

    try {
      await api.delete(`${API_ENDPOINTS.teachers}/${selectedTeacher.id}`);
      toast.success('تم حذف المعلم بنجاح');
      setIsDeleteDialogOpen(false);
      fetchTeachers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل في حذف المعلم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { key: 'id', header: '#' },
    {
      key: 'name',
      header: 'الاسم',
      render: (teacher: Teacher) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-slate-900 font-bold">
            {teacher.firstName?.charAt(0)}
          </div>
          <span>{teacher.firstName} {teacher.lastName}</span>
        </div>
      ),
    },
    { key: 'email', header: 'البريد الإلكتروني' },
    // { 
    //   key: 'country', 
    //   header: 'الدولة',
    //   render: (teacher: Teacher) => (
    //     <div className="flex items-center gap-2">
    //       <Globe className="w-4 h-4 text-slate-500" />
    //       <span>{teacher.country?.name || '-'}</span>
    //     </div>
    //   ),
    // },
    {
      key: 'createdAt',
      header: 'تاريخ الإنشاء',
      render: (teacher: Teacher) => (
        <span className="text-slate-600">
          {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString('ar-SY') : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (teacher: Teacher) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(teacher)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedTeacher(teacher);
              setIsDeleteDialogOpen(true);
            }}
            className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
        title="المعلمين"
        description="إدارة حسابات المعلمين"
        action={
          <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة معلم
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={teachers}
        isLoading={isLoading}
        keyExtractor={(teacher) => teacher.id}
        emptyMessage="لا يوجد معلمين"
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedTeacher ? 'تعديل المعلم' : 'إضافة معلم جديد'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-sm mb-2">الاسم الأول</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 text-sm mb-2">الاسم الأخير</label>
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
            <div className="col-span-2">
              <label className="block text-slate-600 text-sm mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                dir="ltr"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 text-sm mb-2">الدولة</label>
            <SearchableSelect
              options={countries}
              value={formData.countryId}
              onChange={(value) => setFormData({ ...formData, countryId: value as number })}
              placeholder="ابحث عن دولة..."
              icon={Globe}
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm mb-2">
              كلمة المرور {selectedTeacher && '(اتركها فارغة للإبقاء على الحالية)'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input-field"
              dir="ltr"
              {...(!selectedTeacher && { required: true })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : selectedTeacher ? 'تحديث' : 'إضافة'}
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
        title="حذف المعلم"
        message={`هل أنت متأكد من حذف المعلم "${selectedTeacher?.firstName} ${selectedTeacher?.lastName}"؟`}
        confirmText="حذف"
        isLoading={isSubmitting}
      />
    </div>
  );
}

