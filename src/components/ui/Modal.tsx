import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showFullscreen?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md', showFullscreen = false }: ModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setIsFullscreen(false);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      {/* Backdrop */}
      <div
        className="modal-backdrop"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`modal-container ${isFullscreen ? 'modal-fullscreen' : sizeClasses[size]}`}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <div className="flex items-center gap-2">
            {showFullscreen && (
              <button
                onClick={toggleFullscreen}
                className="modal-close-btn"
                title={isFullscreen ? 'تصغير' : 'ملء الشاشة'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5" />
                ) : (
                  <Maximize2 className="w-5 h-5" />
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="modal-close-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
