import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Pencil, Trash2, Image, Upload, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import RichTextEditor from '../components/ui/RichTextEditor';

interface Level {
  id: number;
  name: string;
  description: string;
  image: string;
  color: string;
  sortOrder: number;
  createdAt: string;
}

export default function Levels() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // حالة رفع الصورة
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    color: '#000000',
    sortOrder: 1,
  });

  // دالة رفع الصورة
  const uploadImage = async (file: File) => {
    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة صالح');
      return;
    }

    // التحقق من حجم الملف (5MB كحد أقصى)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('حجم الصورة يجب أن لا يتجاوز 5 ميجابايت');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await api.post(API_ENDPOINTS.upload.image, formDataUpload, {
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

      // استخراج رابط الصورة من الاستجابة
      const imageUrl = response.data.path || response.data.url || response.data.data?.path || response.data.data?.url;
      
      if (imageUrl) {
        setFormData(prev => ({ ...prev, image: imageUrl }));
        toast.success('تم رفع الصورة بنجاح');
      } else {
        toast.error('لم يتم العثور على رابط الصورة في الاستجابة');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'فشل في رفع الصورة');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // معالجة السحب والإفلات
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadImage(files[0]);
    }
  }, []);

  // معالجة اختيار الملف
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadImage(files[0]);
    }
    // إعادة تعيين قيمة الإدخال للسماح باختيار نفس الملف مرة أخرى
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fetchLevels = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.levels);
      setLevels(response.data.data || response.data || []);
    } catch {
      toast.error('فشل في جلب البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  const handleOpenModal = (level?: Level) => {
    // إعادة تعيين حالة الرفع
    setIsUploading(false);
    setUploadProgress(0);
    setIsDragging(false);
    
    if (level) {
      setSelectedLevel(level);
      setFormData({
        name: level.name,
        description: level.description,
        image: level.image,
        color: level.color || '#000000',
        sortOrder: level.sortOrder,
      });
    } else {
      setSelectedLevel(null);
      setFormData({ name: '', description: '', image: '', color: '#000000', sortOrder: 1 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        image: formData.image,
        color: formData.color,
        sortOrder: formData.sortOrder,
      };

      if (selectedLevel) {
        await api.patch(`${API_ENDPOINTS.levels}/${selectedLevel.id}`, payload, {
          headers: { 'Content-Type': 'application/json' },
        });
        toast.success('تم تحديث المستوى بنجاح');
      } else {
        await api.post(API_ENDPOINTS.levels, payload, {
          headers: { 'Content-Type': 'application/json' },
        });
        toast.success('تم إضافة المستوى بنجاح');
      }

      setIsModalOpen(false);
      fetchLevels();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLevel) return;
    setIsSubmitting(true);

    try {
      await api.delete(`${API_ENDPOINTS.levels}/${selectedLevel.id}`);
      toast.success('تم حذف المستوى بنجاح');
      setIsDeleteDialogOpen(false);
      fetchLevels();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'فشل في حذف المستوى');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { key: 'id', header: '#' },
    {
      key: 'image',
      header: 'الصورة',
      render: (level: Level) => (
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-slate-200">
          {level.image ? (
            <img
              src={`${API_BASE_URL}/uploads/${level.image}`}
              alt={level.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image className="w-6 h-6 text-slate-600" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'الاسم',
      render: (level: Level) => (
        <div className="flex items-center gap-3">
          <div className="w-3 h-8 rounded" style={{ backgroundColor: level.color || 'transparent' }}></div>
          <span>{level.name}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'الوصف',
      render: (level: Level) => (
        <div 
          className="line-clamp-1 max-w-xs text-slate-900"
          dangerouslySetInnerHTML={{ __html: level.description || '-' }}
        />
      ),
    },
    {
      key: 'sortOrder',
      header: 'الترتيب',
      render: (level: Level) => (
        <span className="px-3 py-1 rounded-full text-xs bg-slate-100 text-slate-600">
          {level.sortOrder}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (level: Level) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(level)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedLevel(level);
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
        title="المستويات"
        description="إدارة مستويات التعلم"
        action={
          <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة مستوى
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={levels}
        isLoading={isLoading}
        keyExtractor={(level) => level.id}
        emptyMessage="لا توجد مستويات"
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedLevel ? 'تعديل المستوى' : 'إضافة مستوى جديد'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-600 text-sm mb-2">اسم المستوى</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <RichTextEditor
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            label="الوصف"
            placeholder="اكتب وصف المستوى هنا..."
          />

          <div className='pb-4'>
            <label className="block text-slate-600 text-sm mb-2">الصورة</label>
            
            {/* منطقة رفع الصورة */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`p-4
                relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                transition-all duration-300
                ${isDragging 
                  ? 'border-emerald-500 bg-emerald-500/10' 
                  : 'border-slate-600 hover:border-slate-500 hover:bg-white border border-slate-200/50'
                }
                ${isUploading ? 'pointer-events-none' : ''}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {isUploading ? (
                // حالة الرفع
                <div className="space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-slate-600">جاري رفع الصورة...</p>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-emerald-400 text-sm font-medium">{uploadProgress}%</p>
                </div>
              ) : formData.image ? (
                // عرض الصورة المرفوعة
                <div className="space-y-3">
                  <div className="relative w-24 h-24 mx-auto rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={`${API_BASE_URL}/uploads/${formData.image}`}
                      alt="صورة المستوى"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, image: '' });
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-900" />
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">تم رفع الصورة</span>
                  </div>
                  <p className="text-slate-500 text-xs">اضغط لتغيير الصورة</p>
                </div>
              ) : (
                // الحالة الافتراضية
                <div className="space-y-3">
                  <div className={`
                    w-12 h-12 mx-auto rounded-full flex items-center justify-center
                    ${isDragging ? 'bg-emerald-500/20' : 'bg-slate-100'}
                  `}>
                    <Upload className={`w-6 h-6 ${isDragging ? 'text-emerald-400' : 'text-slate-600'}`} />
                  </div>
                  <div>
                    <p className={`${isDragging ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {isDragging ? 'أفلت الصورة هنا' : 'اسحب الصورة هنا أو اضغط للاختيار'}
                    </p>
                    <p className="text-slate-500 text-sm mt-1">
                      PNG, JPG, GIF حتى 5MB
                    </p>
                  </div>
                </div>
              )}
            </div>
   <br />
            {/* حقل الرابط اليدوي (اختياري) */}
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-px bg-slate-100"></div>
                <span className="text-slate-500 text-xs">أو أدخل الرابط يدوياً</span>
                <div className="flex-1 h-px bg-slate-100"></div>
              </div>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="input-field text-sm"
                dir="ltr"
                placeholder="/images/level.jpg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-sm mb-2">اللون</label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="input-field w-full h-12"
              />
            </div>
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
<br />
          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : selectedLevel ? 'تحديث' : 'إضافة'}
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
        title="حذف المستوى"
        message={`هل أنت متأكد من حذف المستوى "${selectedLevel?.name}"؟`}
        confirmText="حذف"
        isLoading={isSubmitting}
      />
    </div>
  );
}

