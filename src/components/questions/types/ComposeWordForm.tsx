import TextInput from '../shared/TextInput';
import WordsList from '../shared/WordsList';

interface ComposeWordFormProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}

export default function ComposeWordForm({ content, onChange }: ComposeWordFormProps) {
  const letters = (content.letters as string[]) || [];

  return (
    <div className="space-y-4">
      <TextInput
        value={(content.text as string) || ''}
        onChange={(text) => onChange({ ...content, text })}
      />
      <WordsList
        words={letters}
        onChange={(newLetters) => onChange({ ...content, letters: newLetters })}
        label="الأحرف"
      />
    </div>
  );
}

