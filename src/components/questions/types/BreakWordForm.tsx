import TextInput from '../shared/TextInput';

interface BreakWordFormProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}

export default function BreakWordForm({ content, onChange }: BreakWordFormProps) {
  return (
    <div className="space-y-4">
      <TextInput
        value={(content.text as string) || ''}
        onChange={(text) => onChange({ ...content, text })}
      />
      <div>
        <label className="block text-slate-600 text-sm mb-2">الكلمة</label>
        <input
          type="text"
          value={(content.word as string) || ''}
          onChange={(e) => onChange({ ...content, word: e.target.value })}
          className="input-field"
          placeholder="اكتب الكلمة..."
        />
      </div>
    </div>
  );
}

