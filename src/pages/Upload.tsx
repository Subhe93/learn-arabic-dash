import { useState, useRef } from 'react';
import { Image, FileText, X, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import PageHeader from '../components/ui/PageHeader';

interface UploadedFile {
  name: string;
  path: string;
  type: 'image' | 'file';
}

export default function Upload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File, type: 'image' | 'file') => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const endpoint = type === 'image' ? API_ENDPOINTS.upload.image : API_ENDPOINTS.upload.file;
      const response = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const path = response.data.path || response.data.url || response.data.file;
      
      setUploadedFiles((prev) => [
        ...prev,
        { name: file.name, path, type },
      ]);

      toast.success(`تم رفع ${type === 'image' ? 'الصورة' : 'الملف'} بنجاح`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل في رفع الملف');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'image' | 'file') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0], type);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0], type);
    }
  };

  const copyToClipboard = (path: string) => {
    navigator.clipboard.writeText(path);
    toast.success('تم نسخ المسار');
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <PageHeader
        title="رفع الملفات"
        description="رفع الصور والملفات إلى الخادم"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Image Upload */}
        <div className="card">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Image className="w-5 h-5 text-blue-400" />
            رفع صورة
          </h3>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-slate-200 hover:border-slate-600'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={(e) => handleDrop(e, 'image')}
          >
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'image')}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <Image className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-slate-600 mb-2">اسحب الصورة هنا أو</p>
            <button
              onClick={() => imageInputRef.current?.click()}
              className="btn-primary"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  جاري الرفع...
                </>
              ) : (
                'اختر صورة'
              )}
            </button>
            <p className="text-slate-500 text-sm mt-3">PNG, JPG, GIF, WEBP</p>
          </div>
        </div>

        {/* File Upload */}
        <div className="card">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-400" />
            رفع ملف
          </h3>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-slate-200 hover:border-slate-600'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={(e) => handleDrop(e, 'file')}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
              onChange={(e) => handleFileChange(e, 'file')}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-slate-600 mb-2">اسحب الملف هنا أو</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  جاري الرفع...
                </>
              ) : (
                'اختر ملف'
              )}
            </button>
            <p className="text-slate-500 text-sm mt-3">PDF, DOC, XLS, PPT, ZIP</p>
          </div>
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-400" />
            الملفات المرفوعة
          </h3>
          <div className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 group"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    file.type === 'image' ? 'bg-blue-500/20' : 'bg-red-500/20'
                  }`}
                >
                  {file.type === 'image' ? (
                    <Image className="w-5 h-5 text-blue-400" />
                  ) : (
                    <FileText className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 font-medium truncate">{file.name}</p>
                  <p className="text-slate-500 text-sm font-mono truncate">{file.path}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(file.path)}
                    className="px-3 py-1.5 rounded-lg bg-primary-500/20 text-primary-400 text-sm hover:bg-primary-500/30 transition-colors"
                  >
                    نسخ المسار
                  </button>
                  <a
                    href={`${API_BASE_URL}${file.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-sm hover:bg-slate-600 transition-colors"
                  >
                    عرض
                  </a>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

