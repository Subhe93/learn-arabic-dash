import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, ArrowRight, FileText, ExternalLink, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import SearchableSelect from '../components/ui/SearchableSelect';

interface ClassFile {
  id: number;
  fileId: number;
  name: string;
  description: string;
  order: number;
  file?: {
    id: number;
    name: string;
  };
  createdAt: string;
}

interface AdminFile {
  id: number;
  name: string;
  createdAt?: string;
}

interface Level {
  id: number;
  name: string;
}

export default function TeacherClassFiles() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [files, setFiles] = useState<ClassFile[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [adminFiles, setAdminFiles] = useState<AdminFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ClassFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    fileId: null as number | null,
    name: '',
    description: '',
    order: 1,
  });

  const fetchClassFiles = async () => {
    if (!classId) return;
    try {
      const response = await api.get(API_ENDPOINTS.teacherClassFiles(parseInt(classId)));
      setFiles(response.data.data || response.data || []);
    } catch {
      toast.error('فشل في جلب بيانات ملفات الصف');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLevels = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.levels);
      setLevels(response.data.data || response.data || []);
    } catch {
      toast.error('فشل في جلب المستويات');
    }
  };

  const fetchAdminFiles = async (levelId: number) => {
    try {
      const response = await api.get(API_ENDPOINTS.files, {
        params: { level_id: levelId }
      });
      setAdminFiles(response.data.data || response.data || []);
    } catch {
      console.error('Failed to fetch admin files for level:', levelId);
      toast.error('فشل في جلب ملفات المستوى المحدد');
    }
  };

  useEffect(() => {
    fetchClassFiles();
    fetchLevels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  useEffect(() => {
    if (selectedLevelId) {
      fetchAdminFiles(selectedLevelId);
    } else {
      setAdminFiles([]); // Clear files if no level is selected
    }
  }, [selectedLevelId]);

  const handleOpenModal = (file?: ClassFile) => {
    if (file) {
      setSelectedFile(file);
      setFormData({
        fileId: file.fileId,
        name: file.name,
        description: file.description || '',
        order: file.order,
      });
      // This is a bit tricky, we don't have the levelId here unless the API provides it.
      // For editing, the dropdowns might not be pre-selected.
    } else {
      setSelectedFile(null);
      setFormData({
        fileId: null,
        name: '',
        description: '',
        order: files.length + 1,
      });
    }
    setSelectedLevelId(null);
    setAdminFiles([]);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) return;
    
    if (!formData.fileId) {
      toast.error('يرجى اختيار ملف');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const params = new URLSearchParams();
      params.append('fileId', formData.fileId.toString());
      params.append('name', formData.name);
      params.append('description', formData.description);
      params.append('order', formData.order.toString());

      if (selectedFile) {
        await api.patch(
          `${API_ENDPOINTS.teacherClassFiles(parseInt(classId))}/${selectedFile.id}`,
          params
        );
        toast.success('تم تحديث الملف بنجاح');
      } else {
        await api.post(API_ENDPOINTS.teacherClassFiles(parseInt(classId)), params);
        toast.success('تم إضافة الملف بنجاح');
      }

      setIsModalOpen(false);
      fetchClassFiles();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFile || !classId) return;
    setIsSubmitting(true);

    try {
      await api.delete(`${API_ENDPOINTS.teacherClassFiles(parseInt(classId))}/${selectedFile.id}`);
      toast.success('تم حذف الملف بنجاح');
      setIsDeleteDialogOpen(false);
      fetchClassFiles();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'فشل في حذف الملف');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { key: 'id', header: '#' },
    {
      key: 'name',
      header: 'اسم الملف',
      render: (file: ClassFile) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-orange-400" />
          </div>
          <span>{file.name}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'الوصف',
      render: (file: ClassFile) => (
        <span className="text-slate-600 line-clamp-1 max-w-xs">
          {file.description || '-'}
        </span>
      ),
    },
    {
      key: 'order',
      header: 'الترتيب',
      render: (file: ClassFile) => (
        <span className="px-3 py-1 rounded-full text-xs bg-slate-100 text-slate-600">
          {file.order}
        </span>
      ),
    },
    {
      key: 'view',
      header: 'عرض',
      render: (file: ClassFile) =>
        file.file?.name ? (
          <a
            href={`${API_BASE_URL}/uploads/${file.file.name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 cursor-pointer rounded-lg text-slate-600 hover:text-primary-400 hover:bg-primary-500/10 transition-colors inline-flex"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        ) : (
          <span className="text-slate-500">-</span>
        ),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (file: ClassFile) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(file)}
            className="p-2 cursor-pointer rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedFile(file);
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
        title={`ملفات الصف #${classId}`}
        description={`إدارة ملفات هذا الصف • ${files.length} ملف`}
        action={
          <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
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
        emptyMessage="لا توجد ملفات في هذا الصف"
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedFile ? 'تعديل الملف' : 'إضافة ملف جديد'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4 p-4 border border-slate-200 rounded-lg">
            <h3 className="text-md font-semibold text-slate-800">اختيار ملف</h3>
            <div>
              <label className="block text-slate-600 text-sm mb-2">1. اختر المستوى</label>
              <SearchableSelect
                options={levels}
                value={selectedLevelId}
                onChange={(value) => {
                  setSelectedLevelId(value as number);
                  setFormData(prev => ({ ...prev, fileId: null }));
                }}
                placeholder="ابحث عن مستوى..."
                icon={Layers}
              />
            </div>

            <div>
              <label className="block text-slate-600 text-sm mb-2">2. اختر الملف</label>
              <SearchableSelect
                options={adminFiles}
                value={formData.fileId}
                onChange={(value) => setFormData({ ...formData, fileId: value as number })}
                placeholder={!selectedLevelId ? "اختر مستوى أولاً" : "ابحث عن ملف..."}
                icon={FileText}
                disabled={!selectedLevelId}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 text-sm mb-2">اسم الملف (للعرض)</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="مثال: الدرس الأول - ملف PDF"
              required
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm mb-2">الوصف</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field min-h-[80px] resize-none"
              placeholder="وصف مختصر للملف..."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm mb-2">الترتيب</label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
              className="input-field max-w-[150px]"
              min={1}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="submit" 
              className="btn-primary flex-1" 
              disabled={isSubmitting || !formData.fileId}
            >
              {isSubmitting ? 'جاري الحفظ...' : selectedFile ? 'تحديث' : 'إضافة'}
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
        message={`هل أنت متأكد من حذف الملف "${selectedFile?.name}"؟`}
        confirmText="حذف"
        isLoading={isSubmitting}
      />
    </div>
  );
}
