import { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

interface AdminFile {
  id: number;
  name: string;
  createdAt: string;
}

export default function Files() {
  const [files, setFiles] = useState<AdminFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<AdminFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filePath, setFilePath] = useState('');

  const fetchFiles = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.files);
      setFiles(response.data.data || response.data || []);
    } catch (error) {
      toast.error('فشل في جلب البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const params = new URLSearchParams();
      params.append('file', filePath);

      await api.post(API_ENDPOINTS.files, params);
      toast.success('تم إضافة الملف بنجاح');

      setIsModalOpen(false);
      setFilePath('');
      fetchFiles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFile) return;
    setIsSubmitting(true);

    try {
      await api.delete(`${API_ENDPOINTS.files}/${selectedFile.id}`);
      toast.success('تم حذف الملف بنجاح');
      setIsDeleteDialogOpen(false);
      fetchFiles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل في حذف الملف');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { key: 'id', header: '#' },
    {
      key: 'name',
      header: 'الملف',
      render: (file: AdminFile) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-red-400" />
          </div>
          <span className="text-slate-600 font-mono text-sm">{file.name}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'تاريخ الإنشاء',
      render: (file: AdminFile) => (
        <span className="text-slate-600">
          {file.createdAt ? new Date(file.createdAt).toLocaleDateString('ar-SYRIA-SYRIAN-ARABIC') : '-'}
        </span>
      ),
    },
    {
      key: 'view',
      header: 'عرض',
      render: (file: AdminFile) => (
        <a
          href={`${API_BASE_URL}/uploads/${file.name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 cursor-pointer rounded-lg text-slate-600 hover:text-primary-400 hover:bg-primary-500/10 transition-colors inline-flex"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      ),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (file: AdminFile) => (
        <button
          onClick={() => {
            setSelectedFile(file);
            setIsDeleteDialogOpen(true);
          }}
          className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="الملفات"
        description="إدارة ملفات النظام"
        action={
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة ملف
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={files}
        isLoading={isLoading}
        keyExtractor={(file) => file.id}
        emptyMessage="لا توجد ملفات"
      />

      {/* Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="إضافة ملف جديد"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-600 text-sm mb-2">مسار الملف</label>
            <input
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              className="input-field"
              dir="ltr"
              placeholder="/files/document.pdf"
              required
            />
            <p className="text-slate-500 text-xs mt-2">
              أدخل مسار الملف بعد رفعه عبر صفحة رفع الملفات
            </p>
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
        title="حذف الملف"
        message="هل أنت متأكد من حذف هذا الملف؟"
        confirmText="حذف"
        isLoading={isSubmitting}
      />
    </div>
  );
}

