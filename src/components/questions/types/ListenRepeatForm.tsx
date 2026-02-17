import TextInput from '../shared/TextInput';
import AudioUpload from '../shared/AudioUpload';

interface ListenRepeatFormProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
  onUpload: (file: File) => Promise<string | null>;
  isUploading?: boolean;
}

export default function ListenRepeatForm({ 
  content, 
  onChange, 
  onUpload,
  isUploading = false,
}: ListenRepeatFormProps) {
  return (
    <div className="space-y-4">
      <TextInput
        value={(content.text as string) || ''}
        onChange={(text) => onChange({ ...content, text })}
      />
      <AudioUpload
        value={(content.audioUrl as string) || ''}
        onChange={(url) => onChange({ ...content, audioUrl: url })}
        onUpload={onUpload}
        isUploading={isUploading}
      />
    </div>
  );
}

