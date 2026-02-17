import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';

interface AnswerReview {
  id: number;
  studentAnswerId: number;
  studentId: number;
  questionId: number;
  assignmentId: number;
  answer: Record<string, unknown>;
  reviewStatus?: 'pending' | 'reviewed';
  isCorrect?: boolean;
  points?: number;
  maxPoints?: number;
  student?: {
    id: number;
    userId: number;
    user?: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  question?: {
    id: number;
    type: string;
    content: Record<string, unknown>;
    points: number;
  };
  assignment?: {
    id: number;
    title: string;
  };
}

interface Student {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Assignment {
  id: number;
  title: string;
}

// دالة مساعدة للحصول على اسم الطالب
const getStudentName = (student: Student) => {
  const firstName = student.user?.firstName || student.firstName || '';
  const lastName = student.user?.lastName || student.lastName || '';
  return `${firstName} ${lastName}`.trim() || 'غير محدد';
};

// Searchable Select للطلاب
function StudentSearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'اختر طالب...',
}: {
  options: Student[];
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = options.filter((student) => {
    const name = getStudentName(student).toLowerCase();
    const email = (student.user?.email || student.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  const selectedStudent = options.find((s) => s.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input-field w-full text-right flex items-center justify-between"
      >
        <span className={value ? 'text-slate-700' : 'text-slate-500'}>
          {selectedStudent ? getStudentName(selectedStudent) : placeholder}
        </span>
        <span className={`text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن طالب..."
                className="input-field pr-9 text-sm"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-slate-600 text-sm">لا توجد نتائج</div>
            ) : (
              filteredOptions.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => {
                    onChange(student.id);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className={`w-full text-right p-3 hover:bg-slate-100 transition-colors ${
                    value === student.id ? 'bg-slate-100' : ''
                  }`}
                >
                  <div className="text-slate-700">{getStudentName(student)}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    {student.user?.email || student.email}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// Searchable Select للواجبات
function AssignmentSearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'اختر واجب...',
}: {
  options: Assignment[];
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = options.filter((assignment) => {
    const title = assignment.title.toLowerCase();
    const query = searchQuery.toLowerCase();
    return title.includes(query);
  });

  const selectedAssignment = options.find((a) => a.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input-field w-full text-right flex items-center justify-between"
      >
        <span className={value ? 'text-slate-700' : 'text-slate-500'}>
          {selectedAssignment ? selectedAssignment.title : placeholder}
        </span>
        <span className={`text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن واجب..."
                className="input-field pr-9 text-sm"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-slate-600 text-sm">لا توجد نتائج</div>
            ) : (
              filteredOptions.map((assignment) => (
                <button
                  key={assignment.id}
                  type="button"
                  onClick={() => {
                    onChange(assignment.id);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className={`w-full text-right p-3 hover:bg-slate-100 transition-colors ${
                    value === assignment.id ? 'bg-slate-100' : ''
                  }`}
                >
                  <div className="text-slate-700">{assignment.title}</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default function AnswerReviews() {
  const [reviews, setReviews] = useState<AnswerReview[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<AnswerReview | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('pending');
  const [studentIdFilter, setStudentIdFilter] = useState<number | null>(null);
  const [assignmentIdFilter, setAssignmentIdFilter] = useState<number | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Review form
  const [reviewForm, setReviewForm] = useState({
    isCorrect: true,
    points: 0,
  });

  const fetchStudents = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.students);
      const data = response.data.data || response.data || [];
      setStudents(data);
    } catch {
      toast.error('فشل في جلب الطلاب');
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.assignments);
      const data = response.data.data || response.data || [];
      setAssignments(data);
    } catch {
      toast.error('فشل في جلب الواجبات');
    }
  };

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (reviewStatusFilter) params.append('reviewStatus', reviewStatusFilter);
      if (studentIdFilter) params.append('studentId', studentIdFilter.toString());
      if (assignmentIdFilter) params.append('assignmentId', assignmentIdFilter.toString());
      params.append('page', currentPage.toString());
      params.append('limit', limit.toString());

      const response = await api.get(`${API_ENDPOINTS.answerReviews}?${params.toString()}`);
      
      // معالجة الاستجابة حسب البنية الصحيحة
      if (response.data.data && Array.isArray(response.data.data)) {
        setReviews(response.data.data);
        if (response.data.meta) {
          setTotalItems(response.data.meta.total || 0);
          setTotalPages(response.data.meta.totalPages || 1);
        } else {
          setTotalItems(response.data.data.length);
          setTotalPages(1);
        }
      } else if (Array.isArray(response.data)) {
        setReviews(response.data);
        setTotalItems(response.data.length);
        setTotalPages(1);
      } else {
        setReviews([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch {
      toast.error('فشل في جلب الإجابات');
      setReviews([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchAssignments();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // إعادة تعيين الصفحة عند تغيير الفلاتر
  }, [reviewStatusFilter, studentIdFilter, assignmentIdFilter, limit]);

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, reviewStatusFilter, studentIdFilter, assignmentIdFilter, limit]);

  const handleOpenReviewModal = (review: AnswerReview) => {
    setSelectedReview(review);
    setReviewForm({
      isCorrect: review.isCorrect ?? true,
      points: review.points ?? review.maxPoints ?? 0,
    });
    setIsModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;
    setIsSubmitting(true);

    try {
      const payload = {
        studentAnswerId: selectedReview.studentAnswerId,
        isCorrect: reviewForm.isCorrect,
        points: reviewForm.points,
      };

      await api.post(API_ENDPOINTS.answerReviewsReview, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      toast.success('تم مراجعة الإجابة بنجاح');
      setIsModalOpen(false);
      fetchReviews();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setIsSubmitting(false);
    }
  };

  // دالة لعرض الإجابة حسب نوع السؤال
  const renderAnswer = (review: AnswerReview) => {
    const answer = review.answer;
    if (!answer) return <span className="text-slate-600">-</span>;

    // إجابات نصية
    if (answer.text) {
      return <span className="text-slate-700">{String(answer.text)}</span>;
    }

    // إجابات مع خيارات
    if (answer.selectedOptions && Array.isArray(answer.selectedOptions)) {
      return (
        <span className="text-slate-700">
          {answer.selectedOptions.join(', ')}
        </span>
      );
    }

    // إجابات مع صور
    if (answer.imageUrl) {
      const imageUrl = String(answer.imageUrl);
      const fullUrl = imageUrl.startsWith('http') 
        ? imageUrl 
        : `${API_BASE_URL}/${imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl}`;
      return (
        <img
          src={fullUrl}
          alt="إجابة"
          className="w-20 h-20 object-cover rounded-lg"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      );
    }

    // إجابات مع صوت
    if (answer.audioUrl) {
      const audioUrl = String(answer.audioUrl);
      const fullUrl = audioUrl.startsWith('http')
        ? audioUrl
        : `${API_BASE_URL}/${audioUrl.startsWith('/') ? audioUrl.slice(1) : audioUrl}`;
      return (
        <audio controls className="w-full max-w-xs">
          <source src={fullUrl} type="audio/mpeg" />
        </audio>
      );
    }

    // إجابات مع matches (ربط صورة مع نص)
    if (answer.matches && Array.isArray(answer.matches)) {
      return (
        <div className="text-slate-700 text-sm">
          {answer.matches.length} تطابق
        </div>
      );
    }

    // إجابات مع كلمات مرتبة
    if (answer.orderedWords && Array.isArray(answer.orderedWords)) {
      return (
        <span className="text-slate-700">
          {answer.orderedWords.join(' ')}
        </span>
      );
    }

    // إجابات مع حروف
    if (answer.letters && Array.isArray(answer.letters)) {
      return (
        <span className="text-slate-700">
          {answer.letters.join(' ')}
        </span>
      );
    }

    return <span className="text-slate-600">-</span>;
  };

  const columns = [
    { key: 'id', header: '#' },
    {
      key: 'studentName',
      header: 'الطالب',
      render: (review: AnswerReview) => {
        if (review.student?.user) {
          return <span className="text-slate-700">{`${review.student.user.firstName} ${review.student.user.lastName}`.trim()}</span>;
        }
        const student = students.find((s) => s.id === review.studentId);
        return <span className="text-slate-700">{student ? getStudentName(student) : '-'}</span>;
      },
    },
    {
      key: 'assignment',
      header: 'الواجب',
      render: (review: AnswerReview) => {
        if (review.assignment) {
          return <span className="text-slate-700">{review.assignment.title}</span>;
        }
        const assignment = assignments.find((a) => a.id === review.assignmentId);
        return <span className="text-slate-700">{assignment ? assignment.title : '-'}</span>;
      },
    },
    {
      key: 'questionType',
      header: 'نوع السؤال',
      render: (review: AnswerReview) => (
        <span className="text-slate-600 text-sm">
          {review.question?.type || '-'}
        </span>
      ),
    },
    {
      key: 'answer',
      header: 'الإجابة',
      render: (review: AnswerReview) => (
        <div className="max-w-xs">
          {renderAnswer(review)}
        </div>
      ),
    },
    {
      key: 'reviewStatus',
      header: 'حالة المراجعة',
      render: (review: AnswerReview) => {
        const isPending = review.reviewStatus === 'pending' || !review.reviewStatus;
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs ${
              isPending
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {isPending ? 'قيد المراجعة' : 'تمت المراجعة'}
          </span>
        );
      },
    },
    {
      key: 'points',
      header: 'النقاط',
      render: (review: AnswerReview) => {
        if (review.reviewStatus === 'reviewed' && review.points !== undefined) {
          return (
            <span className="text-slate-700">
              {review.points} / {review.maxPoints || review.question?.points || 0}
            </span>
          );
        }
        return <span className="text-slate-600">-</span>;
      },
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (review: AnswerReview) => {
        const isPending = review.reviewStatus === 'pending' || !review.reviewStatus;
        if (!isPending) return <span className="text-slate-500 text-sm">تمت المراجعة</span>;
        
        return (
          <button
            onClick={() => handleOpenReviewModal(review)}
            className="p-2 rounded-lg text-slate-600 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            title="مراجعة الإجابة"
          >
            <Eye className="w-4 h-4" />
          </button>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="مراجعة الإجابات"
        description="مراجعة إجابات الطلاب التي تحتاج مراجعة من المعلم"
      />

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div>
          <label className="block text-slate-600 text-sm mb-2">حالة المراجعة</label>
          <select
            value={reviewStatusFilter}
            onChange={(e) => setReviewStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">الكل</option>
            <option value="pending">قيد المراجعة</option>
            <option value="reviewed">تمت المراجعة</option>
          </select>
        </div>
        <div>
          <label className="block text-slate-600 text-sm mb-2">الطالب</label>
          <StudentSearchableSelect
            options={students}
            value={studentIdFilter || 0}
            onChange={(value) => setStudentIdFilter(value || null)}
            placeholder="اختر طالب..."
          />
        </div>
        <div>
          <label className="block text-slate-600 text-sm mb-2">الواجب</label>
          <AssignmentSearchableSelect
            options={assignments}
            value={assignmentIdFilter || 0}
            onChange={(value) => setAssignmentIdFilter(value || null)}
            placeholder="اختر واجب..."
          />
        </div>
        <div>
          <label className="block text-slate-600 text-sm mb-2">الصفحة</label>
          <input
            type="number"
            value={currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value) || 1;
              setCurrentPage(Math.max(1, Math.min(page, totalPages || 1)));
            }}
            className="input-field"
            min={1}
            max={totalPages || 1}
          />
        </div>
        <div>
          <label className="block text-slate-600 text-sm mb-2">عدد العناصر</label>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value));
              setCurrentPage(1);
            }}
            className="input-field"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={reviews}
        isLoading={isLoading}
        keyExtractor={(review) => review.id}
        emptyMessage="لا توجد إجابات للمراجعة"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-slate-600 text-sm">
            عرض {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, totalItems)} من {totalItems} إجابة
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      currentPage === pageNum
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="مراجعة الإجابة"
        size="lg"
        showFullscreen={true}
      >
        {selectedReview && (
          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* عرض معلومات السؤال والإجابة */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-slate-600 text-sm mb-1">الطالب</label>
                <p className="text-slate-700">
                  {selectedReview.student?.user 
                    ? `${selectedReview.student.user.firstName} ${selectedReview.student.user.lastName}`
                    : '-'}
                </p>
              </div>
              <div>
                <label className="block text-slate-600 text-sm mb-1">الواجب</label>
                <p className="text-slate-700">
                  {selectedReview.assignment?.title || '-'}
                </p>
              </div>
              <div>
                <label className="block text-slate-600 text-sm mb-1">نوع السؤال</label>
                <p className="text-slate-700">
                  {selectedReview.question?.type || '-'}
                </p>
              </div>
              <div>
                <label className="block text-slate-600 text-sm mb-1">الإجابة</label>
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  {renderAnswer(selectedReview)}
                </div>
              </div>
              <div>
                <label className="block text-slate-600 text-sm mb-1">النقاط القصوى</label>
                <p className="text-slate-700">
                  {selectedReview.maxPoints || selectedReview.question?.points || 0} نقطة
                </p>
              </div>
            </div>

            {/* نموذج المراجعة */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isCorrect"
                  checked={reviewForm.isCorrect}
                  onChange={(e) => setReviewForm({ ...reviewForm, isCorrect: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-600 bg-white border border-slate-200 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                />
                <label htmlFor="isCorrect" className="text-slate-600 cursor-pointer">
                  الإجابة صحيحة
                </label>
              </div>

              <div>
                <label className="block text-slate-600 text-sm mb-2">النقاط</label>
                <input
                  type="number"
                  value={reviewForm.points}
                  onChange={(e) => setReviewForm({ ...reviewForm, points: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                  min={0}
                  max={selectedReview.maxPoints || selectedReview.question?.points || 0}
                  step="0.1"
                  required
                />
                <p className="text-slate-500 text-xs mt-1">
                  الحد الأقصى: {selectedReview.maxPoints || selectedReview.question?.points || 0} نقطة
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'جاري الحفظ...' : 'حفظ المراجعة'}
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
        )}
      </Modal>
    </div>
  );
}

