import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, ArrowRight, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { API_ENDPOINTS } from '../config/api';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import RichTextEditor from '../components/ui/RichTextEditor';

interface ClassSession {
  id: number;
  name: string;
  description: string;
  duration: number;
  dateTimeStart: string;
  url: string;
  createdAt: string;
}

export default function TeacherClassSessions() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 60,
    dateTimeStart: '',
    url: '',
  });

  const fetchSessions = async () => {
    if (!classId) return;
    try {
      const response = await api.get(API_ENDPOINTS.teacherClassSessions(parseInt(classId)));
      setSessions(response.data.data || response.data || []);
    } catch (error) {
      toast.error('فشل في جلب البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [classId]);

  const handleOpenModal = (session?: ClassSession) => {
    if (session) {
      setSelectedSession(session);
      setFormData({
        name: session.name,
        description: session.description || '',
        duration: session.duration,
        dateTimeStart: session.dateTimeStart ? session.dateTimeStart.slice(0, 16) : '',
        url: session.url || '',
      });
    } else {
      setSelectedSession(null);
      setFormData({
        name: '',
        description: '',
        duration: 60,
        dateTimeStart: '',
        url: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) return;
    setIsSubmitting(true);

    try {
      const params = new URLSearchParams();
      params.append('name', formData.name);
      params.append('description', formData.description);
      params.append('duration', formData.duration.toString());
      params.append('dateTimeStart', new Date(formData.dateTimeStart).toISOString());
      params.append('url', formData.url);

      if (selectedSession) {
        await api.patch(
          `${API_ENDPOINTS.teacherClassSessions(parseInt(classId))}/${selectedSession.id}`,
          params
        );
        toast.success('تم تحديث الجلسة بنجاح');
      } else {
        await api.post(API_ENDPOINTS.teacherClassSessions(parseInt(classId)), params);
        toast.success('تم إضافة الجلسة بنجاح');
      }

      setIsModalOpen(false);
      fetchSessions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSession || !classId) return;
    setIsSubmitting(true);

    try {
      await api.delete(`${API_ENDPOINTS.teacherClassSessions(parseInt(classId))}/${selectedSession.id}`);
      toast.success('تم حذف الجلسة بنجاح');
      setIsDeleteDialogOpen(false);
      fetchSessions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل في حذف الجلسة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { key: 'id', header: '#' },
    { key: 'name', header: 'اسم الجلسة' },
    {
      key: 'duration',
      header: 'المدة',
      render: (session: ClassSession) => (
        <span className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
          {session.duration} دقيقة
        </span>
      ),
    },
    {
      key: 'dateTimeStart',
      header: 'موعد البدء',
      render: (session: ClassSession) => (
        <span className="text-slate-600">
          {session.dateTimeStart
            ? new Date(session.dateTimeStart).toLocaleString('ar-SYRIA-SYRIAN-ARABIC', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            : '-'}
        </span>
      ),
    },
    {
      key: 'url',
      header: 'الرابط',
      render: (session: ClassSession) =>
        session.url ? (
          <a
            href={session.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-slate-600 hover:text-primary-400 hover:bg-primary-500/10 transition-colors inline-flex"
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
      render: (session: ClassSession) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(session)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedSession(session);
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
        title={`جلسات الصف #${classId}`}
        description="إدارة جلسات هذا الصف"
        action={
          <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة جلسة
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={sessions}
        isLoading={isLoading}
        keyExtractor={(session) => session.id}
        emptyMessage="لا توجد جلسات في هذا الصف"
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSession ? 'تعديل الجلسة' : 'إضافة جلسة جديدة'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-600 text-sm mb-2">اسم الجلسة</label>
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
            placeholder="اكتب وصف الجلسة هنا..."
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-sm mb-2">المدة (بالدقائق)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                className="input-field"
                min={1}
              />
            </div>
            <div>
              <label className="block text-slate-600 text-sm mb-2">موعد البدء</label>
              <input
                type="datetime-local"
                value={formData.dateTimeStart}
                onChange={(e) => setFormData({ ...formData, dateTimeStart: e.target.value })}
                className="input-field"
                dir="ltr"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 text-sm mb-2">رابط الجلسة</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="input-field"
              dir="ltr"
              placeholder="https://example.com/meeting"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : selectedSession ? 'تحديث' : 'إضافة'}
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
        title="حذف الجلسة"
        message={`هل أنت متأكد من حذف الجلسة "${selectedSession?.name}"؟`}
        confirmText="حذف"
        isLoading={isSubmitting}
      />
    </div>
  );
}

