import TextInput from '../shared/TextInput';
import ImageUpload from '../shared/ImageUpload';

interface ReadQuestionFormProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
  onUpload: (file: File) => Promise<string | null>;
  isUploading?: boolean;
  uploadProgress?: number;
}

export default function ReadQuestionForm({ 
  content, 
  onChange, 
  onUpload,
  isUploading = false,
  uploadProgress = 0,
}: ReadQuestionFormProps) {
  return (
    <div className="space-y-4">
      <TextInput
        value={(content.text as string) || ''}
        onChange={(text) => onChange({ ...content, text })}
      />
      <ImageUpload
        value={(content.imageUrl as string) || ''}
        onChange={(url) => onChange({ ...content, imageUrl: url })}
        label="صورة (اختيارية)"
        onUpload={onUpload}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />
    </div>
  );
}

