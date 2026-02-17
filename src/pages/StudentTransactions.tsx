import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { API_ENDPOINTS } from '../config/api';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';

interface StudentTransaction {
  id: number;
  studentId: number;
  amount: string | number;
  type?: string;
  status?: 'PENDING' | 'SUCCESS' | 'FAILED';
  description?: string;
  createdAt: string;
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

export default function StudentTransactions() {
  const [transactions, setTransactions] = useState<StudentTransaction[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [studentIdFilter, setStudentIdFilter] = useState<number | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchStudents = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.students);
      const data = response.data.data || response.data || [];
      setStudents(data);
    } catch {
      toast.error('فشل في جلب الطلاب');
    }
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (studentIdFilter) params.append('studentId', studentIdFilter.toString());
      params.append('page', currentPage.toString());
      params.append('limit', limit.toString());

      const response = await api.get(`${API_ENDPOINTS.studentTransactions}?${params.toString()}`);
      
      // معالجة الاستجابة حسب البنية الصحيحة
      if (response.data.data && Array.isArray(response.data.data)) {
        setTransactions(response.data.data);
        if (response.data.meta) {
          setTotalItems(response.data.meta.total || 0);
          setTotalPages(response.data.meta.totalPages || 1);
        } else {
          setTotalItems(response.data.data.length);
          setTotalPages(1);
        }
      } else if (Array.isArray(response.data)) {
        setTransactions(response.data);
        setTotalItems(response.data.length);
        setTotalPages(1);
      } else {
        setTransactions([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch {
      toast.error('فشل في جلب المعاملات');
      setTransactions([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // إعادة تعيين الصفحة عند تغيير الفلاتر
  }, [statusFilter, studentIdFilter, limit]);

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, studentIdFilter, limit]);

  // دالة للحصول على قيمة المبلغ كرقم
  const getAmount = (amount: string | number): number => {
    if (typeof amount === 'number') return amount;
    return parseFloat(amount) || 0;
  };

  const columns = [
    { key: 'id', header: '#' },
    {
      key: 'studentName',
      header: 'الطالب',
      render: (transaction: StudentTransaction) => {
        if (transaction.student?.user) {
          return <span className="text-slate-700">{`${transaction.student.user.firstName} ${transaction.student.user.lastName}`.trim()}</span>;
        }
        const student = students.find((s) => s.id === transaction.studentId);
        return <span className="text-slate-700">{student ? getStudentName(student) : '-'}</span>;
      },
    },
    {
      key: 'amount',
      header: 'المبلغ',
      render: (transaction: StudentTransaction) => {
        const amount = getAmount(transaction.amount);
        const isPositive = amount >= 0;
        return (
          <span className={`font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{amount.toLocaleString()} ر.س
          </span>
        );
      },
    },
    {
      key: 'type',
      header: 'النوع',
      render: (transaction: StudentTransaction) => (
        <span className="text-slate-600 text-sm">
          {transaction.type || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'الحالة',
      render: (transaction: StudentTransaction) => {
        const statusMap: Record<string, { label: string; className: string }> = {
          PENDING: { label: 'قيد الانتظار', className: 'bg-yellow-500/20 text-yellow-400' },
          SUCCESS: { label: 'نجح', className: 'bg-emerald-500/20 text-emerald-400' },
          FAILED: { label: 'فشل', className: 'bg-red-500/20 text-red-400' },
        };
        const status = statusMap[transaction.status || 'PENDING'] || statusMap.PENDING;
        return (
          <span className={`px-3 py-1 rounded-full text-xs ${status.className}`}>
            {status.label}
          </span>
        );
      },
    },
    {
      key: 'description',
      header: 'الوصف',
      render: (transaction: StudentTransaction) => (
        <span className="text-slate-600 line-clamp-1 max-w-xs text-sm">
          {transaction.description || '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'التاريخ',
      render: (transaction: StudentTransaction) => (
        <span className="text-slate-600 text-sm">
          {new Date(transaction.createdAt).toLocaleDateString('ar-SYRIA-SYRIAN-ARABIC', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="معاملات الطلاب"
        description="إدارة جميع معاملات الطلاب المالية"
      />

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div>
          <label className="block text-slate-600 text-sm mb-2">حالة المعاملة</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="">الكل</option>
            <option value="PENDING">قيد الانتظار</option>
            <option value="SUCCESS">نجح</option>
            <option value="FAILED">فشل</option>
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
        data={transactions}
        isLoading={isLoading}
        keyExtractor={(transaction) => transaction.id}
        emptyMessage="لا توجد معاملات"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-slate-600 text-sm">
            عرض {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, totalItems)} من {totalItems} معاملة
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
                        ? 'bg-emerald-500 text-slate-900'
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
    </div>
  );
}

