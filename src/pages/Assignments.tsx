import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Blocks, Upload, X, CheckCircle, Image, Search, BookOpen, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import RichTextEditor from '../components/ui/RichTextEditor';

interface Assignment {
  id: number;
  targetType: string;
  targetId: number;
  title: string;
  totalPoints: number;
  successPoints: number;
  description: string;
  image: string;
  date: string;
  createdAt: string;
}

interface Level {
  id: number;
  name: string;
  description?: string;
}

interface Lesson {
  id: number;
  name: string;
  levelId: number;
  level?: Level;
}

// قائمة منسدلة قابلة للبحث للدروس
interface LessonSelectProps {
  options: Lesson[];
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
}

function LessonSearchableSelect({ options, value, onChange, placeholder = 'اختر درس...' }: LessonSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter(opt =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="input-field cursor-pointer flex items-center justify-between"
      >
        <span className={selectedOption ? 'text-slate-900' : 'text-slate-500'}>
          {selectedOption ? `${selectedOption.name} (#${selectedOption.id})` : placeholder}
        </span>
        <BookOpen className="w-4 h-4 text-slate-600" />
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
                placeholder="ابحث عن درس..."
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
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{opt.name}</div>
                    <div className="text-xs text-slate-500">
                      #{opt.id} {opt.level && `• ${opt.level.name}`}
                    </div>
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

// قائمة منسدلة قابلة للبحث للمستويات
interface LevelSelectProps {
  options: Level[];
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
}

function LevelSearchableSelect({ options, value, onChange, placeholder = 'اختر مستوى...' }: LevelSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter(opt =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="input-field cursor-pointer flex items-center justify-between"
      >
        <span className={selectedOption ? 'text-slate-900' : 'text-slate-500'}>
          {selectedOption ? `${selectedOption.name} (#${selectedOption.id})` : placeholder}
        </span>
        <GraduationCap className="w-4 h-4 text-slate-600" />
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
                placeholder="ابحث عن مستوى..."
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
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{opt.name}</div>
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

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // حالة رفع الصورة
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    targetType: 'Lesson',
    targetId: 0,
    title: '',
    totalPoints: 10,
    successPoints: 6,
    description: '',
    image: '',
    date: '',
  });

  // جلب المستويات والدروس
  const fetchLevelsAndLessons = async () => {
    try {
      // جلب المستويات
      const levelsRes = await api.get(API_ENDPOINTS.levels);
      const levelsData = levelsRes.data.data || levelsRes.data || [];
      setLevels(levelsData);

      // جلب الدروس لكل مستوى
      let allLessons: Lesson[] = [];
      for (const level of levelsData) {
        try {
          const lessonsRes = await api.get(API_ENDPOINTS.lessonsForLevel(level.id));
          const lessonsData = lessonsRes.data.data || lessonsRes.data || [];
          allLessons = [...allLessons, ...lessonsData.map((l: Lesson) => ({ ...l, level }))];
        } catch {
          // تجاهل الأخطاء للمستويات الفارغة
        }
      }
      setLessons(allLessons);
    } catch {
      toast.error('فشل في جلب المستويات والدروس');
    }
  };

  // دالة رفع الصورة
  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة صالح');
      return;
    }

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
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadImage(files[0]);
    }
  };

  // معالجة اختيار الملف
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadImage(files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.assignments);
      setAssignments(response.data.data || response.data || []);
    } catch {
      toast.error('فشل في جلب البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchLevelsAndLessons();
  }, []);

  // الحصول على اسم الهدف
  const getTargetName = (targetType: string, targetId: number) => {
    if (targetType === 'Lesson') {
      const lesson = lessons.find(l => l.id === targetId);
      return lesson ? lesson.name : `درس #${targetId}`;
    } else {
      const level = levels.find(l => l.id === targetId);
      return level ? level.name : `مستوى #${targetId}`;
    }
  };

  const handleOpenModal = (assignment?: Assignment) => {
    // إعادة تعيين حالة الرفع
    setIsUploading(false);
    setUploadProgress(0);
    setIsDragging(false);

    if (assignment) {
      setSelectedAssignment(assignment);
      setFormData({
        targetType: assignment.targetType,
        targetId: assignment.targetId,
        title: assignment.title,
        totalPoints: assignment.totalPoints,
        successPoints: assignment.successPoints,
        description: assignment.description,
        image: assignment.image || '',
        date: assignment.date ? assignment.date.slice(0, 10) : '',
      });
    } else {
      setSelectedAssignment(null);
      const defaultDate = new Date();
      defaultDate.setMonth(defaultDate.getMonth() + 1);
      const dateStr = defaultDate.toISOString().slice(0, 10);
      
      setFormData({
        targetType: 'Lesson',
        targetId: lessons.length > 0 ? lessons[0].id : 0,
        title: '',
        totalPoints: 10,
        successPoints: 6,
        description: '',
        image: '',
        date: dateStr,
      });
    }
    setIsModalOpen(true);
  };

  // عند تغيير نوع الهدف
  const handleTargetTypeChange = (newType: string) => {
    if (newType === 'Lesson') {
      setFormData({
        ...formData,
        targetType: newType,
        targetId: lessons.length > 0 ? lessons[0].id : 0,
      });
    } else {
      setFormData({
        ...formData,
        targetType: newType,
        targetId: levels.length > 0 ? levels[0].id : 0,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.targetId) {
      toast.error('يرجى اختيار الهدف');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        targetType: formData.targetType,
        targetId: formData.targetId,
        title: formData.title,
        totalPoints: formData.totalPoints,
        successPoints: formData.successPoints,
        description: formData.description,
        image: formData.image,
      };
      
      if (formData.date) {
        payload.date = `${formData.date}T23:59:59.999Z`;
      }

      if (selectedAssignment) {
        await api.patch(`${API_ENDPOINTS.assignments}/${selectedAssignment.id}`, payload, {
          headers: { 'Content-Type': 'application/json' },
        });
        toast.success('تم تحديث الواجب بنجاح');
      } else {
        await api.post(API_ENDPOINTS.assignments, payload, {
          headers: { 'Content-Type': 'application/json' },
        });
        toast.success('تم إضافة الواجب بنجاح');
      }

      setIsModalOpen(false);
      fetchAssignments();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAssignment) return;
    setIsSubmitting(true);

    try {
      await api.delete(`${API_ENDPOINTS.assignments}/${selectedAssignment.id}`);
      toast.success('تم حذف الواجب بنجاح');
      setIsDeleteDialogOpen(false);
      fetchAssignments();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'فشل في حذف الواجب');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { key: 'id', header: '#' },
    {
      key: 'image',
      header: 'الصورة',
      render: (assignment: Assignment) => (
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-slate-200">
          {assignment.image ? (
            <img
              src={`${API_BASE_URL}/uploads/${assignment.image}`}
              alt={assignment.title}
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
    { key: 'title', header: 'العنوان' },
    {
      key: 'target',
      header: 'الهدف',
      render: (assignment: Assignment) => (
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs ${
            assignment.targetType === 'Lesson' 
              ? 'bg-blue-500/20 text-blue-400' 
              : 'bg-purple-500/20 text-purple-400'
          }`}>
            {assignment.targetType === 'Lesson' ? 'درس' : 'مستوى'}
          </span>
          <span className="text-slate-600 text-sm">
            {getTargetName(assignment.targetType, assignment.targetId)}
          </span>
        </div>
      ),
    },
    {
      key: 'points',
      header: 'النقاط',
      render: (assignment: Assignment) => (
        <span className="text-slate-600">
          {assignment.successPoints} / {assignment.totalPoints}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'التاريخ',
      render: (assignment: Assignment) => (
        <span className="text-slate-600">
          {assignment.date ? new Date(assignment.date).toLocaleDateString('ar-SYRIA-SYRIAN-ARABIC') : '-'}
        </span>
      ),
    },
    {
      key: 'blocks',
      header: 'الكتل',
      render: (assignment: Assignment) => (
        <button
          onClick={() => navigate(`/assignment-blocks?assignmentId=${assignment.id}`)}
          className="p-2 cursor-pointer rounded-lg text-slate-600 hover:text-primary-400 hover:bg-primary-500/10 transition-colors"
          title="إدارة الكتل"
        >
          <Blocks className="w-4 h-4" />
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (assignment: Assignment) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(assignment)}
            className="p-2 cursor-pointer rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedAssignment(assignment);
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
        title="الواجبات"
        description="إدارة واجبات الدروس والمستويات"
        action={
          <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة واجب
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={assignments}
        isLoading={isLoading}
        keyExtractor={(assignment) => assignment.id}
        emptyMessage="لا توجد واجبات"
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedAssignment ? 'تعديل الواجب' : 'إضافة واجب جديد'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-600 text-sm mb-2">عنوان الواجب</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              required
            />
          </div>

          {/* نوع الهدف والهدف */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-sm mb-2">نوع الهدف</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleTargetTypeChange('Lesson')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                    formData.targetType === 'Lesson'
                      ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                      : 'border-slate-600 text-slate-600 hover:border-slate-500'
                  }`}
                >
                  <BookOpen className="w-5 h-5" />
                  <span>درس</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTargetTypeChange('Level')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                    formData.targetType === 'Level'
                      ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                      : 'border-slate-600 text-slate-600 hover:border-slate-500'
                  }`}
                >
                  <GraduationCap className="w-5 h-5" />
                  <span>مستوى</span>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-slate-600 text-sm mb-2">
                {formData.targetType === 'Lesson' ? 'الدرس' : 'المستوى'} *
              </label>
              {formData.targetType === 'Lesson' ? (
                <LessonSearchableSelect
                  options={lessons}
                  value={formData.targetId}
                  onChange={(value) => setFormData({ ...formData, targetId: value })}
                  placeholder="اختر درس..."
                />
              ) : (
                <LevelSearchableSelect
                  options={levels}
                  value={formData.targetId}
                  onChange={(value) => setFormData({ ...formData, targetId: value })}
                  placeholder="اختر مستوى..."
                />
              )}
            </div>
          </div>

          <RichTextEditor
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            label="الوصف"
            placeholder="اكتب وصف الواجب هنا..."
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-sm mb-2">إجمالي النقاط</label>
              <input
                type="number"
                value={formData.totalPoints}
                onChange={(e) => setFormData({ ...formData, totalPoints: parseInt(e.target.value) || 0 })}
                className="input-field"
                min={0}
              />
            </div>
            <div>
              <label className="block text-slate-600 text-sm mb-2">نقاط النجاح</label>
              <input
                type="number"
                value={formData.successPoints}
                onChange={(e) => setFormData({ ...formData, successPoints: parseInt(e.target.value) || 0 })}
                className="input-field"
                min={0}
              />
            </div>
          </div>

          {/* منطقة رفع الصورة */}
          <div>
            <label className="block text-slate-600 text-sm mb-2">الصورة</label>
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer
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
                <div className="space-y-3">
                  <div className="relative w-20 h-20 mx-auto rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={`${API_BASE_URL}/uploads/${formData.image}`}
                      alt="صورة الواجب"
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

            {/* حقل الرابط اليدوي */}
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
                placeholder="/images/assignment.jpg"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 text-sm mb-2">تاريخ الاستحقاق <span className="text-red-400">*</span></label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input-field max-w-xs"
              dir="ltr"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1" disabled={isSubmitting || isUploading}>
              {isSubmitting ? 'جاري الحفظ...' : selectedAssignment ? 'تحديث' : 'إضافة'}
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
        title="حذف الواجب"
        message={`هل أنت متأكد من حذف الواجب "${selectedAssignment?.title}"؟`}
        confirmText="حذف"
        isLoading={isSubmitting}
      />
    </div>
  );
}
