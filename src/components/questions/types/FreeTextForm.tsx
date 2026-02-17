import TextInput from '../shared/TextInput';

interface FreeTextFormProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}

export default function FreeTextForm({ content, onChange }: FreeTextFormProps) {
  return (
    <div className="space-y-4">
      <TextInput
        value={(content.text as string) || ''}
        onChange={(text) => onChange({ ...content, text })}
      />
      <div>
        <label className="block text-slate-600 text-sm mb-2">نص الإرشاد</label>
        <input
          type="text"
          value={(content.placeholder as string) || ''}
          onChange={(e) => onChange({ ...content, placeholder: e.target.value })}
          className="input-field"
          placeholder="اكتب نص الإرشاد..."
        />
      </div>
    </div>
  );
}

