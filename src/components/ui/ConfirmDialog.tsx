import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  isLoading,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center" style={{ padding: '20px 0' }}>
        <div 
          className="mx-auto rounded-full bg-red-500/20 flex items-center justify-center"
          style={{ width: '88px', height: '88px', marginBottom: '28px' }}
        >
          <AlertTriangle style={{ width: '44px', height: '44px', color: '#ef4444' }} />
        </div>
        <p style={{ color: '#1e293b', fontSize: '18px', marginBottom: '36px', lineHeight: 1.6 }}>{message}</p>
        <div className="flex justify-center" style={{ gap: '16px' }}>
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="btn-danger"
            disabled={isLoading}
          >
            {isLoading ? 'جاري الحذف...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
