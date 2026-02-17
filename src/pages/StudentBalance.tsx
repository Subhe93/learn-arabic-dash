import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Wallet, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { API_ENDPOINTS } from '../config/api';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';

interface Transaction {
  id: number;
  studentId: number;
  amount: string | number;
  type: string;
  description?: string;
  createdAt: string;
}

interface TransactionsResponse {
  studentId: number;
  studentName: string;
  currentBalance: number;
  totalTransactions: number;
  transactions: Transaction[];
}


export default function StudentBalance() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [studentName, setStudentName] = useState('');
  const [currentBalance, setCurrentBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
  });

  const fetchTransactions = useCallback(async () => {
    if (!studentId) return;
    try {
      const response = await api.get(API_ENDPOINTS.studentTransactionsForStudent(parseInt(studentId)));
      const data: TransactionsResponse = response.data;
      
      // استخراج البيانات من الاستجابة
      setTransactions(data.transactions || []);
      setStudentName(data.studentName || '');
      setCurrentBalance(data.currentBalance || 0);
    } catch {
      // قد لا يكون هناك معاملات
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleOpenModal = () => {
    setFormData({ amount: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !formData.amount) {
      toast.error('يرجى إدخال المبلغ');
      return;
    }
    setIsSubmitting(true);

    try {
      await api.post(
        API_ENDPOINTS.studentAddBalance(parseInt(studentId)),
        { amount: parseFloat(formData.amount) },
        { headers: { 'Content-Type': 'application/json' } }
      );
      toast.success('تم إضافة الرصيد بنجاح');
      setIsModalOpen(false);
      fetchTransactions();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setIsSubmitting(false);
    }
  };

  // دالة للحصول على قيمة المبلغ كرقم
  const getAmount = (amount: string | number): number => {
    if (typeof amount === 'number') return amount;
    return parseFloat(amount) || 0;
  };

  const columns = [
    { key: 'id', header: '#' },
    {
      key: 'type',
      header: 'النوع',
      render: (item: Transaction) => {
        const amount = getAmount(item.amount);
        return (
          <div className="flex items-center gap-2">
            {amount > 0 ? (
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-400" />
              </div>
            )}
            <span>{item.type || (amount > 0 ? 'إيداع' : 'سحب')}</span>
          </div>
        );
      },
    },
    {
      key: 'amount',
      header: 'المبلغ',
      render: (item: Transaction) => {
        const amount = getAmount(item.amount);
        return (
          <span className={`font-bold ${amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {amount > 0 ? '+' : ''}{amount} $
          </span>
        );
      },
    },
    {
      key: 'description',
      header: 'الوصف',
      render: (item: Transaction) => (
        <span className="text-slate-600">{item.description || '-'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'التاريخ',
      render: (item: Transaction) => (
        <div className="flex items-center gap-2 text-slate-600">
          <Calendar className="w-4 h-4" />
          <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-SYRIA-SYRIAN-ARABIC') : '-'}</span>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={() => navigate('/students')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للطلاب
        </button>
      </div>

      <PageHeader
        title={`رصيد الطالب${studentName ? `: ${studentName}` : ''}`}
        description="إدارة رصيد الطالب والمعاملات المالية"
        action={
          <button onClick={handleOpenModal} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة رصيد
          </button>
        }
      />

      {/* بطاقة الرصيد الحالي */}
      <div className="mb-6">
        <div className="bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/30 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-emerald-500/30 flex items-center justify-center">
              <Wallet className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-600 text-sm">الرصيد الحالي</p>
              <p className="text-3xl font-bold text-emerald-400">{currentBalance} $</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">سجل المعاملات</h3>
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        emptyMessage="لا توجد معاملات مالية لهذا الطالب"
      />

      {/* Add Balance Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="إضافة رصيد"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-600 text-sm mb-2">المبلغ ($) *</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="input-field"
              placeholder="أدخل المبلغ"
              min="0.01"
              step="0.01"
              required
            />
          </div>

          <div className="bg-white border border-slate-200/50 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">الرصيد الحالي:</span>
              <span className="text-slate-900 font-medium">{currentBalance} $</span>
            </div>
            {formData.amount && (
              <div className="flex justify-between text-sm mt-2 pt-2 border-t border-slate-200">
                <span className="text-slate-600">الرصيد بعد الإضافة:</span>
                <span className="text-emerald-400 font-bold">
                  {(currentBalance + parseFloat(formData.amount || '0')).toFixed(2)} $
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الإضافة...' : 'إضافة الرصيد'}
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

