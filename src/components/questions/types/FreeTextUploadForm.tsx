import TextInput from '../shared/TextInput';

interface FreeTextUploadFormProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}

export default function FreeTextUploadForm({ content, onChange }: FreeTextUploadFormProps) {
  return (
    <div className="space-y-4">
      <TextInput
        value={(content.text as string) || ''}
        onChange={(text) => onChange({ ...content, text })}
      />
    </div>
  );
}

