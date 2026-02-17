import McqSingleForm from './types/McqSingleForm';
import McqMultipleForm from './types/McqMultipleForm';
import MatchImageTextForm from './types/MatchImageTextForm';
import DrawCircleForm from './types/DrawCircleForm';
import ListenRepeatForm from './types/ListenRepeatForm';
import BreakWordForm from './types/BreakWordForm';
import ComposeWordForm from './types/ComposeWordForm';
import WriteWordsForm from './types/WriteWordsForm';
import FillSentenceForm from './types/FillSentenceForm';
import OrderWordsForm from './types/OrderWordsForm';
import SelectImageTextForm from './types/SelectImageTextForm';
import ReadQuestionForm from './types/ReadQuestionForm';
import FreeTextForm from './types/FreeTextForm';
import FreeTextUploadForm from './types/FreeTextUploadForm';

interface QuestionFormProps {
  type: string;
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
  onUpload: (file: File, type: 'image' | 'audio' | 'file') => Promise<string | null>;
  isUploading?: boolean;
  uploadProgress?: number;
}

export default function QuestionForm({
  type,
  content,
  onChange,
  onUpload,
  isUploading = false,
  uploadProgress = 0,
}: QuestionFormProps) {
  const handleImageUpload = async (file: File) => {
    return onUpload(file, 'image');
  };

  const handleAudioUpload = async (file: File) => {
    return onUpload(file, 'audio');
  };

  switch (type) {
    case 'mcq_single':
      return <McqSingleForm content={content} onChange={onChange} />;
    
    case 'mcq_multiple':
      return <McqMultipleForm content={content} onChange={onChange} />;
    
    case 'match_image_text':
      return (
        <MatchImageTextForm
          content={content}
          onChange={onChange}
          onUpload={handleImageUpload}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
        />
      );
    
    case 'draw_circle_single':
    case 'draw_circle_multiple':
      return <DrawCircleForm content={content} onChange={onChange} />;
    
    case 'listen_repeat':
      return (
        <ListenRepeatForm
          content={content}
          onChange={onChange}
          onUpload={handleAudioUpload}
          isUploading={isUploading}
        />
      );
    
    case 'break_word':
      return <BreakWordForm content={content} onChange={onChange} />;
    
    case 'compose_word':
      return <ComposeWordForm content={content} onChange={onChange} />;
    
    case 'write_words':
      return <WriteWordsForm content={content} onChange={onChange} />;
    
    case 'fill_sentence':
      return <FillSentenceForm content={content} onChange={onChange} />;
    
    case 'order_words':
      return <OrderWordsForm content={content} onChange={onChange} />;
    
    case 'select_image_text':
      return (
        <SelectImageTextForm
          content={content}
          onChange={onChange}
          onUpload={handleImageUpload}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
        />
      );
    
    case 'read_question':
      return (
        <ReadQuestionForm
          content={content}
          onChange={onChange}
          onUpload={handleImageUpload}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
        />
      );
    
    case 'free_text':
      return <FreeTextForm content={content} onChange={onChange} />;
    
    case 'free_text_upload':
      return <FreeTextUploadForm content={content} onChange={onChange} />;
    
    default:
      return (
        <div>
          <p className="text-slate-500 text-sm">نوع سؤال غير معروف</p>
        </div>
      );
  }
}

