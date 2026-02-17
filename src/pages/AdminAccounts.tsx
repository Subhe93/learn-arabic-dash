import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { API_ENDPOINTS } from '../config/api';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

interface Admin {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminAccounts() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const fetchAdmins = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.adminAccounts);
      setAdmins(response.data.data || response.data || []);
    } catch (error) {
      toast.error('فشل في جلب البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleOpenModal = (admin?: Admin) => {
    if (admin) {
      setSelectedAdmin(admin);
      setFormData({
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        password: '',
      });
    } else {
      setSelectedAdmin(null);
      setFormData({ firstName: '', lastName: '', email: '', password: '' });
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

      if (selectedAdmin) {
        await api.patch(`${API_ENDPOINTS.adminAccounts}/${selectedAdmin.id}`, params);
        toast.success('تم تحديث المشرف بنجاح');
      } else {
        await api.post(API_ENDPOINTS.adminAccounts, params);
        toast.success('تم إضافة المشرف بنجاح');
      }

      setIsModalOpen(false);
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAdmin) return;
    setIsSubmitting(true);

    try {
      await api.delete(`${API_ENDPOINTS.adminAccounts}/${selectedAdmin.id}`);
      toast.success('تم حذف المشرف بنجاح');
      setIsDeleteDialogOpen(false);
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل في حذف المشرف');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { key: 'id', header: '#' },
    {
      key: 'name',
      header: 'الاسم',
      render: (admin: Admin) => (
        <div className="flex items-center" style={{ gap: '16px' }}>
          <div 
            className="rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-slate-900 font-bold"
            style={{ width: '48px', height: '48px', fontSize: '18px' }}
          >
            {admin.firstName?.charAt(0)}
          </div>
          <span style={{ fontWeight: 500 }}>{admin.firstName} {admin.lastName}</span>
        </div>
      ),
    },
    { key: 'email', header: 'البريد الإلكتروني' },
    {
      key: 'role',
      header: 'الدور',
      render: (admin: Admin) => (
        <span className="badge" style={{ background: 'rgba(14, 165, 233, 0.2)', color: '#38bdf8' }}>
          {admin.role === 'admin' ? 'مشرف' : admin.role}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (admin: Admin) => (
        <div className="flex items-center" style={{ gap: '8px' }}>
          <button
            onClick={() => handleOpenModal(admin)}
            className="icon-btn"
          >
            <Pencil style={{ width: '20px', height: '20px' }} />
          </button>
          <button
            onClick={() => {
              setSelectedAdmin(admin);
              setIsDeleteDialogOpen(true);
            }}
            className="icon-btn danger"
          >
            <Trash2 style={{ width: '20px', height: '20px' }} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="حسابات المشرفين"
        description="إدارة حسابات المشرفين في النظام"
        action={
          <button onClick={() => handleOpenModal()} className="btn-primary">
            <Plus style={{ width: '20px', height: '20px' }} />
            إضافة مشرف
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={admins}
        isLoading={isLoading}
        keyExtractor={(admin) => admin.id}
        emptyMessage="لا يوجد مشرفين"
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedAdmin ? 'تعديل المشرف' : 'إضافة مشرف جديد'}
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2" style={{ gap: '20px', marginBottom: '20px' }}>
            <div>
              <label className="form-label">الاسم الأول</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="form-label">الاسم الأخير</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="input-field"
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label className="form-label">البريد الإلكتروني</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-field"
              dir="ltr"
              required
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label className="form-label">
              كلمة المرور {selectedAdmin && '(اتركها فارغة للإبقاء على الحالية)'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input-field"
              dir="ltr"
              {...(!selectedAdmin && { required: true })}
            />
          </div>

          <div className="flex" style={{ gap: '16px' }}>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : selectedAdmin ? 'تحديث' : 'إضافة'}
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
        title="حذف المشرف"
        message={`هل أنت متأكد من حذف المشرف "${selectedAdmin?.firstName} ${selectedAdmin?.lastName}"؟`}
        confirmText="حذف"
        isLoading={isSubmitting}
      />
    </div>
  );
}
