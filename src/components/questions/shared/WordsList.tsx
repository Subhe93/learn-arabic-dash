import { X } from 'lucide-react';

interface WordsListProps {
  words: string[];
  onChange: (words: string[]) => void;
  label: string;
}

export default function WordsList({ words, onChange, label }: WordsListProps) {
  const addWord = () => {
    onChange([...words, '']);
  };

  const updateWord = (index: number, value: string) => {
    const newWords = [...words];
    newWords[index] = value;
    onChange(newWords);
  };

  const removeWord = (index: number) => {
    onChange(words.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-slate-600 text-sm">{label}</label>
        <button
          type="button"
          onClick={addWord}
          className="text-xs text-primary-500 hover:text-primary-600"
        >
          + إضافة
        </button>
      </div>
      <div className="space-y-2">
        {words.map((word, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={word}
              onChange={(e) => updateWord(index, e.target.value)}
              className="input-field flex-1"
              placeholder={`${label} ${index + 1}`}
            />
            <button
              type="button"
              onClick={() => removeWord(index)}
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

