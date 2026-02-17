import TextInput from '../shared/TextInput';
import OptionsList from '../shared/OptionsList';

interface FillSentenceFormProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}

export default function FillSentenceForm({ content, onChange }: FillSentenceFormProps) {
  const options = (content.options as Array<{ text: string; is_correct: boolean }>) || [];

  return (
    <div className="space-y-4">
      <TextInput
        value={(content.text as string) || ''}
        onChange={(text) => onChange({ ...content, text })}
      />
      <OptionsList
        options={options}
        onChange={(newOptions) => onChange({ ...content, options: newOptions })}
      />
    </div>
  );
}

