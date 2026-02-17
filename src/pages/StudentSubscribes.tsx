import { useState, useEffect } from 'react';
import { Plus, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { API_ENDPOINTS } from '../config/api';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

interface StudentSubscribe {
  id: number;
  studentId: number;
  planId: number;
  paymentTransactionId?: number | null;
  amount?: string;
  duration?: number;
  status?: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  subscriptionStatus?: 'active' | 'expired';
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
  student?: {
    id: number;
    userId: number;
    user?: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  plan?: {
    id: number;
    name: string;
    type: 'yearly' | 'monthly';
    price: number;
  };
}

interface Student {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Plan {
  id: number;
  name: string;
  type: 'yearly' | 'monthly';
  price: number;
}

// دالة مساعدة للحصول على اسم الطالب
const getStudentName = (student: Student) => {
  const firstName = student.user?.firstName || student.firstName || '';
  const lastName = student.user?.lastName || student.lastName || '';
  return `${firstName} ${lastName}`.trim() || 'غير محدد';
};

// Searchable Select للطلاب
function StudentSearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'اختر طالب...',
}: {
  options: Student[];
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = options.filter((student) => {
    const name = getStudentName(student).toLowerCase();
    const email = (student.user?.email || student.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  const selectedStudent = options.find((s) => s.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input-field w-full text-right flex items-center justify-between"
      >
        <span className={value ? 'text-slate-700' : 'text-slate-500'}>
          {selectedStudent ? getStudentName(selectedStudent) : placeholder}
        </span>
        <X className={`w-4 h-4 text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن طالب..."
                className="input-field pr-9 text-sm"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-slate-600 text-sm">لا توجد نتائج</div>
            ) : (
              filteredOptions.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => {
                    onChange(student.id);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className={`w-full text-right p-3 hover:bg-slate-100 transition-colors ${
                    value === student.id ? 'bg-slate-100' : ''
                  }`}
                >
                  <div className="text-slate-700">{getStudentName(student)}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    {student.user?.email || student.email}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// Searchable Select للخطط
function PlanSearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'اختر خطة...',
}: {
  options: Plan[];
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = options.filter((plan) => {
    const name = plan.name.toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query);
  });

  const selectedPlan = options.find((p) => p.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input-field w-full text-right flex items-center justify-between"
      >
        <span className={value ? 'text-slate-700' : 'text-slate-500'}>
          {selectedPlan ? `${selectedPlan.name} (${selectedPlan.type === 'yearly' ? 'سنوي' : 'شهري'})` : placeholder}
        </span>
        <X className={`w-4 h-4 text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن خطة..."
                className="input-field pr-9 text-sm"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-slate-600 text-sm">لا توجد نتائج</div>
            ) : (
              filteredOptions.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => {
                    onChange(plan.id);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className={`w-full text-right p-3 hover:bg-slate-100 transition-colors ${
                    value === plan.id ? 'bg-slate-100' : ''
                  }`}
                >
                  <div className="text-slate-700">{plan.name}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    {plan.type === 'yearly' ? 'سنوي' : 'شهري'} - {plan.price.toLocaleString()} ر.س
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default function StudentSubscribes() {
  const [subscribes, setSubscribes] = useState<StudentSubscribe[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubscribe, setSelectedSubscribe] = useState<StudentSubscribe | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState<string>('');
  const [studentIdFilter, setStudentIdFilter] = useState<number | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [formData, setFormData] = useState({
    studentId: 0,
    planId: 0,
  });

  const fetchStudents = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.students);
      const data = response.data.data || response.data || [];
      setStudents(data);
    } catch {
      toast.error('فشل في جلب الطلاب');
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.plans);
      const data = response.data.data || response.data || [];
      setPlans(data);
    } catch {
      toast.error('فشل في جلب الخطط');
    }
  };

  const fetchSubscribes = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (subscriptionStatusFilter) params.append('subscriptionStatus', subscriptionStatusFilter);
      if (studentIdFilter) params.append('studentId', studentIdFilter.toString());
      params.append('page', currentPage.toString());
      params.append('limit', limit.toString());

      const response = await api.get(`${API_ENDPOINTS.studentSubscribes}?${params.toString()}`);
      
      // معالجة الاستجابة حسب البنية الصحيحة
      if (response.data.data && Array.isArray(response.data.data)) {
          setSubscribes(response.data.data);
        if (response.data.meta) {
          setTotalItems(response.data.meta.total || 0);
          setTotalPages(response.data.meta.totalPages || 1);
        } else {
          setTotalItems(response.data.data.length);
          setTotalPages(1);
        }
      } else if (Array.isArray(response.data)) {
        setSubscribes(response.data);
        setTotalItems(response.data.length);
        setTotalPages(1);
      } else {
        setSubscribes([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch {
      toast.error('فشل في جلب الاشتراكات');
      setSubscribes([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchPlans();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // إعادة تعيين الصفحة عند تغيير الفلاتر
  }, [statusFilter, subscriptionStatusFilter, studentIdFilter, limit]);

  useEffect(() => {
    fetchSubscribes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, subscriptionStatusFilter, studentIdFilter, limit]);

  const handleOpenModal = () => {
    setSelectedSubscribe(null);
    setFormData({
      studentId: 0,
      planId: 0,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = new URLSearchParams();
      payload.append('studentId', formData.studentId.toString());
      payload.append('planId', formData.planId.toString());

      await api.post(API_ENDPOINTS.studentSubscribes, payload, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      toast.success('تم إضافة الاشتراك بنجاح');
      setIsModalOpen(false);
      fetchSubscribes();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSubscribe) return;
    setIsSubmitting(true);

    try {
      await api.delete(`${API_ENDPOINTS.studentSubscribes}/${selectedSubscribe.id}`);
      toast.success('تم حذف الاشتراك بنجاح');
      setIsDeleteDialogOpen(false);
      fetchSubscribes();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'فشل في حذف الاشتراك');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { key: 'id', header: '#' },
    {
      key: 'studentName',
      header: 'الطالب',
      render: (subscribe: StudentSubscribe) => {
        if (subscribe.student?.user) {
          return <span className="text-slate-700">{`${subscribe.student.user.firstName} ${subscribe.student.user.lastName}`.trim()}</span>;
        }
        const student = students.find((s) => s.id === subscribe.studentId);
        return <span className="text-slate-700">{student ? getStudentName(student) : '-'}</span>;
      },
    },
    {
      key: 'planName',
      header: 'الخطة',
      render: (subscribe: StudentSubscribe) => {
        if (subscribe.plan) {
          return <span className="text-slate-700">{subscribe.plan.name}</span>;
        }
        const plan = plans.find((p) => p.id === subscribe.planId);
        return <span className="text-slate-700">{plan ? plan.name : '-'}</span>;
      },
    },
    {
      key: 'status',
      header: 'حالة الدفع',
      render: (subscribe: StudentSubscribe) => {
        const statusMap: Record<string, { label: string; className: string }> = {
          PENDING: { label: 'قيد الانتظار', className: 'bg-yellow-500/20 text-yellow-400' },
          PAID: { label: 'مدفوع', className: 'bg-emerald-500/20 text-emerald-400' },
          FAILED: { label: 'فشل', className: 'bg-red-500/20 text-red-400' },
          CANCELLED: { label: 'ملغي', className: 'bg-slate-100 text-slate-600' },
        };
        const status = statusMap[subscribe.status || 'PENDING'] || statusMap.PENDING;
        return (
          <span className={`px-3 py-1 rounded-full text-xs ${status.className}`}>
            {status.label}
          </span>
        );
      },
    },
    {
      key: 'subscriptionStatus',
      header: 'حالة الاشتراك',
      render: (subscribe: StudentSubscribe) => {
        const isActive = subscribe.subscriptionStatus === 'active';
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs ${
              isActive
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isActive ? 'نشط' : 'منتهي'}
          </span>
        );
      },
    },
    {
      key: 'startDate',
      header: 'تاريخ البدء',
      render: (subscribe: StudentSubscribe) => (
        <span className="text-slate-600 text-sm">
          {subscribe.startDate ? new Date(subscribe.startDate).toLocaleDateString('ar-SYRIA-SYRIAN-ARABIC') : '-'}
        </span>
      ),
    },
    {
      key: 'endDate',
      header: 'تاريخ الانتهاء',
      render: (subscribe: StudentSubscribe) => (
        <span className="text-slate-600 text-sm">
          {subscribe.endDate ? new Date(subscribe.endDate).toLocaleDateString('ar-SYRIA-SYRIAN-ARABIC') : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (subscribe: StudentSubscribe) => (
        <button
          onClick={() => {
            setSelectedSubscribe(subscribe);
            setIsDeleteDialogOpen(true);
          }}
          className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="اشتراكات الطلاب"
        description="إدارة اشتراكات الطلاب في الخطط"
        action={
          <button onClick={handleOpenModal} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة اشتراك
          </button>
        }
      />

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div>
          <label className="block text-slate-600 text-sm mb-2">حالة الدفع</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="">الكل</option>
            <option value="PENDING">قيد الانتظار</option>
            <option value="PAID">مدفوع</option>
            <option value="FAILED">فشل</option>
            <option value="CANCELLED">ملغي</option>
          </select>
        </div>
        <div>
          <label className="block text-slate-600 text-sm mb-2">حالة الاشتراك</label>
          <select
            value={subscriptionStatusFilter}
            onChange={(e) => setSubscriptionStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="">الكل</option>
            <option value="active">نشط</option>
            <option value="expired">منتهي</option>
          </select>
        </div>
        <div>
          <label className="block text-slate-600 text-sm mb-2">الطالب</label>
          <StudentSearchableSelect
            options={students}
            value={studentIdFilter || 0}
            onChange={(value) => setStudentIdFilter(value || null)}
            placeholder="اختر طالب..."
          />
        </div>
        <div>
          <label className="block text-slate-600 text-sm mb-2">الصفحة</label>
          <input
            type="number"
            value={currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value) || 1;
              setCurrentPage(Math.max(1, Math.min(page, totalPages || 1)));
            }}
            className="input-field"
            min={1}
            max={totalPages || 1}
          />
        </div>
        <div>
          <label className="block text-slate-600 text-sm mb-2">عدد العناصر</label>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value));
              setCurrentPage(1);
            }}
            className="input-field"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={subscribes}
        isLoading={isLoading}
        keyExtractor={(subscribe) => subscribe.id}
        emptyMessage="لا توجد اشتراكات"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-slate-600 text-sm">
            عرض {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, totalItems)} من {totalItems} اشتراك
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      currentPage === pageNum
                        ? 'bg-emerald-500 text-slate-900'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="إضافة اشتراك جديد"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-600 text-sm mb-2">الطالب</label>
            <StudentSearchableSelect
              options={students}
              value={formData.studentId}
              onChange={(value) => setFormData({ ...formData, studentId: value })}
              placeholder="اختر طالب..."
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm mb-2">الخطة</label>
            <PlanSearchableSelect
              options={plans}
              value={formData.planId}
              onChange={(value) => setFormData({ ...formData, planId: value })}
              placeholder="اختر خطة..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : 'إضافة'}
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
        title="حذف الاشتراك"
        message="هل أنت متأكد من حذف هذا الاشتراك؟"
        confirmText="حذف"
        isLoading={isSubmitting}
      />
    </div>
  );
}

