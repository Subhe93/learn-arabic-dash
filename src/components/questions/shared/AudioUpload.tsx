import { useRef, useState } from 'react';
import { X, Music } from 'lucide-react';

interface AudioUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  onUpload: (file: File) => Promise<string | null>;
  isUploading?: boolean;
}

export default function AudioUpload({
  value,
  onChange,
  label = "ملف الصوت",
  onUpload,
  isUploading = false,
}: AudioUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);

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
    if (audioInputRef.current) audioInputRef.current.value = '';
  };

  return (
    <div>
      <label className="block text-slate-600 text-sm mb-2">{label}</label>
      {value ? (
        <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg">
          <Music className="w-5 h-5 text-primary-500" />
          <span className="flex-1 text-slate-700 truncate">{value}</span>
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1 text-red-500 hover:text-red-600"
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
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Music className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-600 text-sm mb-2">اسحب ملف الصوت هنا أو</p>
          <button
            type="button"
            onClick={() => audioInputRef.current?.click()}
            className="text-primary-500 hover:text-primary-600 text-sm"
            disabled={isUploading}
          >
            اختر ملف صوت
          </button>
        </div>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field mt-2"
        placeholder="أو أدخل رابط ملف الصوت مباشرة"
      />
    </div>
  );
}

