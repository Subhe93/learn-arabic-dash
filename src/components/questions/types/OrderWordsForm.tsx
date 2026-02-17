import TextInput from '../shared/TextInput';
import WordsList from '../shared/WordsList';

interface OrderWordsFormProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}

export default function OrderWordsForm({ content, onChange }: OrderWordsFormProps) {
  const words = (content.words as string[]) || [];
  const correctOrder = (content.correctOrder as string[]) || [];

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
      <WordsList
        words={correctOrder}
        onChange={(newOrder) => onChange({ ...content, correctOrder: newOrder })}
        label="الترتيب الصحيح"
      />
    </div>
  );
}

