import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Plus, Pencil, Trash2, Globe, File, Image, Type, Upload, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import RichTextEditor from '../components/ui/RichTextEditor';
import SearchableSelect from '../components/ui/SearchableSelect';

interface Country {
  id: number;
  name: string;
}

interface TeacherSpace {
  id: number;
  name: string;
  countryId: number;
  order: number;
  type: 'file' | 'image' | 'text';
  content: string;
  Country: {
    name: string;
  };
}

const ITEM_TYPES = {
  text: { label: 'نص', icon: Type, color: 'green' },
  image: { label: 'صورة', icon: Image, color: 'purple' },
  file: { label: 'ملف', icon: File, color: 'blue' },
};

const itemTypesOptions = Object.entries(ITEM_TYPES).map(([key, { label }]) => ({ id: key, name: label }));

type UploadType = 'image' | 'file';

export default function TeacherSpaces() {
  const [items, setItems] = useState<TeacherSpace[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TeacherSpace | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [filterCountry, setFilterCountry] = useState<number | 'all'>('all');
  const [filterType, setFilterType] = useState<string | 'all'>('all');

  // Upload states
  const [uploadingType, setUploadingType] = useState<UploadType | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [draggingType, setDraggingType] = useState<UploadType | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    countryId: null as number | null,
    order: 1,
    type: 'text' as 'file' | 'image' | 'text',
    content: '',
  });

  const fetchData = async () => {
    try {
      const [itemsRes, countriesRes] = await Promise.all([
        api.get(API_ENDPOINTS.teacherSpaces),
        api.get(API_ENDPOINTS.countries)
      ]);
      setItems(itemsRes.data.data || itemsRes.data || []);
      setCountries(countriesRes.data.data || countriesRes.data || []);
    } catch (error) {
      toast.error('فشل في جلب البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (item?: TeacherSpace) => {
    setUploadingType(null);
    setDraggingType(null);
    if (item) {
      setSelectedItem(item);
      setFormData({
        name: item.name,
        countryId: item.countryId,
        order: item.order,
        type: item.type,
        content: item.content,
      });
    } else {
      setSelectedItem(null);
      setFormData({
        name: '',
        countryId: null,
        order: (items.length + 1),
        type: 'text',
        content: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.countryId) {
      toast.error('يرجى اختيار الدولة');
      return;
    }
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        order: Number(formData.order),
        countryId: Number(formData.countryId),
      };

      if (selectedItem) {
        await api.patch(`${API_ENDPOINTS.teacherSpaces}/${selectedItem.id}`, payload);
        toast.success('تم تحديث العنصر بنجاح');
      } else {
        await api.post(API_ENDPOINTS.teacherSpaces, payload);
        toast.success('تم إضافة العنصر بنجاح');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ ما');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);

    try {
      await api.delete(`${API_ENDPOINTS.teacherSpaces}/${selectedItem.id}`);
      toast.success('تم حذف العنصر بنجاح');
      setIsDeleteDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل في حذف العنصر');
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadFile = async (file: File, type: UploadType) => {
    const validTypes = {
      image: { mimes: ['image/'], maxSize: 5 * 1024 * 1024, label: 'صورة', endpoint: API_ENDPOINTS.upload.image },
      file: { mimes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], maxSize: 20 * 1024 * 1024, label: 'ملف', endpoint: API_ENDPOINTS.upload.file },
    };

    const config = validTypes[type];
    if (!config.mimes.some(mime => file.type.startsWith(mime))) {
      toast.error(`يرجى اختيار ${config.label} صالح`);
      return;
    }
    if (file.size > config.maxSize) {
      toast.error(`حجم الملف يجب أن لا يتجاوز ${config.maxSize / (1024 * 1024)} ميجابايت`);
      return;
    }

    setUploadingType(type);
    setUploadProgress(0);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await api.post(config.endpoint, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0;
          setUploadProgress(progress);
        },
      });
      const fileUrl = response.data.path || response.data.url || response.data.data?.path;
      if (fileUrl) {
        setFormData(prev => ({ ...prev, content: fileUrl }));
        toast.success(`تم رفع ${config.label} بنجاح`);
      } else {
        toast.error('لم يتم العثور على رابط الملف في الاستجابة');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `فشل في رفع ${config.label}`);
    } finally {
      setUploadingType(null);
    }
  };

  const handleTypeChange = (type: 'file' | 'image' | 'text') => {
    setFormData(prev => ({ ...prev, type, content: '' }));
  };
  
  const FileUploadZone = ({ type, icon: Icon, placeholder, accept }: { type: UploadType; icon: React.ElementType; placeholder: string; accept: string; }) => {
    const inputRef = type === 'image' ? imageInputRef : fileInputRef;
    const isUploading = uploadingType === type;
    const isDragging = draggingType === type;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) uploadFile(e.target.files[0], type);
      e.target.value = '';
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setDraggingType(null);
      if (e.dataTransfer.files?.[0]) uploadFile(e.dataTransfer.files[0], type);
    }, [type]);

    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDraggingType(type); }}
        onDragLeave={() => setDraggingType(null)}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`relative mt-2 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-300 hover:border-slate-400'}`}
      >
        <input ref={inputRef} type="file" accept={accept} onChange={handleFileSelect} className="hidden" />
        {isUploading ? (
          <div className="space-y-2">
            <Upload className="w-8 h-8 mx-auto text-emerald-500 animate-pulse" />
            <p className="text-sm">جاري الرفع... {uploadProgress}%</p>
            <div className="w-full bg-slate-200 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div></div>
          </div>
        ) : formData.content ? (
          <div className="space-y-2">
            <CheckCircle className="w-8 h-8 mx-auto text-emerald-500" />
            <p className="text-sm font-semibold truncate">{formData.content}</p>
            <p className="text-xs text-slate-500">اضغط أو اسحب ملف آخر للتغيير</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Icon className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-sm">اسحب {placeholder} إلى هنا أو اضغط للاختيار</p>
            <p className="text-xs text-slate-500">{accept}</p>
          </div>
        )}
      </div>
    );
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const countryMatch = filterCountry === 'all' || item.countryId === filterCountry;
      const typeMatch = filterType === 'all' || item.type === filterType;
      return countryMatch && typeMatch;
    });
  }, [items, filterCountry, filterType]);

  const columns = [
    { key: 'id', header: '#' },
    { key: 'name', header: 'الاسم' },
    {
      key: 'type',
      header: 'النوع',
      render: (item: TeacherSpace) => {
        const typeInfo = ITEM_TYPES[item.type];
        const Icon = typeInfo.icon;
        return (
          <div className="flex items-center gap-2">
             <div className={`w-8 h-8 rounded-lg bg-${typeInfo.color}-500/20 flex items-center justify-center`}>
                <Icon className={`w-4 h-4 text-${typeInfo.color}-500`} />
             </div>
            <span>{typeInfo.label}</span>
          </div>
        );
      },
    },
    { 
      key: 'country', 
      header: 'الدولة',
      render: (item: TeacherSpace) => (
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-500" />
          <span>{item.Country?.name || 'غير محدد'}</span>
        </div>
      ),
    },
    { key: 'order', header: 'الترتيب' },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (item: TeacherSpace) => (
        <div className="flex items-center gap-2">
          <button onClick={() => handleOpenModal(item)} className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => { setSelectedItem(item); setIsDeleteDialogOpen(true); }} className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="واحة المدرس"
        description="إدارة المحتوى الخاص بواحة المدرس"
        action={
          <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة عنصر
          </button>
        }
      />

      <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-600 text-sm mb-2">فلترة حسب الدولة</label>
            <SearchableSelect
              options={[{ id: 'all', name: 'كل الدول' }, ...countries]}
              value={filterCountry}
              onChange={(value) => setFilterCountry(value as any)}
              placeholder="اختر دولة..."
              icon={Globe}
            />
          </div>
          <div>
            <label className="block text-slate-600 text-sm mb-2">فلترة حسب النوع</label>
            <SearchableSelect
              options={[{ id: 'all', name: 'كل الأنواع' }, ...itemTypesOptions]}
              value={filterType}
              onChange={(value) => setFilterType(value as any)}
              placeholder="اختر نوع..."
              icon={Type}
            />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredItems}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        emptyMessage="لا توجد عناصر تطابق الفلترة"
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedItem ? 'تعديل عنصر' : 'إضافة عنصر جديد'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-600 text-sm mb-2">اسم العنصر</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-sm mb-2">الدولة</label>
              <SearchableSelect
                options={countries}
                value={formData.countryId}
                onChange={(value) => setFormData({ ...formData, countryId: value as number })}
                placeholder="اختر دولة..."
                icon={Globe}
              />
            </div>
            <div>
              <label className="block text-slate-600 text-sm mb-2">النوع</label>
              <SearchableSelect
                options={itemTypesOptions}
                value={formData.type}
                onChange={(value) => handleTypeChange(value as 'file' | 'image' | 'text')}
                placeholder="اختر نوع..."
                icon={Type}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-slate-600 text-sm mb-2">المحتوى</label>
            {formData.type === 'text' && (
              <RichTextEditor
                value={formData.content}
                onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
              />
            )}
            {formData.type === 'image' && (
              <FileUploadZone type="image" icon={Image} placeholder="صورة" accept="image/*" />
            )}
            {formData.type === 'file' && (
              <FileUploadZone type="file" icon={File} placeholder="ملف" accept=".pdf,.doc,.docx" />
            )}
          </div>

          <div>
            <label className="block text-slate-600 text-sm mb-2">الترتيب</label>
            <input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })} className="input-field" required min={1} />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1" disabled={isSubmitting || uploadingType !== null}>
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="حذف العنصر"
        message={`هل أنت متأكد من حذف العنصر "${selectedItem?.name}"؟`}
        confirmText="حذف"
        isLoading={isSubmitting}
      />
    </div>
  );
}

