import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, HelpCircle, Search, CheckCircle, FileText, Video, ImageIcon, Music, Upload, X, ClipboardList } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import RichTextEditor from '../components/ui/RichTextEditor';

interface AssignmentBlock {
  id: number;
  assignmentId: number;
  orderIndex: number;
  textContentType: string;
  textContent: Record<string, unknown>;
  createdAt: string;
}

interface Assignment {
  id: number;
  title: string;
}

// أنواع المحتوى المتاحة
const contentTypes = [
  { value: 'text', label: 'نص', icon: FileText, color: 'blue' },
  { value: 'image', label: 'صورة', icon: ImageIcon, color: 'green' },
  { value: 'video', label: 'فيديو', icon: Video, color: 'purple' },
  { value: 'audio', label: 'صوت', icon: Music, color: 'amber' },
];

// قائمة منسدلة للواجبات مع البحث
interface AssignmentSelectProps {
  options: Assignment[];
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
}

function AssignmentSearchableSelect({ options, value, onChange, placeholder = 'اختر واجب...' }: AssignmentSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter(opt =>
    opt.title.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="input-field cursor-pointer flex items-center justify-between"
      >
        <span className={selectedOption ? 'text-slate-900' : 'text-slate-500'}>
          {selectedOption ? selectedOption.title : placeholder}
        </span>
        <ClipboardList className="w-4 h-4 text-slate-600" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-hidden">
          <div className="p-2 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن واجب..."
                className="w-full bg-slate-100 border-none rounded-lg pr-9 py-2 text-sm focus:ring-1 focus:ring-primary-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-slate-500 text-sm">لا توجد نتائج</div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`p-3 cursor-pointer hover:bg-slate-100 flex items-center gap-3 ${
                    value === opt.id ? 'bg-primary-500/20 text-primary-400' : ''
                  }`}
                >
                  <ClipboardList className="w-5 h-5 text-slate-600" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{opt.title}</div>
                    <div className="text-xs text-slate-500">#{opt.id}</div>
                  </div>
                  {value === opt.id && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}

export default function AssignmentBlocks() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const assignmentIdParam = searchParams.get('assignmentId');

  const [blocks, setBlocks] = useState<AssignmentBlock[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(
    assignmentIdParam ? parseInt(assignmentIdParam) : null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<AssignmentBlock | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // حالة رفع الملفات
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    assignmentId: 0,
    orderIndex: 1,
    textContentType: 'text',
    textContent: '',
    mediaUrl: '',
  });

  const fetchAssignments = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.assignments);
      const data = response.data.data || response.data || [];
      setAssignments(data);
      if (data.length > 0 && !selectedAssignmentId) {
        setSelectedAssignmentId(data[0].id);
      }
    } catch {
      toast.error('فشل في جلب الواجبات');
    }
  };

  const fetchBlocks = async (assignmentId: number) => {
    setIsLoading(true);
    try {
      const response = await api.get(`${API_ENDPOINTS.assignmentBlocks}?assignmentId=${assignmentId}`);
      setBlocks(response.data.data || response.data || []);
    } catch {
      toast.error('فشل في جلب الكتل');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedAssignmentId) {
      fetchBlocks(selectedAssignmentId);
    }
  }, [selectedAssignmentId]);

  // رفع الملفات
  const uploadFile = async (file: File, type: string) => {
    let endpoint = API_ENDPOINTS.upload.file;
    let maxSize = 50 * 1024 * 1024; // 50MB default
    
    if (type === 'image') {
      endpoint = API_ENDPOINTS.upload.image;
      maxSize = 5 * 1024 * 1024;
      if (!file.type.startsWith('image/')) {
        toast.error('يرجى اختيار ملف صورة صالح');
        return null;
      }
    } else if (type === 'video') {
      endpoint = API_ENDPOINTS.upload.video;
      maxSize = 100 * 1024 * 1024;
      if (!file.type.startsWith('video/')) {
        toast.error('يرجى اختيار ملف فيديو صالح');
        return null;
      }
    } else if (type === 'audio') {
      endpoint = API_ENDPOINTS.upload.audio;
      if (!file.type.startsWith('audio/')) {
        toast.error('يرجى اختيار ملف صوت صالح');
        return null;
      }
    }

    if (file.size > maxSize) {
      toast.error(`حجم الملف يجب أن لا يتجاوز ${maxSize / (1024 * 1024)}MB`);
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await api.post(endpoint, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        },
      });

      const url = response.data.path || response.data.url || response.data.data?.path || response.data.data?.url;
      if (url) {
        toast.success('تم رفع الملف بنجاح');
        return url;
      }
      toast.error('فشل في الحصول على رابط الملف');
      return null;
    } catch {
      toast.error('فشل في رفع الملف');
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const url = await uploadFile(file, formData.textContentType);
      if (url) {
        setFormData(prev => ({ ...prev, mediaUrl: url }));
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadFile(file, formData.textContentType);
      if (url) {
        setFormData(prev => ({ ...prev, mediaUrl: url }));
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenModal = (block?: AssignmentBlock) => {
    setIsUploading(false);
    setUploadProgress(0);
    setIsDragging(false);

    if (block) {
      setSelectedBlock(block);
      const content = block.textContent as { text?: string; url?: string };
      setFormData({
        assignmentId: block.assignmentId,
        orderIndex: block.orderIndex,
        textContentType: block.textContentType,
        textContent: content.text || '',
        mediaUrl: content.url || '',
      });
    } else {
      setSelectedBlock(null);
      setFormData({
        assignmentId: selectedAssignmentId || 0,
        orderIndex: blocks.length + 1,
        textContentType: '',
        textContent: '',
        mediaUrl: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleContentTypeChange = (type: string) => {
    setFormData({
      ...formData,
      textContentType: type,
      textContent: '',
      mediaUrl: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // بناء محتوى JSON حسب النوع
      let textContent: Record<string, unknown> = {};
      const textContentType = formData.textContentType || null;
      
      if (formData.textContentType === 'text') {
        textContent = { text: formData.textContent };
      } else if (formData.textContentType) {
        textContent = { url: formData.mediaUrl };
        if (formData.textContent) {
          textContent.caption = formData.textContent;
        }
      }

      const payload: Record<string, unknown> = {
        assignmentId: formData.assignmentId,
        orderIndex: formData.orderIndex,
      };

      // إضافة نوع المحتوى والمحتوى فقط إذا تم اختيار نوع
      if (textContentType) {
        payload.textContentType = textContentType;
        payload.textContent = textContent;
      }

      if (selectedBlock) {
        await api.patch(`${API_ENDPOINTS.assignmentBlocks}/${selectedBlock.id}`, payload, {
          headers: { 'Content-Type': 'application/json' },
        });
        toast.success('تم تحديث الكتلة بنجاح');
      } else {
        await api.post(API_ENDPOINTS.assignmentBlocks, payload, {
          headers: { 'Content-Type': 'application/json' },
        });
        toast.success('تم إضافة الكتلة بنجاح');
      }

      setIsModalOpen(false);
      if (selectedAssignmentId) fetchBlocks(selectedAssignmentId);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBlock) return;
    setIsSubmitting(true);

    try {
      await api.delete(`${API_ENDPOINTS.assignmentBlocks}/${selectedBlock.id}`);
      toast.success('تم حذف الكتلة بنجاح');
      setIsDeleteDialogOpen(false);
      if (selectedAssignmentId) fetchBlocks(selectedAssignmentId);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'فشل في حذف الكتلة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getContentTypeInfo = (type: string | null | undefined) => {
    if (!type) return null;
    return contentTypes.find(t => t.value === type) || null;
  };

  const getContentPreview = (block: AssignmentBlock) => {
    if (!block.textContentType) return '-';
    const content = block.textContent as { text?: string; url?: string; caption?: string };
    if (block.textContentType === 'text') {
      return content.text?.substring(0, 50) || '-';
    }
    return content.url ? '📎 ملف مرفق' : '-';
  };

  const getAcceptedFileTypes = () => {
    switch (formData.textContentType) {
      case 'image': return 'image/*';
      case 'video': return 'video/*';
      case 'audio': return 'audio/*';
      default: return '*/*';
    }
  };

  const columns = [
    { key: 'id', header: '#' },
    {
      key: 'orderIndex',
      header: 'الترتيب',
      render: (block: AssignmentBlock) => (
        <span className="px-3 py-1 rounded-full text-xs bg-slate-100 text-slate-600">
          {block.orderIndex}
        </span>
      ),
    },
    {
      key: 'textContentType',
      header: 'نوع المحتوى',
      render: (block: AssignmentBlock) => {
        const typeInfo = getContentTypeInfo(block.textContentType);
        if (!typeInfo) {
          return <span className="text-slate-500 text-xs">-</span>;
        }
        const Icon = typeInfo.icon;
        const colorClasses: Record<string, string> = {
          blue: 'bg-blue-500/20 text-blue-400',
          green: 'bg-green-500/20 text-green-400',
          purple: 'bg-purple-500/20 text-purple-400',
          amber: 'bg-amber-500/20 text-amber-400',
        };
        return (
          <span className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 w-fit ${colorClasses[typeInfo.color]}`}>
            <Icon className="w-4 h-4" />
            {typeInfo.label}
          </span>
        );
      },
    },
    {
      key: 'content',
      header: 'المحتوى',
      render: (block: AssignmentBlock) => (
        <span className="text-slate-600 line-clamp-1 max-w-xs text-sm">
          {getContentPreview(block)}
        </span>
      ),
    },
    {
      key: 'questions',
      header: 'الأسئلة',
      render: (block: AssignmentBlock) => (
        <button
          onClick={() => navigate(`/questions?assignmentBlockId=${block.id}`)}
          className="p-2 rounded-lg text-slate-600 hover:text-primary-400 hover:bg-primary-500/10 transition-colors"
          title="إدارة الأسئلة"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (block: AssignmentBlock) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(block)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedBlock(block);
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
        title="كتل الواجبات"
        description="إدارة كتل محتوى الواجبات"
        action={
          <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة كتلة
          </button>
        }
      />

      {/* Assignment Filter */}
      <div className="mb-6">
        <label className="block text-slate-600 text-sm mb-2">اختر الواجب</label>
        <div className="max-w-md">
          <AssignmentSearchableSelect
            options={assignments}
            value={selectedAssignmentId || 0}
            onChange={(value) => setSelectedAssignmentId(value)}
            placeholder="اختر واجب..."
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={blocks}
        isLoading={isLoading}
        keyExtractor={(block) => block.id}
        emptyMessage="لا توجد كتل في هذا الواجب"
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedBlock ? 'تعديل الكتلة' : 'إضافة كتلة جديدة'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-sm mb-2">الواجب *</label>
              <AssignmentSearchableSelect
                options={assignments}
                value={formData.assignmentId}
                onChange={(value) => setFormData({ ...formData, assignmentId: value })}
                placeholder="اختر واجب..."
              />
            </div>
            <div>
              <label className="block text-slate-600 text-sm mb-2">الترتيب</label>
              <input
                type="number"
                value={formData.orderIndex}
                onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 1 })}
                className="input-field"
                min={1}
              />
            </div>
          </div>

          {/* نوع المحتوى */}
          <div>
            <label className="block text-slate-600 text-sm mb-2">نوع المحتوى (اختياري)</label>
            <div className="grid grid-cols-4 gap-2">
              {contentTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.textContentType === type.value;
                const colorClasses: Record<string, { selected: string; hover: string }> = {
                  blue: { selected: 'border-blue-500 bg-blue-500/20 text-blue-400', hover: 'hover:border-blue-500/50' },
                  green: { selected: 'border-green-500 bg-green-500/20 text-green-400', hover: 'hover:border-green-500/50' },
                  purple: { selected: 'border-purple-500 bg-purple-500/20 text-purple-400', hover: 'hover:border-purple-500/50' },
                  amber: { selected: 'border-amber-500 bg-amber-500/20 text-amber-400', hover: 'hover:border-amber-500/50' },
                };
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleContentTypeChange(type.value)}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      isSelected
                        ? colorClasses[type.color].selected
                        : `border-slate-600 text-slate-600 ${colorClasses[type.color].hover}`
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
            {formData.textContentType && (
              <button
                type="button"
                onClick={() => setFormData({ ...formData, textContentType: '', textContent: '', mediaUrl: '' })}
                className="mt-2 text-xs text-slate-500 hover:text-slate-600 transition-colors"
              >
                × إزالة نوع المحتوى
              </button>
            )}
          </div>

          {/* محتوى حسب النوع - يظهر فقط عند اختيار نوع */}
          {formData.textContentType === 'text' && (
            <RichTextEditor
              value={formData.textContent}
              onChange={(value) => setFormData({ ...formData, textContent: value })}
              label="النص"
              placeholder="اكتب النص هنا..."
            />
          )}

          {formData.textContentType && formData.textContentType !== 'text' && (
            <>
              {/* منطقة رفع الملف */}
              <div>
                <label className="block text-slate-600 text-sm mb-2">
                  {formData.textContentType === 'image' && 'الصورة'}
                  {formData.textContentType === 'video' && 'الفيديو'}
                  {formData.textContentType === 'audio' && 'الصوت'}
                </label>
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`
                    relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                    transition-all duration-300
                    ${isDragging 
                      ? 'border-primary-500 bg-primary-500/10' 
                      : 'border-slate-600 hover:border-slate-500 hover:bg-white border border-slate-200/50'
                    }
                    ${isUploading ? 'pointer-events-none' : ''}
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={getAcceptedFileTypes()}
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {isUploading ? (
                    <div className="space-y-3">
                      <div className="w-14 h-14 mx-auto rounded-full bg-primary-500/20 flex items-center justify-center">
                        <Upload className="w-7 h-7 text-primary-400 animate-pulse" />
                      </div>
                      <p className="text-slate-600">جاري رفع الملف...</p>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden max-w-xs mx-auto">
                        <div 
                          className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-primary-400 text-sm font-medium">{uploadProgress}%</p>
                    </div>
                  ) : formData.mediaUrl ? (
                    <div className="space-y-3">
                      {formData.textContentType === 'image' && (
                        <img
                          src={`${API_BASE_URL}/uploads/${formData.mediaUrl}`}
                          alt="Preview"
                          className="w-32 h-32 mx-auto rounded-lg object-cover"
                        />
                      )}
                      {formData.textContentType === 'video' && (
                        <video
                          src={`${API_BASE_URL}/uploads/${formData.mediaUrl}`}
                          className="w-48 h-32 mx-auto rounded-lg object-cover"
                          controls
                        />
                      )}
                      {formData.textContentType === 'audio' && (
                        <audio
                          src={`${API_BASE_URL}/uploads/${formData.mediaUrl}`}
                          className="mx-auto"
                          controls
                        />
                      )}
                      <div className="flex items-center justify-center gap-2 text-emerald-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">تم رفع الملف</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData(prev => ({ ...prev, mediaUrl: '' }));
                        }}
                        className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 mx-auto"
                      >
                        <X className="w-4 h-4" />
                        إزالة
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${
                        isDragging ? 'bg-primary-500/20' : 'bg-slate-100'
                      }`}>
                        {formData.textContentType === 'image' && <ImageIcon className={`w-7 h-7 ${isDragging ? 'text-primary-400' : 'text-slate-600'}`} />}
                        {formData.textContentType === 'video' && <Video className={`w-7 h-7 ${isDragging ? 'text-primary-400' : 'text-slate-600'}`} />}
                        {formData.textContentType === 'audio' && <Music className={`w-7 h-7 ${isDragging ? 'text-primary-400' : 'text-slate-600'}`} />}
                      </div>
                      <div>
                        <p className={isDragging ? 'text-primary-400' : 'text-slate-600'}>
                          {isDragging ? 'أفلت الملف هنا' : 'اسحب الملف هنا أو اضغط للاختيار'}
                        </p>
                        <p className="text-slate-500 text-sm mt-1">
                          {formData.textContentType === 'image' && 'PNG, JPG, GIF حتى 5MB'}
                          {formData.textContentType === 'video' && 'MP4, WebM حتى 100MB'}
                          {formData.textContentType === 'audio' && 'MP3, WAV, OGG حتى 50MB'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* إدخال الرابط يدوياً */}
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-px bg-slate-100"></div>
                    <span className="text-slate-500 text-xs">أو أدخل الرابط يدوياً</span>
                    <div className="flex-1 h-px bg-slate-100"></div>
                  </div>
                  <input
                    type="text"
                    value={formData.mediaUrl}
                    onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                    className="input-field text-sm"
                    dir="ltr"
                    placeholder={`/uploads/${formData.textContentType}/file.${formData.textContentType === 'image' ? 'jpg' : formData.textContentType === 'video' ? 'mp4' : 'mp3'}`}
                  />
                </div>
              </div>

              {/* وصف اختياري */}
              <div>
                <label className="block text-slate-600 text-sm mb-2">وصف (اختياري)</label>
                <input
                  type="text"
                  value={formData.textContent}
                  onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                  className="input-field"
                  placeholder="أضف وصفاً للملف..."
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1" disabled={isSubmitting || isUploading}>
              {isSubmitting ? 'جاري الحفظ...' : selectedBlock ? 'تحديث' : 'إضافة'}
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
        title="حذف الكتلة"
        message="هل أنت متأكد من حذف هذه الكتلة؟"
        confirmText="حذف"
        isLoading={isSubmitting}
      />
    </div>
  );
}
