import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { API_ENDPOINTS } from '../config/api';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

interface Country {
  id: number;
  name: string;
}

export default function Countries() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
  });

  const fetchCountries = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.countries);
      setCountries(response.data.data || response.data || []);
    } catch {
      toast.error('فشل في جلب بيانات الدول');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  const handleOpenModal = (country?: Country) => {
    if (country) {
      setSelectedCountry(country);
      setFormData({ name: country.name });
    } else {
      setSelectedCountry(null);
      setFormData({ name: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = { name: formData.name };

      if (selectedCountry) {
        await api.patch(`${API_ENDPOINTS.countries}/${selectedCountry.id}`, payload);
        toast.success('تم تحديث الدولة بنجاح');
      } else {
        await api.post(API_ENDPOINTS.countries, payload);
        toast.success('تم إضافة الدولة بنجاح');
      }

      setIsModalOpen(false);
      fetchCountries();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ ما');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCountry) return;
    setIsSubmitting(true);

    try {
      await api.delete(`${API_ENDPOINTS.countries}/${selectedCountry.id}`);
      toast.success('تم حذف الدولة بنجاح');
      setIsDeleteDialogOpen(false);
      fetchCountries();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل في حذف الدولة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { key: 'id', header: '#' },
    { key: 'name', header: 'اسم الدولة' },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (country: Country) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(country)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedCountry(country);
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
        title="الدول"
        description="إدارة دول النظام"
        action={
          <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة دولة
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={countries}
        isLoading={isLoading}
        keyExtractor={(country) => country.id}
        emptyMessage="لا توجد دول"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCountry ? 'تعديل الدولة' : 'إضافة دولة جديدة'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-600 text-sm mb-2">اسم الدولة</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
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

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="حذف الدولة"
        message={`هل أنت متأكد من حذف الدولة "${selectedCountry?.name}"؟`}
        confirmText="حذف"
        isLoading={isSubmitting}
      />
    </div>
  );
}
