import TextInput from '../shared/TextInput';
import WordsList from '../shared/WordsList';

interface WriteWordsFormProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}

export default function WriteWordsForm({ content, onChange }: WriteWordsFormProps) {
  const words = (content.words as string[]) || [];

  return (
    <div className="space-y-4">
      <TextInput
        value={(content.text as string) || ''}
        onChange={(text) => onChange({ ...content, text })}
      />
      <WordsList
        words={words}
        onChange={(newWords) => onChange({ ...content, words: newWords })}
        label="الكلمات"
      />
    </div>
  );
}

