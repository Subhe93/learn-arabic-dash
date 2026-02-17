import { X } from 'lucide-react';
import TextInput from '../shared/TextInput';
import ImageUpload from '../shared/ImageUpload';
import WordsList from '../shared/WordsList';

interface SelectImageTextFormProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
  onUpload: (file: File) => Promise<string | null>;
  isUploading?: boolean;
  uploadProgress?: number;
}

export default function SelectImageTextForm({ 
  content, 
  onChange, 
  onUpload,
  isUploading = false,
  uploadProgress = 0,
}: SelectImageTextFormProps) {
  const items = (content.items as Array<{ image: string; correctText: string }>) || [];
  const options = (content.options as string[]) || [];

  const addItem = () => {
    onChange({
      ...content,
      items: [...items, { image: '', correctText: '' }]
    });
  };

  const updateItem = (index: number, field: 'image' | 'correctText', value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange({ ...content, items: newItems });
  };

  const removeItem = (index: number) => {
    onChange({
      ...content,
      items: items.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-4">
      <TextInput
        value={(content.text as string) || ''}
        onChange={(text) => onChange({ ...content, text })}
      />
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-slate-600 text-sm">العناصر (صورة + نص صحيح)</label>
          <button
            type="button"
            onClick={addItem}
            className="text-xs text-primary-500 hover:text-primary-600"
          >
            + إضافة عنصر
          </button>
        </div>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-sm">عنصر #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="p-1 text-red-500 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ImageUpload
                value={item.image}
                onChange={(url) => updateItem(index, 'image', url)}
                label="صورة"
                onUpload={onUpload}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
              />
              <input
                type="text"
                value={item.correctText}
                onChange={(e) => updateItem(index, 'correctText', e.target.value)}
                className="input-field"
                placeholder="النص الصحيح"
              />
            </div>
          ))}
        </div>
      </div>
      <WordsList
        words={options}
        onChange={(newOptions) => onChange({ ...content, options: newOptions })}
        label="خيارات القائمة المنسدلة"
      />
    </div>
  );
}

