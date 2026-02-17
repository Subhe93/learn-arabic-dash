import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, CheckCircle, ClipboardList, Blocks } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { API_ENDPOINTS } from '../config/api';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import QuestionForm from '../components/questions/QuestionForm';

interface Question {
  id: number;
  assignmentBlockId: number;
  type: string;
  content: Record<string, unknown>;
  points: number;
  requiresTeacherReview?: boolean;
  createdAt: string;
}

interface AssignmentBlock {
  id: number;
  orderIndex: number;
  assignmentId: number;
}

interface Assignment {
  id: number;
  title: string;
}

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
        <ClipboardList className="w-4 h-4 text-slate-500" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-hidden">
          <div className="p-2 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن واجب..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-9 py-2 text-sm focus:ring-1 focus:ring-primary-500 text-slate-900"
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
                    value === opt.id ? 'bg-primary-500/20 text-primary-500' : 'text-slate-900'
                  }`}
                >
                  <ClipboardList className="w-5 h-5 text-slate-500" />
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

// قائمة منسدلة للكتل مع البحث
interface BlockSelectProps {
  options: AssignmentBlock[];
  value: number | null;
  onChange: (value: number) => void;
  placeholder?: string;
}

function BlockSearchableSelect({ options, value, onChange, placeholder = 'اختر كتلة...' }: BlockSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter(opt =>
    `كتلة ${opt.id} ترتيب ${opt.orderIndex}`.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="input-field cursor-pointer flex items-center justify-between"
      >
        <span className={selectedOption ? 'text-slate-900' : 'text-slate-500'}>
          {selectedOption 
            ? `كتلة #${selectedOption.id} - ترتيب ${selectedOption.orderIndex}` 
            : placeholder}
        </span>
        <Blocks className="w-4 h-4 text-slate-600" />
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
                placeholder="ابحث عن كتلة..."
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
                    value === opt.id ? 'bg-primary-500/20 text-primary-500' : ''
                  }`}
                >
                  <Blocks className="w-5 h-5 text-slate-600" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">كتلة #{opt.id}</div>
                    <div className="text-xs text-slate-500">ترتيب {opt.orderIndex}</div>
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

export default function Questions() {
  const [searchParams] = useSearchParams();
  const blockIdParam = searchParams.get('assignmentBlockId');
  const assignmentIdParam = searchParams.get('assignmentId');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [blocks, setBlocks] = useState<AssignmentBlock[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(
    assignmentIdParam ? parseInt(assignmentIdParam) : null
  );
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(
    blockIdParam ? parseInt(blockIdParam) : null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState<{
    assignmentBlockId: number;
    type: string;
    content: Record<string, unknown>;
    points: number;
    requiresTeacherReview: boolean;
  }>({
    assignmentBlockId: 0,
    type: 'mcq_single',
    content: {},
    points: 1,
    requiresTeacherReview: false,
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
    try {
      const response = await api.get(`${API_ENDPOINTS.assignmentBlocks}?assignmentId=${assignmentId}`);
      const data = response.data.data || response.data || [];
      setBlocks(data);
      if (data.length > 0 && !selectedBlockId) {
        setSelectedBlockId(data[0].id);
      }
    } catch {
      toast.error('فشل في جلب الكتل');
    }
  };

  const fetchQuestions = async (blockId: number) => {
    setIsLoading(true);
    try {
      const response = await api.get(`${API_ENDPOINTS.questions}?assignmentBlockId=${blockId}`);
      setQuestions(response.data.data || response.data || []);
    } catch {
      toast.error('فشل في جلب الأسئلة');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAssignmentId]);

  useEffect(() => {
    if (selectedBlockId) {
      fetchQuestions(selectedBlockId);
    }
  }, [selectedBlockId]);

  const handleOpenModal = (question?: Question) => {
    if (question) {
      setSelectedQuestion(question);
      setFormData({
        assignmentBlockId: question.assignmentBlockId,
        type: question.type,
        content: question.content,
        points: question.points,
        requiresTeacherReview: question.requiresTeacherReview || false,
      });
    } else {
      setSelectedQuestion(null);
      const defaultType = 'mcq_single';
      setFormData({
        assignmentBlockId: selectedBlockId || 0,
        type: defaultType,
        content: getDefaultContent(defaultType),
        points: 1,
        requiresTeacherReview: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleTypeChange = (newType: string) => {
    setFormData({
      ...formData,
      type: newType,
      content: getDefaultContent(newType),
    });
  };

  // رفع الملفات
  const uploadFile = async (file: File, type: 'image' | 'audio' | 'file') => {
    setIsUploading(true);
    setUploadProgress(0);

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    let endpoint = API_ENDPOINTS.upload.file;
    if (type === 'image') {
      endpoint = API_ENDPOINTS.upload.image;
    } else if (type === 'audio') {
      endpoint = API_ENDPOINTS.upload.audio;
    }

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
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'فشل في رفع الملف');
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // التحقق من match_image_text: يجب أن يكون هناك زوجان على الأقل
      if (formData.type === 'match_image_text') {
        const pairs = (formData.content.pairs as Array<{ image: string; text: string }>) || [];
        if (pairs.length < 2) {
          toast.error('يجب إضافة زوجين على الأقل في سؤال وصل الصورة مع النص');
          setIsSubmitting(false);
          return;
        }
        // التحقق من أن كل زوج له صورة ونص
        const incompletePairs = pairs.filter(pair => !pair.image || !pair.text);
        if (incompletePairs.length > 0) {
          toast.error('يجب ملء الصورة والنص لكل زوج');
          setIsSubmitting(false);
          return;
        }
      }

      const payload = {
        assignmentBlockId: formData.assignmentBlockId,
        type: formData.type,
        content: formData.content,
        points: formData.points,
        requiresTeacherReview: formData.requiresTeacherReview,
      };

      if (selectedQuestion) {
        await api.patch(`${API_ENDPOINTS.questions}/${selectedQuestion.id}`, payload, {
          headers: { 'Content-Type': 'application/json' },
        });
        toast.success('تم تحديث السؤال بنجاح');
      } else {
        await api.post(API_ENDPOINTS.questions, payload, {
          headers: { 'Content-Type': 'application/json' },
        });
        toast.success('تم إضافة السؤال بنجاح');
      }

      setIsModalOpen(false);
      if (selectedBlockId) fetchQuestions(selectedBlockId);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedQuestion) return;
    setIsSubmitting(true);

    try {
      await api.delete(`${API_ENDPOINTS.questions}/${selectedQuestion.id}`);
      toast.success('تم حذف السؤال بنجاح');
      setIsDeleteDialogOpen(false);
      if (selectedBlockId) fetchQuestions(selectedBlockId);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'فشل في حذف السؤال');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      mcq_single: 'اختيار الإجابة الصحيحة (إجابة واحدة)',
      mcq_multiple: 'اختيار الإجابات الصحيحة (إجابتان على الأقل)',
      match_image_text: 'وصل صورة مع نص',
      draw_circle_single: 'رسم دائرة حول الإجابة الصحيحة (إجابة واحدة)',
      draw_circle_multiple: 'رسم دائرة حول الإجابات الصحيحة (إجابتان على الأقل)',
      listen_repeat: 'استمع وسجل صوت',
      break_word: 'حلل الكلمة إلى أحرف',
      compose_word: 'ركب الكلمة',
      write_words: 'انسخ الكلمات على ورقة وصورها',
      fill_sentence: 'املأ الفراغ بالكلمة المناسبة',
      order_words: 'رتب الكلمات لتصبح جملة مفيدة',
      select_image_text: 'ربط الصورة مع الكلمة',
      read_question: 'تمرين اقرأ النص',
      free_text: 'سؤال جواب حر (كتابة)',
      free_text_upload: 'سؤال جواب حر (رفع صورة)',
    };
    return types[type] || type;
  };


  const getDefaultContent = (type: string) => {
    const defaults: Record<string, Record<string, unknown>> = {
      mcq_single: {
        text: "ما هو السؤال؟",
        options: [
          { text: "الخيار 1", is_correct: false },
          { text: "الخيار 2", is_correct: true },
          { text: "الخيار 3", is_correct: false }
        ]
      },
      mcq_multiple: {
        text: "ما هو السؤال؟",
        options: [
          { text: "الخيار 1", is_correct: false },
          { text: "الخيار 2", is_correct: true },
          { text: "الخيار 3", is_correct: true }
        ]
      },
      match_image_text: {
        text: "وصل كل صورة مع النص المناسب",
        pairs: [
          { image: '', text: '' },
          { image: '', text: '' }
        ]
      },
      draw_circle_single: {
        text: "ارسم دائرة حول الإجابة الصحيحة",
        options: [
          { text: "أ", is_correct: true },
          { text: "ب", is_correct: false },
          { text: "ج", is_correct: false }
        ]
      },
      draw_circle_multiple: {
        text: "ارسم دائرة حول الإجابات الصحيحة",
        options: [
          { text: "أ", is_correct: true },
          { text: "ب", is_correct: true },
          { text: "ج", is_correct: false }
        ]
      },
      listen_repeat: {
        text: "استمع إلى الكلمة وكررها",
        audioUrl: ""
      },
      break_word: {
        text: "حلل الكلمة إلى أحرف",
        word: "كتاب"
      },
      compose_word: {
        text: "ركب الكلمة من هذه الأحرف",
        letters: ["ك", "ت", "ا", "ب"]
      },
      write_words: {
        text: "انسخ هذه الكلمات على ورقة وصورها وارفعها",
        words: ["كتاب", "قلم", "مدرسة"]
      },
      fill_sentence: {
        text: "يذهب الطالب إلى .... كل يوم",
        options: [
          { text: "المدرسة", is_correct: true },
          { text: "الجبل", is_correct: false },
          { text: "الحديقة", is_correct: false }
        ]
      },
      order_words: {
        text: "رتب الكلمات لتصبح جملة مفيدة",
        words: ["الطالب", "يذهب", "إلى", "المدرسة"],
        correctOrder: ["الطالب", "يذهب", "إلى", "المدرسة"]
      },
      select_image_text: {
        text: "اختر النص المناسب لكل صورة",
        items: [],
        options: []
      },
      read_question: {
        text: "اقرأ النص التالي",
        imageUrl: ""
      },
      free_text: {
        text: "اكتب إجابتك هنا",
        placeholder: "اكتب إجابتك..."
      },
      free_text_upload: {
        text: "اكتب النص على ورقة وتصويره وارفعها"
      }
    };
    return defaults[type] || { text: "السؤال" };
  };

  const columns = [
    { key: 'id', header: '#' },
    {
      key: 'type',
      header: 'النوع',
      render: (question: Question) => (
        <span className="px-3 py-1 rounded-full text-xs bg-primary-500/20 text-primary-500">
          {getTypeLabel(question.type)}
        </span>
      ),
    },
    {
      key: 'content',
      header: 'السؤال',
      render: (question: Question) => (
        <span className="text-slate-600 line-clamp-1 max-w-xs">
          {(question.content as { text?: string })?.text || '-'}
        </span>
      ),
    },
    {
      key: 'points',
      header: 'النقاط',
      render: (question: Question) => (
        <span className="px-3 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
          {question.points}
        </span>
      ),
    },
    {
      key: 'requiresTeacherReview',
      header: 'يحتاج مراجعة',
      render: (question: Question) => (
        <span className={`px-3 py-1 rounded-full text-xs ${
          question.requiresTeacherReview
            ? 'bg-amber-500/20 text-amber-400'
            : 'bg-slate-500/20 text-slate-600'
        }`}>
          {question.requiresTeacherReview ? 'نعم' : 'لا'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (question: Question) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(question)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedQuestion(question);
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
        title="الأسئلة"
        description="إدارة أسئلة كتل الواجبات"
        action={
          <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة سؤال
          </button>
        }
      />

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Assignment Filter */}
        <div>
          <label className="block text-slate-600 text-sm mb-2">اختر الواجب</label>
          <AssignmentSearchableSelect
            options={assignments}
            value={selectedAssignmentId || 0}
            onChange={(value) => setSelectedAssignmentId(value)}
            placeholder="اختر واجب..."
          />
        </div>

        {/* Block Filter */}
        {selectedAssignmentId && (
          <div>
            <label className="block text-slate-600 text-sm mb-2">اختر الكتلة</label>
            <BlockSearchableSelect
              options={blocks}
              value={selectedBlockId}
              onChange={(value) => setSelectedBlockId(value)}
              placeholder="اختر كتلة..."
            />
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={questions}
        isLoading={isLoading}
        keyExtractor={(question) => question.id}
        emptyMessage="لا توجد أسئلة في هذه الكتلة"
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-sm mb-2">الكتلة</label>
              <BlockSearchableSelect
                options={blocks}
                value={formData.assignmentBlockId || null}
                onChange={(value) => setFormData({ ...formData, assignmentBlockId: value })}
                placeholder="اختر الكتلة..."
              />
            </div>
            <div>
              <label className="block text-slate-600 text-sm mb-2">نوع السؤال</label>
              <select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="input-field"
              >
                <option value="mcq_single">اختيار الإجابة الصحيحة (إجابة واحدة)</option>
                <option value="mcq_multiple">اختيار الإجابات الصحيحة (إجابتان على الأقل)</option>
                <option value="match_image_text">وصل صورة مع نص</option>
                <option value="draw_circle_single">رسم دائرة حول الإجابة الصحيحة (إجابة واحدة)</option>
                <option value="draw_circle_multiple">رسم دائرة حول الإجابات الصحيحة (إجابتان على الأقل)</option>
                <option value="listen_repeat">استمع وسجل صوت</option>
                <option value="break_word">حلل الكلمة إلى أحرف</option>
                <option value="compose_word">ركب الكلمة</option>
                <option value="write_words">انسخ الكلمات على ورقة وصورها</option>
                <option value="fill_sentence">املأ الفراغ بالكلمة المناسبة</option>
                <option value="order_words">رتب الكلمات لتصبح جملة مفيدة</option>
                <option value="select_image_text">ربط الصورة مع الكلمة</option>
                <option value="read_question">تمرين اقرأ النص</option>
                <option value="free_text">سؤال جواب حر (كتابة)</option>
                <option value="free_text_upload">سؤال جواب حر (رفع صورة)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-sm mb-2">النقاط</label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 1 })}
                className="input-field max-w-[150px]"
                min={1}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requiresTeacherReview}
                  onChange={(e) => setFormData({ ...formData, requiresTeacherReview: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 bg-white border border-slate-200 text-primary-500 focus:ring-primary-500 focus:ring-offset-slate-900"
                />
                <span className="text-slate-600 text-sm">يحتاج مراجعة من المدرس</span>
              </label>
            </div>
          </div>

          {/* محتوى السؤال الديناميكي */}
          <div className="space-y-4">
            <label className="block text-slate-600 text-sm mb-2">محتوى السؤال</label>
            <QuestionForm
              type={formData.type}
              content={formData.content}
              onChange={(content) => setFormData(prev => ({ ...prev, content }))}
              onUpload={uploadFile}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : selectedQuestion ? 'تحديث' : 'إضافة'}
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
        title="حذف السؤال"
        message="هل أنت متأكد من حذف هذا السؤال؟"
        confirmText="حذف"
        isLoading={isSubmitting}
      />
    </div>
  );
}

