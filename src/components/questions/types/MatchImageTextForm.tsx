import { X } from 'lucide-react';
import TextInput from '../shared/TextInput';
import ImageUpload from '../shared/ImageUpload';

interface MatchImageTextFormProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
  onUpload: (file: File) => Promise<string | null>;
  isUploading?: boolean;
  uploadProgress?: number;
}

export default function MatchImageTextForm({ 
  content, 
  onChange, 
  onUpload,
  isUploading = false,
  uploadProgress = 0,
}: MatchImageTextFormProps) {
  const pairs = (content.pairs as Array<{ image: string; text: string }>) || [];

  const addPair = () => {
    onChange({
      ...content,
      pairs: [...pairs, { image: '', text: '' }]
    });
  };

  const updatePair = (index: number, field: 'image' | 'text', value: string) => {
    const newPairs = [...pairs];
    newPairs[index] = { ...newPairs[index], [field]: value };
    onChange({ ...content, pairs: newPairs });
  };

  const removePair = (index: number) => {
    // منع الحذف إذا كان هناك زوجان فقط
    if (pairs.length <= 2) {
      return;
    }
    onChange({
      ...content,
      pairs: pairs.filter((_, i) => i !== index)
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
          <label className="block text-slate-600 text-sm">
            أزواج الصورة والنص
            <span className="text-red-500 text-xs mr-2">(الحد الأدنى: زوجان)</span>
          </label>
          <button
            type="button"
            onClick={addPair}
            className="text-xs text-primary-400 hover:text-primary-300"
          >
            + إضافة زوج
          </button>
        </div>
        {pairs.length < 2 && (
          <div className="mb-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-amber-400 text-xs">
              يجب إضافة زوجين على الأقل (الحد الأدنى: 2 أزواج)
            </p>
          </div>
        )}
        <div className="space-y-4">
          {pairs.map((pair, index) => (
            <div key={index} className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-sm">زوج #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removePair(index)}
                  disabled={pairs.length <= 2}
                  className={`p-1 ${
                    pairs.length <= 2
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-red-500 hover:text-red-600'
                  }`}
                  title={pairs.length <= 2 ? 'يجب أن يكون هناك زوجان على الأقل' : 'حذف الزوج'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ImageUpload
                value={pair.image}
                onChange={(url) => updatePair(index, 'image', url)}
                label="صورة"
                onUpload={onUpload}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
              />
              <input
                type="text"
                value={pair.text}
                onChange={(e) => updatePair(index, 'text', e.target.value)}
                className="input-field"
                placeholder="النص"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

