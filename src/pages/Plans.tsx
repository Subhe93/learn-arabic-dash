import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { API_ENDPOINTS } from '../config/api';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

interface Plan {
  id: number;
  name: string;
  description?: string;
  price: number;
  type: 'yearly' | 'monthly';
  teacherFollowUp?: boolean;
  sortOrder?: number;
  active: boolean;
  createdAt: string;
}

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    type: 'monthly' as 'yearly' | 'monthly',
    teacherFollowUp: false,
    sortOrder: 1,
    active: true,
  });

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(API_ENDPOINTS.plans);
      setPlans(response.data.data || response.data || []);
    } catch {
      toast.error('فشل في جلب الخطط');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenModal = (plan?: Plan) => {
    if (plan) {
      setSelectedPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || '',
        price: plan.price,
        type: plan.type || 'monthly',
        teacherFollowUp: plan.teacherFollowUp || false,
        sortOrder: plan.sortOrder || 1,
        active: plan.active,
      });
    } else {
      setSelectedPlan(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        type: 'monthly' as 'yearly' | 'monthly',
        teacherFollowUp: false,
        sortOrder: 1,
        active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        price: formData.price,
        teacherFollowUp: formData.teacherFollowUp,
        sortOrder: formData.sortOrder,
        active: formData.active,
      };

      if (selectedPlan) {
        await api.patch(`${API_ENDPOINTS.plans}/${selectedPlan.id}`, payload, {
          headers: { 'Content-Type': 'application/json' },
        });
        toast.success('تم تحديث الخطة بنجاح');
      } else {
        await api.post(API_ENDPOINTS.plans, payload, {
          headers: { 'Content-Type': 'application/json' },
        });
        toast.success('تم إضافة الخطة بنجاح');
      }

      setIsModalOpen(false);
      fetchPlans();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPlan) return;
    setIsSubmitting(true);

    try {
      await api.delete(`${API_ENDPOINTS.plans}/${selectedPlan.id}`);
      toast.success('تم حذف الخطة بنجاح');
      setIsDeleteDialogOpen(false);
      fetchPlans();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'فشل في حذف الخطة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { key: 'id', header: '#' },
    { key: 'name', header: 'اسم الخطة' },
    {
      key: 'description',
      header: 'الوصف',
      render: (plan: Plan) => (
        <span className="text-slate-600 line-clamp-1 max-w-xs">
          {plan.description || '-'}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'السعر',
      render: (plan: Plan) => (
        <span className="text-emerald-400 font-semibold">
          {plan.price.toLocaleString()} ر.س
        </span>
      ),
    },
    {
      key: 'type',
      header: 'النوع',
      render: (plan: Plan) => (
        <span className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
          {plan.type === 'yearly' ? 'سنوي' : 'شهري'}
        </span>
      ),
    },
    {
      key: 'teacherFollowUp',
      header: 'متابعة المعلم',
      render: (plan: Plan) => (
        <span
          className={`px-3 py-1 rounded-full text-xs ${
            plan.teacherFollowUp
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {plan.teacherFollowUp ? 'نعم' : 'لا'}
        </span>
      ),
    },
    {
      key: 'sortOrder',
      header: 'الترتيب',
      render: (plan: Plan) => (
        <span className="px-3 py-1 rounded-full text-xs bg-slate-100 text-slate-600">
          {plan.sortOrder || 1}
        </span>
      ),
    },
    {
      key: 'active',
      header: 'الحالة',
      render: (plan: Plan) => (
        <span
          className={`px-3 py-1 rounded-full text-xs ${
            plan.active
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {plan.active ? 'نشط' : 'غير نشط'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (plan: Plan) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(plan)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedPlan(plan);
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
        title="الخطط"
        description="إدارة خطط الاشتراك"
        action={
          <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة خطة
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={plans}
        isLoading={isLoading}
        keyExtractor={(plan) => plan.id}
        emptyMessage="لا توجد خطط"
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedPlan ? 'تعديل الخطة' : 'إضافة خطة جديدة'}
        size="lg"
        showFullscreen={true}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-600 text-sm mb-2">اسم الخطة</label>
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
              className="input-field min-h-[100px] resize-none"
              placeholder="اكتب وصف الخطة هنا..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-sm mb-2">السعر (ر.س)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="input-field"
                min={0}
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 text-sm mb-2">نوع الخطة</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'yearly' | 'monthly' })}
                className="input-field"
                required
              >
                <option value="monthly">شهري</option>
                <option value="yearly">سنوي</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="teacherFollowUp"
              checked={formData.teacherFollowUp}
              onChange={(e) => setFormData({ ...formData, teacherFollowUp: e.target.checked })}
              className="w-5 h-5 rounded border-slate-600 bg-white border border-slate-200 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
            />
            <label htmlFor="teacherFollowUp" className="text-slate-600 cursor-pointer">
              متابعة المعلم
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-5 h-5 rounded border-slate-600 bg-white border border-slate-200 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
            />
            <label htmlFor="active" className="text-slate-600 cursor-pointer">
              الخطة نشطة
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : selectedPlan ? 'تحديث' : 'إضافة'}
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
        title="حذف الخطة"
        message={`هل أنت متأكد من حذف الخطة "${selectedPlan?.name}"؟`}
        confirmText="حذف"
        isLoading={isSubmitting}
      />
    </div>
  );
}

