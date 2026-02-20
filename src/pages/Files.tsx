import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, FileText, ExternalLink, Layers, Upload, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import SearchableSelect from '../components/ui/SearchableSelect';

interface Level {
  id: number;
  name: string;
}

interface AdminFile {
  id: number;
  name: string;
  levelId: number;
  Level: {
    name: string;
  };
  createdAt: string;
}

export default function Files() {
  const [files, setFiles] = useState<AdminFile[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState<number | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<AdminFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    file: '',
    levelId: null as number | null,
  });

  const fetchLevels = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.levels);
      setLevels(response.data.data || response.data || []);
    } catch {
      toast.error('فشل في جلب المستويات');
    }
  };

  const fetchFiles = async (levelId: number | 'all') => {
    setIsLoading(true);
    try {
      const params = levelId !== 'all' ? { params: { level_id: levelId } } : {};
      const response = await api.get(API_ENDPOINTS.files, params);
      setFiles(response.data.data || response.data || []);
    } catch (error) {
      toast.error('فشل في جلب البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  useEffect(() => {
    fetchFiles(selectedLevelId);
  }, [selectedLevelId]);

  const handleOpenModal = () => {
    setFormData({ name: '', file: '', levelId: null });
    setIsUploading(false);
    setUploadProgress(0);
    setIsDragging(false);
    setIsModalOpen(true);
  };

  const uploadFile = async (fileToUpload: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    const formDataUpload = new FormData();
    formDataUpload.append('file', fileToUpload);

    let endpoint = API_ENDPOINTS.upload.file;
    const fileType = fileToUpload.type;

    if (fileType.startsWith('image/')) {
      endpoint = API_ENDPOINTS.upload.image;
    } else if (fileType.startsWith('video/')) {
      endpoint = API_ENDPOINTS.upload.video;
    } else if (fileType.startsWith('audio/')) {
      endpoint = API_ENDPOINTS.upload.audio;
    }

    try {
      const response = await api.post(endpoint, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0;
          setUploadProgress(progress);
        },
      });
      const fileUrl = response.data.path || response.data.url || response.data.data?.path;
      if (fileUrl) {
        setFormData(prev => ({ ...prev, file: fileUrl }));
        if (!formData.name) {
          setFormData(prev => ({ ...prev, name: fileToUpload.name }));
        }
        toast.success('تم رفع الملف بنجاح');
      } else {
        toast.error('لم يتم العثور على رابط الملف في الاستجابة');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل في رفع الملف');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.levelId) {
      toast.error('يرجى اختيار المستوى');
      return;
    }
    if (!formData.file) {
      toast.error('يرجى رفع ملف');
      return;
    }
    setIsSubmitting(true);

    try {
      const params = new URLSearchParams();
      params.append('name', formData.name);
      params.append('file', formData.file);
      params.append('levelId', formData.levelId.toString());

      await api.post(API_ENDPOINTS.files, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      toast.success('تم إضافة الملف بنجاح');

      setIsModalOpen(false);
      fetchFiles(selectedLevelId);
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
      fetchFiles(selectedLevelId);
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
      key: 'level',
      header: 'المستوى',
      render: (file: AdminFile) => (
        <span className="px-3 py-1 rounded-full text-xs bg-slate-100 text-slate-600">
          {file.level?.name || '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'تاريخ الإنشاء',
      render: (file: AdminFile) => (
        <span className="text-slate-600">
          {file.createdAt ? new Date(file.createdAt).toLocaleDateString('ar-SY') : '-'}
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

  const levelsWithAll = [{ id: 'all', name: 'كل المستويات' }, ...levels];

  return (
    <div>
      <PageHeader
        title="الملفات"
        description="إدارة ملفات النظام"
        action={
          <button onClick={handleOpenModal} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة ملف
          </button>
        }
      />

      {/* Level Filter */}
      <div className="mb-6 max-w-xs">
        <label className="block text-slate-600 text-sm mb-2">فلترة حسب المستوى</label>
        <SearchableSelect
          options={levelsWithAll}
          value={selectedLevelId}
          onChange={(value) => setSelectedLevelId(value as number | 'all')}
          placeholder="اختر مستوى..."
          icon={Layers}
        />
      </div>

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
          <FileUploadZone onUpload={uploadFile} isUploading={isUploading} progress={uploadProgress} uploadedPath={formData.file} />
          
          <div>
            <label className="block text-slate-600 text-sm mb-2">اسم الملف (للعرض)</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="مثال: Lesson 1 - Vocabulary"
              required
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm mb-2">المستوى</label>
            <SearchableSelect
              options={levels}
              value={formData.levelId}
              onChange={(value) => setFormData({ ...formData, levelId: value as number })}
              placeholder="اختر المستوى..."
              icon={Layers}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1" disabled={isSubmitting || isUploading}>
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

function FileUploadZone({ onUpload, isUploading, progress, uploadedPath }: { onUpload: (file: File) => void, isUploading: boolean, progress: number, uploadedPath: string }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onUpload(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  }, [onUpload]);
  
  return (
    <div>
      <label className="block text-slate-600 text-sm mb-2">رفع ملف</label>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative mt-2 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-300 hover:border-slate-400'}`}
      >
        <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />
        {isUploading ? (
          <div className="space-y-2">
            <Upload className="w-8 h-8 mx-auto text-emerald-500 animate-pulse" />
            <p className="text-sm">جاري الرفع... {progress}%</p>
            <div className="w-full bg-slate-200 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div></div>
          </div>
        ) : uploadedPath ? (
          <div className="space-y-2">
            <CheckCircle className="w-8 h-8 mx-auto text-emerald-500" />
            <p className="text-sm font-semibold truncate">{uploadedPath}</p>
            <p className="text-xs text-slate-500">اضغط أو اسحب ملف آخر للتغيير</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-sm">اسحب الملف إلى هنا أو اضغط للاختيار</p>
            <p className="text-xs text-slate-500">سيتم تحديد النوع تلقائياً</p>
          </div>
        )}
      </div>
    </div>
  );
}

