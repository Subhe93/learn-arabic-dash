import { useRef, useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { API_BASE_URL } from '../../../config/api';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
  onUpload: (file: File) => Promise<string | null>;
  isUploading?: boolean;
  uploadProgress?: number;
}

export default function ImageUpload({
  value,
  onChange,
  label,
  onUpload,
  isUploading = false,
  uploadProgress = 0,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
      const url = await onUpload(file);
      if (url) onChange(url);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await onUpload(file);
      if (url) onChange(url);
    }
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  // بناء رابط الصورة مع التأكد من وجود uploads/
  const getImageUrl = () => {
    if (!value) return '';
    
    // إذا كان الرابط كاملاً (يبدأ بـ http أو https)، استخدمه مباشرة
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }
    
    // تنظيف الرابط: إزالة / في البداية إن وجد
    let cleanValue = value.startsWith('/') ? value.slice(1) : value;
    
    // التأكد من وجود uploads/ في المسار
    if (!cleanValue.includes('uploads/')) {
      cleanValue = `uploads/${cleanValue}`;
    }
    
    return `${API_BASE_URL}/${cleanValue}`;
  };

  return (
    <div>
      <label className="block text-slate-600 text-sm mb-2">{label}</label>
      {value ? (
        <div className="relative">
          <img 
            src={getImageUrl()} 
            alt="Preview" 
            className="w-full h-48 object-cover rounded-lg mb-2" 
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 left-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging ? 'border-primary-500 bg-primary-500/10' : 'border-slate-300 hover:border-slate-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <ImageIcon className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-600 text-sm mb-2">اسحب الصورة هنا أو</p>
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="text-primary-500 hover:text-primary-600 text-sm"
            disabled={isUploading}
          >
            اختر صورة
          </button>
          {isUploading && (
            <div className="mt-2">
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-primary-500 h-2 rounded-full" 
                  style={{ width: `${uploadProgress}%` }} 
                />
              </div>
            </div>
          )}
        </div>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field mt-2"
        placeholder="أو أدخل رابط الصورة مباشرة"
      />
    </div>
  );
}

