import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, ArrowRight, FileText, ExternalLink, Upload, X, CheckCircle, File } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

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

export default function TeacherClassFiles() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [files, setFiles] = useState<ClassFile[]>([]);
  const [adminFiles, setAdminFiles] = useState<AdminFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ClassFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // حالة رفع الملف
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fileId: 0,
    name: '',
    description: '',
    order: 1,
  });

  const fetchFiles = async () => {
    if (!classId) return;
    try {
      const response = await api.get(API_ENDPOINTS.teacherClassFiles(parseInt(classId)));
      setFiles(response.data.data || response.data || []);
    } catch {
      toast.error('فشل في جلب البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminFiles = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.files);
      setAdminFiles(response.data.data || response.data || []);
    } catch {
      console.error('Failed to fetch admin files');
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchAdminFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  // دالة رفع الملف
  const uploadFile = async (file: globalThis.File) => {
    // التحقق من حجم الملف (50MB كحد أقصى)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('حجم الملف يجب أن لا يتجاوز 50 ميجابايت');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadedFileName(file.name);

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      // رفع الملف
      const uploadResponse = await api.post(API_ENDPOINTS.upload.file, formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        },
      });

      // استخراج رابط الملف من الاستجابة
      const filePath = uploadResponse.data.path || uploadResponse.data.url || uploadResponse.data.data?.path || uploadResponse.data.data?.url;
      
      if (filePath) {
        // إنشاء سجل الملف في admin/files
        const fileParams = new URLSearchParams();
        fileParams.append('file', filePath);
        
        const createFileResponse = await api.post(API_ENDPOINTS.files, fileParams);
        const newFileId = createFileResponse.data.id || createFileResponse.data.data?.id;
        
        if (newFileId) {
          setFormData(prev => ({ ...prev, fileId: newFileId }));
          // تحديث قائمة الملفات المتاحة
          fetchAdminFiles();
          toast.success('تم رفع الملف بنجاح');
        } else {
          toast.error('فشل في إنشاء سجل الملف');
        }
      } else {
        toast.error('لم يتم العثور على رابط الملف في الاستجابة');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'فشل في رفع الملف');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // معالجة السحب والإفلات
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      uploadFile(droppedFiles[0]);
    }
  };

  // معالجة اختيار الملف
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      uploadFile(selectedFiles[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenModal = (file?: ClassFile) => {
    // إعادة تعيين حالة الرفع
    setIsUploading(false);
    setUploadProgress(0);
    setIsDragging(false);
    setUploadedFileName('');

    if (file) {
      setSelectedFile(file);
      setFormData({
        fileId: file.fileId,
        name: file.name,
        description: file.description || '',
        order: file.order,
      });
    } else {
      setSelectedFile(null);
      setFormData({
        fileId: 0,
        name: '',
        description: '',
        order: files.length + 1,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) return;
    
    if (!formData.fileId) {
      toast.error('يرجى رفع ملف أولاً');
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
      fetchFiles();
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
      fetchFiles();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'فشل في حذف الملف');
    } finally {
      setIsSubmitting(false);
    }
  };

  // استخراج اسم الملف من المسار
  const extractFileName = (filePath: string) => {
    if (!filePath) return '';
    // استخراج اسم الملف من المسار
    const parts = filePath.split('/');
    return parts[parts.length - 1] || filePath;
  };

  // الحصول على اسم الملف من القائمة
  const getSelectedFileName = () => {
    const file = adminFiles.find(f => f.id === formData.fileId);
    return file?.name ? extractFileName(file.name) : '';
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
          {/* منطقة رفع الملف */}
          <div>
            <label className="block text-slate-600 text-sm mb-2">الملف</label>
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                transition-all duration-300
                ${isDragging 
                  ? 'border-orange-500 bg-orange-500/10' 
                  : 'border-slate-600 hover:border-slate-500 hover:bg-white border border-slate-200/50'
                }
                ${isUploading ? 'pointer-events-none' : ''}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
              />

              {isUploading ? (
                // حالة الرفع
                <div className="space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-orange-400 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-slate-600">جاري رفع الملف...</p>
                    <p className="text-slate-500 text-sm truncate max-w-xs mx-auto">{uploadedFileName}</p>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-orange-400 font-medium">{uploadProgress}%</p>
                </div>
              ) : formData.fileId ? (
                // عرض الملف المرفوع
                <div className="space-y-3">
                  <div className="relative w-16 h-16 mx-auto rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <File className="w-8 h-8 text-orange-400" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, fileId: 0 });
                        setUploadedFileName('');
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-900" />
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-orange-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">تم رفع الملف</span>
                  </div>
                  <p className="text-slate-500 text-xs truncate max-w-xs mx-auto" dir="ltr">
                    {getSelectedFileName() || uploadedFileName}
                  </p>
                  <p className="text-slate-600 text-xs">اضغط لتغيير الملف</p>
                </div>
              ) : (
                // الحالة الافتراضية
                <div className="space-y-3">
                  <div className={`
                    w-14 h-14 mx-auto rounded-full flex items-center justify-center
                    ${isDragging ? 'bg-orange-500/20' : 'bg-slate-100'}
                  `}>
                    <Upload className={`w-7 h-7 ${isDragging ? 'text-orange-400' : 'text-slate-600'}`} />
                  </div>
                  <div>
                    <p className={`${isDragging ? 'text-orange-400' : 'text-slate-600'}`}>
                      {isDragging ? 'أفلت الملف هنا' : 'اسحب الملف هنا أو اضغط للاختيار'}
                    </p>
                    <p className="text-slate-500 text-sm mt-1">
                      PDF, DOC, XLS, PPT, TXT, ZIP حتى 50MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* اختيار من الملفات الموجودة */}
            {adminFiles.length > 0 && !formData.fileId && (
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-px bg-slate-100"></div>
                  <span className="text-slate-500 text-xs">أو اختر من الملفات الموجودة</span>
                  <div className="flex-1 h-px bg-slate-100"></div>
                </div>
                <select
                  value={formData.fileId}
                  onChange={(e) => setFormData({ ...formData, fileId: parseInt(e.target.value) })}
                  className="input-field text-sm"
                >
                  <option value="">اختر ملف موجود</option>
                  {adminFiles.map((file) => (
                    <option key={file.id} value={file.id}>
                      📄 {extractFileName(file.name)}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
              disabled={isSubmitting || isUploading || !formData.fileId}
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
