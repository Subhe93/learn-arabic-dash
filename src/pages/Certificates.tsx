import { useState, useEffect } from 'react';
import { Plus, Award, Calendar, Search, CheckCircle, GraduationCap, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { API_ENDPOINTS } from '../config/api';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';

interface Level {
  id: number;
  name: string;
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

// دالة للحصول على بيانات الطالب
const getStudentInfo = (student: Student) => ({
  firstName: student.user?.firstName || student.firstName || '',
  lastName: student.user?.lastName || student.lastName || '',
  email: student.user?.email || student.email || '',
});

interface Certificate {
  id: number;
  studentId: number;
  levelId: number;
  certificateUrl?: string;
  issuedAt: string;
  studentName?: string;
  levelName?: string;
  student?: {
    id: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  level?: Level;
}

// دالة للحصول على اسم الطالب من الشهادة
const getCertStudentInfo = (cert: Certificate) => {
  if (cert.studentName) {
    return { name: cert.studentName, email: '' };
  }
  if (cert.student) {
    const info = getStudentInfo(cert.student as Student);
    return { name: `${info.firstName} ${info.lastName}`, email: info.email };
  }
  return { name: '-', email: '' };
};

// دالة للحصول على اسم المستوى من الشهادة
const getCertLevelName = (cert: Certificate) => {
  return cert.levelName || cert.level?.name || '-';
};

// قائمة منسدلة قابلة للبحث للطلاب
interface StudentSelectProps {
  options: Student[];
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
}

function StudentSearchableSelect({ options, value, onChange, placeholder = 'اختر طالب...' }: StudentSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter(opt => {
    const info = getStudentInfo(opt);
    const fullName = `${info.firstName} ${info.lastName}`.toLowerCase();
    return fullName.includes(search.toLowerCase()) || info.email.toLowerCase().includes(search.toLowerCase());
  });

  const selectedOption = options.find(opt => opt.id === value);
  const selectedInfo = selectedOption ? getStudentInfo(selectedOption) : null;

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="input-field cursor-pointer flex items-center justify-between"
      >
        <span className={selectedOption ? 'text-slate-900' : 'text-slate-500'}>
          {selectedInfo ? `${selectedInfo.firstName} ${selectedInfo.lastName}` : placeholder}
        </span>
        <User className="w-4 h-4 text-slate-600" />
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
                placeholder="ابحث بالاسم أو الإيميل..."
                className="w-full bg-slate-100 border-none rounded-lg pr-9 py-2 text-sm focus:ring-1 focus:ring-primary-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-slate-500 text-sm">لا توجد نتائج</div>
            ) : (
              filteredOptions.map((opt) => {
                const info = getStudentInfo(opt);
                return (
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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-slate-900 text-sm font-bold">
                      {info.firstName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="font-medium">{info.firstName} {info.lastName}</div>
                      <div className="text-xs text-slate-500">{info.email}</div>
                    </div>
                    {value === opt.id && <CheckCircle className="w-4 h-4 mr-auto" />}
                  </div>
                );
              })
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
          {selectedOption ? selectedOption.name : placeholder}
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
                placeholder="ابحث..."
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
                  <GraduationCap className="w-5 h-5 text-slate-600" />
                  <span className="font-medium">{opt.name}</span>
                  {value === opt.id && <CheckCircle className="w-4 h-4 mr-auto" />}
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

export default function Certificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([]);

  const [formData, setFormData] = useState({
    studentId: 0,
    levelId: 0,
  });

  const fetchCertificates = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.certificates);
      const data = response.data.data || response.data || [];
      setCertificates(data);
      setFilteredCertificates(data);
    } catch {
      toast.error('فشل في جلب الشهادات');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.students);
      setStudents(response.data.data || response.data || []);
    } catch {
      // silent
    }
  };

  const fetchLevels = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.levels);
      setLevels(response.data.data || response.data || []);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchCertificates();
    fetchStudents();
    fetchLevels();
  }, []);

  // تصفية الشهادات حسب البحث
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCertificates(certificates);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = certificates.filter(cert => {
      const studentInfo = getCertStudentInfo(cert);
      const levelName = getCertLevelName(cert).toLowerCase();
      return studentInfo.name.toLowerCase().includes(query) || levelName.includes(query);
    });
    setFilteredCertificates(filtered);
  }, [searchQuery, certificates]);

  const handleOpenModal = () => {
    setFormData({ studentId: 0, levelId: 0 });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.levelId) {
      toast.error('يرجى اختيار الطالب والمستوى');
      return;
    }
    setIsSubmitting(true);

    try {
      const params = new URLSearchParams();
      params.append('studentId', formData.studentId.toString());
      params.append('levelId', formData.levelId.toString());

      await api.post(API_ENDPOINTS.certificatesGenerate, params);
      toast.success('تم إنشاء الشهادة بنجاح');
      setIsModalOpen(false);
      fetchCertificates();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; details?: { message?: string | string[] } } } };
      // استخراج رسالة الخطأ من details أو من message مباشرة
      let errorMessage = 'حدث خطأ';
      const details = err.response?.data?.details;
      if (details?.message) {
        errorMessage = Array.isArray(details.message) ? details.message[0] : details.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { key: 'id', header: '#' },
    {
      key: 'student',
      header: 'الطالب',
      render: (cert: Certificate) => {
        const studentInfo = getCertStudentInfo(cert);
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-slate-900 font-bold">
              {studentInfo.name.charAt(0) || '?'}
            </div>
            <div>
              <span className="font-medium block">{studentInfo.name}</span>
              {studentInfo.email && <span className="text-xs text-slate-500">{studentInfo.email}</span>}
            </div>
          </div>
        );
      },
    },
    {
      key: 'level',
      header: 'المستوى',
      render: (cert: Certificate) => (
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-primary-400" />
          <span>{getCertLevelName(cert)}</span>
        </div>
      ),
    },
    {
      key: 'issuedAt',
      header: 'تاريخ الإصدار',
      render: (cert: Certificate) => (
        <div className="flex items-center gap-2 text-slate-600">
          <Calendar className="w-4 h-4" />
          <span>{cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString('ar-SYRIA-SYRIAN-ARABIC') : '-'}</span>
        </div>
      ),
    },
    {
      key: 'certificate',
      header: 'الشهادة',
      render: (cert: Certificate) => (
        cert.certificateUrl ? (
          <a
            href={cert.certificateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary-400 hover:text-primary-300"
          >
            <Award className="w-4 h-4" />
            عرض الشهادة
          </a>
        ) : (
          <span className="text-slate-500">-</span>
        )
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="الشهادات"
        description={`إدارة شهادات الطلاب (${certificates.length} شهادة)`}
        action={
          <button onClick={handleOpenModal} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إنشاء شهادة
          </button>
        }
      />

      {/* شريط البحث */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم أو المستوى..."
            className="input-field pr-12 w-full"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredCertificates}
        isLoading={isLoading}
        keyExtractor={(cert) => cert.id}
        emptyMessage="لا توجد شهادات"
      />

      {/* Generate Certificate Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="إنشاء شهادة جديدة"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-600 text-sm mb-2">الطالب *</label>
            <StudentSearchableSelect
              options={students}
              value={formData.studentId}
              onChange={(value) => setFormData({ ...formData, studentId: value })}
              placeholder="اختر طالب..."
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm mb-2">المستوى *</label>
            <LevelSearchableSelect
              options={levels}
              value={formData.levelId}
              onChange={(value) => setFormData({ ...formData, levelId: value })}
              placeholder="اختر مستوى..."
            />
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <p className="text-amber-400 text-sm">
              <Award className="w-4 h-4 inline ml-1" />
              سيتم إنشاء شهادة إتمام المستوى للطالب المحدد
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء الشهادة'}
            </button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

