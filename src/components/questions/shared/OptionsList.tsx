import { X } from 'lucide-react';

interface Option {
  text: string;
  is_correct: boolean;
}

interface OptionsListProps {
  options: Option[];
  onChange: (options: Option[]) => void;
  label?: string;
}

export default function OptionsList({ 
  options, 
  onChange, 
  label = "الخيارات" 
}: OptionsListProps) {
  const addOption = () => {
    onChange([...options, { text: '', is_correct: false }]);
  };

  const updateOption = (index: number, field: keyof Option, value: string | boolean) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    onChange(newOptions);
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-slate-600 text-sm">{label}</label>
        <button
          type="button"
          onClick={addOption}
          className="text-xs text-primary-500 hover:text-primary-600"
        >
          + إضافة خيار
        </button>
      </div>
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={option.text}
              onChange={(e) => updateOption(index, 'text', e.target.value)}
              className="input-field flex-1"
              placeholder={`خيار ${index + 1}`}
            />
            <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={option.is_correct}
                onChange={(e) => updateOption(index, 'is_correct', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 bg-white text-primary-500"
              />
              <span className="text-slate-600 text-sm">صحيح</span>
            </label>
            <button
              type="button"
              onClick={() => removeOption(index)}
              className="p-1 text-red-500 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

