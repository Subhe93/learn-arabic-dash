interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
}

export default function TextInput({ 
  value, 
  onChange, 
  label = "نص السؤال", 
  placeholder = "اكتب نص السؤال هنا...",
  rows = 4 
}: TextInputProps) {
  return (
    <div>
      <label className="block text-slate-600 text-sm mb-2">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field min-h-[100px] resize-none"
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
}

