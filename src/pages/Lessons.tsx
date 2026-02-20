import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Video, FileText, Gamepad2, Upload, X, CheckCircle, Image, File, ExternalLink, Music, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import RichTextEditor from '../components/ui/RichTextEditor';
import SearchableSelect from '../components/ui/SearchableSelect';

interface Level {
  id: number;
  name: string;
}

interface Lesson {
  id: number;
  name: string;
  description: string;
  sortOrder: number;
  videoUrl: string;
  imageUrl: string;
  pdfUrl: string;
  game: string;
  audioUrl: string;
  levelId: number;
}

type UploadType = 'image' | 'video' | 'file' | 'audio';
type PreviewType = 'image' | 'video' | 'pdf' | 'game' | 'audio' | null;

export default function Lessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // حالات رفع الملفات
  const [uploadingType, setUploadingType] = useState<UploadType | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [draggingType, setDraggingType] = useState<UploadType | null>(null);
  
  // حالة معاينة الوسائط
  const [previewType, setPreviewType] = useState<PreviewType>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewTitle, setPreviewTitle] = useState<string>('');
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    levelId: null as number | null,
    name: '',
    description: '',
    sortOrder: 1,
    videoUrl: '',
    imageUrl: '',
    pdfUrl: '',
    game: '',
    audioUrl: '',
  });

  // فتح معاينة الوسائط
  const openPreview = (type: PreviewType, url: string, title: string) => {
    setPreviewType(type);
    setPreviewUrl(url);
    setPreviewTitle(title);
  };

  // إغلاق المعاينة
  const closePreview = () => {
    setPreviewType(null);
    setPreviewUrl('');
    setPreviewTitle('');
  };

  // دالة رفع الملفات
  const uploadFile = async (file: File, type: UploadType) => {
    // التحقق من نوع الملف
    const validTypes: Record<UploadType, { mimes: string[]; maxSize: number; label: string }> = {
      image: { mimes: ['image/'], maxSize: 5 * 1024 * 1024, label: 'صورة' },
      video: { mimes: ['video/'], maxSize: 100 * 1024 * 1024, label: 'فيديو' },
      file: { mimes: ['application/pdf'], maxSize: 20 * 1024 * 1024, label: 'ملف PDF' },
      audio: { mimes: ['audio/'], maxSize: 20 * 1024 * 1024, label: 'ملف صوتي' },
    };

    const config = validTypes[type];
    const isValidType = config.mimes.some(mime => file.type.startsWith(mime));
    
    if (!isValidType) {
      toast.error(`يرجى اختيار ${config.label} صالح`);
      return;
    }

    if (file.size > config.maxSize) {
      const maxSizeMB = config.maxSize / (1024 * 1024);
      toast.error(`حجم الملف يجب أن لا يتجاوز ${maxSizeMB} ميجابايت`);
      return;
    }

    setUploadingType(type);
    setUploadProgress(0);

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    // تحديد endpoint الرفع
    const endpointMap: Record<UploadType, string> = {
      image: API_ENDPOINTS.upload.image,
      video: API_ENDPOINTS.upload.video,
      file: API_ENDPOINTS.upload.file,
      audio: API_ENDPOINTS.upload.audio,
    };
    const endpoint = endpointMap[type];

    try {
      const response = await api.post(endpoint, formDataUpload, {
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
      const fileUrl = response.data.path || response.data.url || response.data.data?.path || response.data.data?.url;
      
      if (fileUrl) {
        // تحديث الحقل المناسب
        const fieldMap: Record<UploadType, keyof typeof formData> = {
          image: 'imageUrl',
          video: 'videoUrl',
          file: 'pdfUrl',
          audio: 'audioUrl',
        };
        setFormData(prev => ({ ...prev, [fieldMap[type]]: fileUrl }));
        toast.success(`تم رفع ${config.label} بنجاح`);
      } else {
        toast.error('لم يتم العثور على رابط الملف في الاستجابة');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || `فشل في رفع ${config.label}`);
    } finally {
      setUploadingType(null);
      setUploadProgress(0);
    }
  };

  // معالجة السحب والإفلات
  const handleDragOver = (e: React.DragEvent, type: UploadType) => {
    e.preventDefault();
    setDraggingType(type);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingType(null);
  };

  const handleDrop = (e: React.DragEvent, type: UploadType) => {
    e.preventDefault();
    setDraggingType(null);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadFile(files[0], type);
    }
  };

  // معالجة اختيار الملف
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: UploadType) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0], type);
    }
    // إعادة تعيين قيمة الإدخال
    e.target.value = '';
  };

  // الحصول على ref المناسب
  const getInputRef = (type: UploadType) => {
    switch (type) {
      case 'image': return imageInputRef;
      case 'video': return videoInputRef;
      case 'file': return fileInputRef;
      case 'audio': return audioInputRef;
    }
  };

  const fetchLevels = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.levels);
      const levelsData = response.data.data || response.data || [];
      setLevels(levelsData);
      if (levelsData.length > 0 && !selectedLevelId) {
        setSelectedLevelId(levelsData[0].id);
      }
    } catch {
      toast.error('فشل في جلب المستويات');
    }
  };

  const fetchLessons = async (levelId: number) => {
    setIsLoading(true);
    try {
      const response = await api.get(API_ENDPOINTS.lessonsForLevel(levelId));
      setLessons(response.data.data || response.data || []);
    } catch {
      toast.error('فشل في جلب الدروس');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedLevelId) {
      fetchLessons(selectedLevelId);
    }
  }, [selectedLevelId]);

  const handleOpenModal = (lesson?: Lesson) => {
    // إعادة تعيين حالة الرفع
    setUploadingType(null);
    setUploadProgress(0);
    setDraggingType(null);

    if (lesson) {
      setSelectedLesson(lesson);
      setFormData({
        levelId: lesson.levelId,
        name: lesson.name,
        description: lesson.description,
        sortOrder: lesson.sortOrder,
        videoUrl: lesson.videoUrl || '',
        imageUrl: lesson.imageUrl || '',
        pdfUrl: lesson.pdfUrl || '',
        game: lesson.game || '',
        audioUrl: lesson.audioUrl || '',
      });
    } else {
      setSelectedLesson(null);
      setFormData({
        levelId: selectedLevelId,
        name: '',
        description: '',
        sortOrder: 1,
        videoUrl: '',
        imageUrl: '',
        pdfUrl: '',
        game: '',
        audioUrl: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.levelId) {
        toast.error('يرجى اختيار المستوى');
        return;
    }
    setIsSubmitting(true);

    try {
      const payload = {
        levelId: formData.levelId,
        lessons: [
          {
            name: formData.name,
            description: formData.description,
            sortOrder: formData.sortOrder,
            videoUrl: formData.videoUrl,
            imageUrl: formData.imageUrl,
            pdfUrl: formData.pdfUrl,
            game: formData.game,
            audioUrl: formData.audioUrl,
          },
        ],
      };

      if (selectedLesson) {
        await api.patch(`${API_ENDPOINTS.lessons}/${selectedLesson.id}`, payload, {
          headers: { 'Content-Type': 'application/json' },
        });
        toast.success('تم تحديث الدرس بنجاح');
      } else {
        await api.post(API_ENDPOINTS.lessons, payload, {
          headers: { 'Content-Type': 'application/json' },
        });
        toast.success('تم إضافة الدرس بنجاح');
      }

      setIsModalOpen(false);
      if (selectedLevelId) fetchLessons(selectedLevelId);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLesson) return;
    setIsSubmitting(true);

    try {
      await api.delete(`${API_ENDPOINTS.lessons}/${selectedLesson.id}`);
      toast.success('تم حذف الدرس بنجاح');
      setIsDeleteDialogOpen(false);
      if (selectedLevelId) fetchLessons(selectedLevelId);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'فشل في حذف الدرس');
    } finally {
      setIsSubmitting(false);
    }
  };

  // مكون رفع الملفات
  const FileUploadZone = ({ 
    type, 
    value, 
    label, 
    accept, 
    icon: Icon,
    placeholder,
    fieldKey
  }: { 
    type: UploadType; 
    value: string; 
    label: string; 
    accept: string;
    icon: React.ElementType;
    placeholder: string;
    fieldKey: keyof typeof formData;
  }) => {
    const inputRef = getInputRef(type);
    const isUploading = uploadingType === type;
    const isDragging = draggingType === type;

    return (
      <div>
        <label className="block text-slate-600 text-sm mb-2">{label}</label>
        
        {/* منطقة رفع الملف */}
        <div
          onDragOver={(e) => handleDragOver(e, type)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, type)}
          onClick={() => !isUploading && inputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer
            transition-all duration-300
            ${isDragging 
              ? 'border-emerald-500 bg-emerald-500/10' 
              : 'border-slate-600 hover:border-slate-500 hover:bg-white border border-slate-200/50'
            }
            ${isUploading ? 'pointer-events-none' : ''}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={(e) => handleFileSelect(e, type)}
            className="hidden"
          />

          {isUploading ? (
            <div className="space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Upload className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <p className="text-slate-600 text-sm">جاري الرفع...</p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-emerald-400 text-xs">{uploadProgress}%</p>
            </div>
          ) : value ? (
            <div className="space-y-2">
              <div className="relative w-16 h-16 mx-auto rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                {type === 'image' ? (
                  <img
                    src={`${API_BASE_URL}/uploads/${value}`}
                    alt={label}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                    }}
                  />
                ) : (
                  <Icon className="w-8 h-8 text-slate-600" />
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFormData({ ...formData, [fieldKey]: '' });
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3 text-slate-900" />
                </button>
              </div>
              <div className="flex items-center justify-center gap-1 text-emerald-400">
                <CheckCircle className="w-3 h-3" />
                <span className="text-xs">تم الرفع</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className={`
                w-10 h-10 mx-auto rounded-full flex items-center justify-center
                ${isDragging ? 'bg-emerald-500/20' : 'bg-slate-100'}
              `}>
                <Icon className={`w-5 h-5 ${isDragging ? 'text-emerald-400' : 'text-slate-600'}`} />
              </div>
              <p className={`text-sm ${isDragging ? 'text-emerald-400' : 'text-slate-600'}`}>
                {isDragging ? 'أفلت هنا' : 'اسحب أو اضغط'}
              </p>
            </div>
          )}
        </div>

        {/* حقل الرابط اليدوي */}
        <input
          type="text"
          value={value}
          onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
          className="input-field text-xs mt-2"
          dir="ltr"
          placeholder={placeholder}
        />
      </div>
    );
  };

  const columns = [
    { key: 'id', header: '#' },
    { key: 'name', header: 'اسم الدرس' },
    {
      key: 'description',
      header: 'الوصف',
      render: (lesson: Lesson) => (
        <div 
          className="line-clamp-1 max-w-xs text-slate-900"
          dangerouslySetInnerHTML={{ __html: lesson.description || '-' }}
        />
      ),
    },
    {
      key: 'media',
      header: 'الوسائط',
      render: (lesson: Lesson) => (
        <div className="flex items-center gap-2">
          {lesson.imageUrl && (
            <button
              onClick={() => openPreview('image', lesson.imageUrl, `صورة: ${lesson.name}`)}
              className="p-1.5 rounded bg-purple-500/20 hover:bg-purple-500/40 transition-colors cursor-pointer"
              title="عرض الصورة"
            >
              <Image className="w-4 h-4 text-purple-400" />
            </button>
          )}
          {lesson.videoUrl && (
            <button
              onClick={() => openPreview('video', lesson.videoUrl, `فيديو: ${lesson.name}`)}
              className="p-1.5 rounded bg-blue-500/20 hover:bg-blue-500/40 transition-colors cursor-pointer"
              title="عرض الفيديو"
            >
              <Video className="w-4 h-4 text-blue-400" />
            </button>
          )}
          {lesson.pdfUrl && (
            <button
              onClick={() => openPreview('pdf', lesson.pdfUrl, `ملف PDF: ${lesson.name}`)}
              className="p-1.5 rounded bg-red-500/20 hover:bg-red-500/40 transition-colors cursor-pointer"
              title="عرض ملف PDF"
            >
              <FileText className="w-4 h-4 text-red-400" />
            </button>
          )}
          {lesson.audioUrl && (
            <button
              onClick={() => openPreview('audio', lesson.audioUrl, `صوت: ${lesson.name}`)}
              className="p-1.5 rounded bg-yellow-500/20 hover:bg-yellow-500/40 transition-colors cursor-pointer"
              title="عرض الصوت"
            >
              <Music className="w-4 h-4 text-yellow-400" />
            </button>
          )}
          {lesson.game && (
            <button
              onClick={() => openPreview('game', lesson.game, `لعبة: ${lesson.name}`)}
              className="p-1.5 rounded bg-green-500/20 hover:bg-green-500/40 transition-colors cursor-pointer"
              title="عرض اللعبة"
            >
              <Gamepad2 className="w-4 h-4 text-green-400" />
            </button>
          )}
        </div>
      ),
    },
    {
      key: 'sortOrder',
      header: 'الترتيب',
      render: (lesson: Lesson) => (
        <span className="px-3 py-1 rounded-full text-xs bg-slate-100 text-slate-600">
          {lesson.sortOrder}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (lesson: Lesson) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(lesson)}
            className="p-2 cursor-pointer rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedLesson(lesson);
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
      <PageHeader
        title="الدروس"
        description="إدارة دروس المستويات"
        action={
          <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة درس
          </button>
        }
      />

      {/* Level Filter */}
      <div className="mb-6 max-w-xs">
        <label className="block text-slate-600 text-sm mb-2">اختر المستوى</label>
        <SearchableSelect
          options={levels}
          value={selectedLevelId}
          onChange={(value) => setSelectedLevelId(value as number)}
          placeholder="اختر مستوى..."
          icon={Layers}
        />
      </div>

      <DataTable
        columns={columns}
        data={lessons}
        isLoading={isLoading}
        keyExtractor={(lesson) => lesson.id}
        emptyMessage="لا توجد دروس في هذا المستوى"
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedLesson ? 'تعديل الدرس' : 'إضافة درس جديد'}
        size="lg"
        showFullscreen={true}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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

          <div>
            <label className="block text-slate-600 text-sm mb-2">اسم الدرس</label>
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
            placeholder="اكتب وصف الدرس هنا..."
          />

          {/* منطقة رفع الملفات */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FileUploadZone
              type="image"
              value={formData.imageUrl}
              label="الصورة"
              accept="image/*"
              icon={Image}
              placeholder="images/lesson.jpg"
              fieldKey="imageUrl"
            />
            <FileUploadZone
              type="video"
              value={formData.videoUrl}
              label="الفيديو"
              accept="video/*"
              icon={Video}
              placeholder="video/lesson.mp4"
              fieldKey="videoUrl"
            />
            <FileUploadZone
              type="file"
              value={formData.pdfUrl}
              label="ملف PDF"
              accept="application/pdf"
              icon={File}
              placeholder="files/lesson.pdf"
              fieldKey="pdfUrl"
            />
            <FileUploadZone
              type="audio"
              value={formData.audioUrl}
              label="ملف صوتي"
              accept="audio/*"
              icon={Music}
              placeholder="audio/lesson.mp3"
              fieldKey="audioUrl"
            />
          </div>

          {/* كود اللعبة Embed */}
          <div>
            <label className="block text-slate-600 text-sm mb-2">
              <span className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4" />
                كود اللعبة (Embed)
              </span>
            </label>
            <textarea
              value={formData.game}
              onChange={(e) => setFormData({ ...formData, game: e.target.value })}
              className="input-field min-h-[120px] resize-none font-mono text-sm"
              dir="ltr"
              placeholder="<iframe src='...' width='100%' height='400'></iframe>"
              rows={4}
            />
            <p className="text-slate-500 text-xs mt-1">
              الصق كود embed الخاص باللعبة هنا (HTML/iframe)
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : selectedLesson ? 'تحديث' : 'إضافة'}
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
        title="حذف الدرس"
        message={`هل أنت متأكد من حذف الدرس "${selectedLesson?.name}"؟`}
        confirmText="حذف"
        isLoading={isSubmitting}
      />

      {/* Media Preview Modal */}
      {previewType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closePreview}
          />
          
          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">{previewTitle}</h3>
              <div className="flex items-center gap-2">
                {previewType !== 'game' && (
                  <a
                    href={`${API_BASE_URL}/uploads/${previewUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    title="فتح في نافذة جديدة"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
                <button
                  onClick={closePreview}
                  className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              {previewType === 'image' && (
                <div className="flex items-center justify-center">
                  <img
                    src={`${API_BASE_URL}/uploads/${previewUrl}`}
                    alt={previewTitle}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  />
                </div>
              )}
              
              {previewType === 'video' && (
                <div className="flex items-center justify-center">
                  <video
                    src={`${API_BASE_URL}/uploads/${previewUrl}`}
                    controls
                    autoPlay
                    className="max-w-full max-h-[70vh] rounded-lg"
                  >
                    متصفحك لا يدعم تشغيل الفيديو
                  </video>
                </div>
              )}

              {previewType === 'audio' && (
                <div className="flex items-center justify-center p-8">
                  <audio
                    src={`${API_BASE_URL}/uploads/${previewUrl}`}
                    controls
                    autoPlay
                    className="w-full"
                  >
                    متصفحك لا يدعم تشغيل الصوت
                  </audio>
                </div>
              )}
              
              {previewType === 'pdf' && (
                <div className="w-full h-[70vh]">
                  <iframe
                    src={`${API_BASE_URL}/uploads/${previewUrl}`}
                    className="w-full h-full rounded-lg border border-slate-200"
                    title={previewTitle}
                  />
                </div>
              )}
              
              {previewType === 'game' && (
                <div className="w-full min-h-[60vh]">
                  <div 
                    className="w-full"
                    dangerouslySetInnerHTML={{ __html: previewUrl }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
