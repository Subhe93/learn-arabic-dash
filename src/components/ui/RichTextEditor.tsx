import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import CodeBlock from '@tiptap/extension-code-block';
import Blockquote from '@tiptap/extension-blockquote';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { useCallback, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon, Link as LinkIcon, Undo, Redo, Heading1, Heading2, Heading3, Table as TableIcon, Code, Quote, Minus } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  onUploadProgress?: (progress: number) => void;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'اكتب المحتوى هنا...',
  label,
  onUploadProgress,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        codeBlock: false, // سنستخدم extension منفصل
        blockquote: false, // سنستخدم extension منفصل
      }),
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: 'tiptap-image',
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: 'right',
      }),
      Underline,
      Placeholder.configure({
        placeholder: placeholder,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'tiptap-table',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'tiptap-table-row',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'tiptap-table-header',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'tiptap-table-cell',
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'tiptap-code-block',
        },
      }),
      Blockquote.configure({
        HTMLAttributes: {
          class: 'tiptap-blockquote',
        },
      }),
      HorizontalRule.configure({
        HTMLAttributes: {
          class: 'tiptap-horizontal-rule',
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[200px] p-4',
        dir: 'rtl',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // رفع الصور
  const imageUploadHandler = useCallback(async () => {
    if (!editor) return;
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await api.post(API_ENDPOINTS.upload.image, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            if (onUploadProgress) onUploadProgress(progress);
          },
        });

        const imageUrl = response.data.path || response.data.url || response.data.data?.path || response.data.data?.url;
        if (imageUrl) {
          // إضافة /uploads إذا لم تكن موجودة وإضافة API_BASE_URL
          let finalUrl = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
          if (!finalUrl.startsWith('uploads/')) {
            finalUrl = `uploads/${finalUrl}`;
          }
          const fullUrl = `${API_BASE_URL}/${finalUrl}`;
          editor.chain().focus().setImage({ src: fullUrl }).run();
          toast.success('تم رفع الصورة بنجاح');
        }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err.response?.data?.message || 'فشل في رفع الصورة');
      }
    };
  }, [editor, onUploadProgress]);

  // رفع الفيديو
  const videoUploadHandler = useCallback(async () => {
    if (!editor) return;
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'video/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await api.post(API_ENDPOINTS.upload.video, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            if (onUploadProgress) onUploadProgress(progress);
          },
        });

        const videoUrl = response.data.path || response.data.url || response.data.data?.path || response.data.data?.url;
        if (videoUrl) {
          // إضافة /uploads إذا لم تكن موجودة وإضافة API_BASE_URL
          let finalUrl = videoUrl.startsWith('/') ? videoUrl.slice(1) : videoUrl;
          if (!finalUrl.startsWith('uploads/')) {
            finalUrl = `uploads/${finalUrl}`;
          }
          const fullUrl = `${API_BASE_URL}/${finalUrl}`;
          editor.chain().focus().insertContent(`<div class="tiptap-video-wrapper"><video controls width="100%" style="max-width: 100%; height: auto; border-radius: 0.5rem;"><source src="${fullUrl}" type="video/mp4"></video></div>`).run();
          toast.success('تم رفع الفيديو بنجاح');
        }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err.response?.data?.message || 'فشل في رفع الفيديو');
      }
    };
  }, [editor, onUploadProgress]);

  // رفع الصوت
  const audioUploadHandler = useCallback(async () => {
    if (!editor) return;
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'audio/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await api.post(API_ENDPOINTS.upload.audio, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            if (onUploadProgress) onUploadProgress(progress);
          },
        });

        const audioUrl = response.data.path || response.data.url || response.data.data?.path || response.data.data?.url;
        if (audioUrl) {
          // إضافة /uploads إذا لم تكن موجودة وإضافة API_BASE_URL
          let finalUrl = audioUrl.startsWith('/') ? audioUrl.slice(1) : audioUrl;
          if (!finalUrl.startsWith('uploads/')) {
            finalUrl = `uploads/${finalUrl}`;
          }
          const fullUrl = `${API_BASE_URL}/${finalUrl}`;
          editor.chain().focus().insertContent(`<div class="tiptap-audio-wrapper"><audio controls style="width: 100%; margin: 0.5rem 0;"><source src="${fullUrl}" type="audio/mpeg"></audio></div>`).run();
          toast.success('تم رفع الصوت بنجاح');
        }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err.response?.data?.message || 'فشل في رفع الصوت');
      }
    };
  }, [editor, onUploadProgress]);

  // تحديث المحتوى عند تغيير value من الخارج
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // إضافة التحكم بحجم الصور
  useEffect(() => {
    if (!editor) return;

    const handleImageClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'IMG' && target.classList.contains('tiptap-image')) {
        event.preventDefault();
        const currentWidth = target.style.width || target.getAttribute('width') || 'auto';
        const newWidth = window.prompt('أدخل عرض الصورة (بالبكسل أو % أو اتركه فارغاً للعرض التلقائي):', currentWidth === 'auto' ? '' : currentWidth);
        
        if (newWidth !== null) {
          if (newWidth === '') {
            target.style.width = '';
            target.style.height = '';
            target.removeAttribute('width');
            target.removeAttribute('height');
          } else {
            target.style.width = newWidth;
            target.setAttribute('width', newWidth);
            if (!newWidth.includes('%')) {
              target.style.height = 'auto';
            }
          }
          // تحديث المحتوى في المحرر
          const html = editor.getHTML();
          editor.commands.setContent(html);
        }
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('click', handleImageClick);

    return () => {
      editorElement.removeEventListener('click', handleImageClick);
    };
  }, [editor]);

  if (!editor) {
    return (
      <div>
        {label && <label className="block text-slate-600 text-sm mb-2">{label}</label>}
        <div className="input-field min-h-[200px] flex items-center justify-center text-slate-400">
          جاري تحميل المحرر...
        </div>
      </div>
    );
  }

  return (
    <div>
      {label && <label className="block text-slate-600 text-sm mb-2">{label}</label>}
      <div className="rich-text-editor-wrapper border border-slate-200 rounded-lg overflow-hidden bg-white border border-slate-200">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-slate-100 ${editor.isActive('heading', { level: 1 }) ? 'bg-slate-100' : ''}`}
            title="عنوان 1"
          >
            <Heading1 className="w-4 h-4 text-slate-600" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-slate-100 ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-100' : ''}`}
            title="عنوان 2"
          >
            <Heading2 className="w-4 h-4 text-slate-600" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded hover:bg-slate-100 ${editor.isActive('heading', { level: 3 }) ? 'bg-slate-100' : ''}`}
            title="عنوان 3"
          >
            <Heading3 className="w-4 h-4 text-slate-600" />
          </button>
          <div className="w-px h-6 bg-slate-100 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-slate-100 disabled:opacity-50 ${editor.isActive('bold') ? 'bg-slate-100' : ''}`}
            title="عريض"
          >
            <Bold className="w-4 h-4 text-slate-600" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-slate-100 disabled:opacity-50 ${editor.isActive('italic') ? 'bg-slate-100' : ''}`}
            title="مائل"
          >
            <Italic className="w-4 h-4 text-slate-600" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={!editor.can().chain().focus().toggleUnderline().run()}
            className={`p-2 rounded hover:bg-slate-100 disabled:opacity-50 ${editor.isActive('underline') ? 'bg-slate-100' : ''}`}
            title="تحته خط"
          >
            <UnderlineIcon className="w-4 h-4 text-slate-600" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-slate-100 disabled:opacity-50 ${editor.isActive('strike') ? 'bg-slate-100' : ''}`}
            title="خط في المنتصف"
          >
            <Strikethrough className="w-4 h-4 text-slate-600" />
          </button>
          <div className="w-px h-6 bg-slate-100 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-slate-100 ${editor.isActive('bulletList') ? 'bg-slate-100' : ''}`}
            title="قائمة نقطية"
          >
            <List className="w-4 h-4 text-slate-600" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-slate-100 ${editor.isActive('orderedList') ? 'bg-slate-100' : ''}`}
            title="قائمة مرقمة"
          >
            <ListOrdered className="w-4 h-4 text-slate-600" />
          </button>
          <div className="w-px h-6 bg-slate-100 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded hover:bg-slate-100 ${editor.isActive({ textAlign: 'right' }) ? 'bg-slate-100' : ''}`}
            title="محاذاة لليمين"
          >
            <AlignRight className="w-4 h-4 text-slate-600" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded hover:bg-slate-100 ${editor.isActive({ textAlign: 'center' }) ? 'bg-slate-100' : ''}`}
            title="محاذاة للوسط"
          >
            <AlignCenter className="w-4 h-4 text-slate-600" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded hover:bg-slate-100 ${editor.isActive({ textAlign: 'left' }) ? 'bg-slate-100' : ''}`}
            title="محاذاة لليسار"
          >
            <AlignLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div className="w-px h-6 bg-slate-100 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 rounded hover:bg-slate-100 ${editor.isActive('codeBlock') ? 'bg-slate-100' : ''}`}
            title="كود"
          >
            <Code className="w-4 h-4 text-slate-600" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-slate-100 ${editor.isActive('blockquote') ? 'bg-slate-100' : ''}`}
            title="اقتباس"
          >
            <Quote className="w-4 h-4 text-slate-600" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-2 rounded hover:bg-slate-100"
            title="خط أفقي"
          >
            <Minus className="w-4 h-4 text-slate-600" />
          </button>
          <div className="w-px h-6 bg-slate-100 mx-1" />
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
            }}
            className="p-2 rounded hover:bg-slate-100"
            title="إدراج جدول"
          >
            <TableIcon className="w-4 h-4 text-slate-600" />
          </button>
          {editor.isActive('table') && (
            <>
              <button
                type="button"
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                className="p-2 rounded hover:bg-slate-100"
                title="إضافة عمود قبل"
              >
                <span className="text-slate-600 text-xs">+C</span>
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                className="p-2 rounded hover:bg-slate-100"
                title="إضافة عمود بعد"
              >
                <span className="text-slate-600 text-xs">C+</span>
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteColumn().run()}
                className="p-2 rounded hover:bg-slate-100"
                title="حذف عمود"
              >
                <span className="text-slate-600 text-xs">-C</span>
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().addRowBefore().run()}
                className="p-2 rounded hover:bg-slate-100"
                title="إضافة صف قبل"
              >
                <span className="text-slate-600 text-xs">+R</span>
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().addRowAfter().run()}
                className="p-2 rounded hover:bg-slate-100"
                title="إضافة صف بعد"
              >
                <span className="text-slate-600 text-xs">R+</span>
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteRow().run()}
                className="p-2 rounded hover:bg-slate-100"
                title="حذف صف"
              >
                <span className="text-slate-600 text-xs">-R</span>
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="p-2 rounded hover:bg-slate-100"
                title="حذف الجدول"
              >
                <span className="text-slate-600 text-xs">×</span>
              </button>
            </>
          )}
          <div className="w-px h-6 bg-slate-100 mx-1" />
          <button
            type="button"
            onClick={imageUploadHandler}
            className="p-2 rounded hover:bg-slate-100"
            title="إدراج صورة"
          >
            <ImageIcon className="w-4 h-4 text-slate-600" />
          </button>
          <button
            type="button"
            onClick={videoUploadHandler}
            className="p-2 rounded hover:bg-slate-100"
            title="إدراج فيديو"
          >
            <span className="text-slate-600 text-sm">🎬</span>
          </button>
          <button
            type="button"
            onClick={audioUploadHandler}
            className="p-2 rounded hover:bg-slate-100"
            title="إدراج صوت"
          >
            <span className="text-slate-600 text-sm">🎵</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const url = window.prompt('أدخل رابط URL:');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            className={`p-2 rounded hover:bg-slate-100 ${editor.isActive('link') ? 'bg-slate-100' : ''}`}
            title="إدراج رابط"
          >
            <LinkIcon className="w-4 h-4 text-slate-600" />
          </button>
          <div className="w-px h-6 bg-slate-100 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="p-2 rounded hover:bg-slate-100 disabled:opacity-50"
            title="تراجع"
          >
            <Undo className="w-4 h-4 text-slate-600" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="p-2 rounded hover:bg-slate-100 disabled:opacity-50"
            title="إعادة"
          >
            <Redo className="w-4 h-4 text-slate-600" />
          </button>
        </div>
        {/* Editor Content */}
        <EditorContent editor={editor} />
      </div>
      <style>{`
        .rich-text-editor-wrapper .ProseMirror {
          outline: none;
          min-height: 200px;
          padding: 1rem;
          color: #000000;
          background: #ffffff;
          direction: rtl;
          text-align: right;
        }
        .rich-text-editor-wrapper .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: right;
          color: #64748b;
          pointer-events: none;
          height: 0;
        }
        /* تحسين الصور مع إمكانية التحكم بالحجم */
        .rich-text-editor-wrapper .ProseMirror img.tiptap-image {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
          cursor: pointer;
          display: block;
          position: relative;
          transition: opacity 0.2s;
        }
        .rich-text-editor-wrapper .ProseMirror img.tiptap-image:hover {
          opacity: 0.9;
          box-shadow: 0 0 0 2px #3b82f6;
        }
        .rich-text-editor-wrapper .ProseMirror img.tiptap-image.selected {
          box-shadow: 0 0 0 2px #3b82f6;
        }
        /* تحسين الفيديو */
        .rich-text-editor-wrapper .ProseMirror .tiptap-video-wrapper {
          margin: 0.5rem 0;
          position: relative;
        }
        .rich-text-editor-wrapper .ProseMirror .tiptap-video-wrapper video {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          display: block;
        }
        /* تحسين الصوت */
        .rich-text-editor-wrapper .ProseMirror .tiptap-audio-wrapper {
          margin: 0.5rem 0;
          padding: 0.5rem;
          background: #f1f5f9;
          border-radius: 0.5rem;
        }
        .rich-text-editor-wrapper .ProseMirror .tiptap-audio-wrapper audio {
          width: 100%;
        }
        .rich-text-editor-wrapper .ProseMirror a {
          color: #60a5fa;
          text-decoration: underline;
        }
        .rich-text-editor-wrapper .ProseMirror ul,
        .rich-text-editor-wrapper .ProseMirror ol {
          padding-right: 1.5rem;
          margin: 0.5rem 0;
        }
        .rich-text-editor-wrapper .ProseMirror h1,
        .rich-text-editor-wrapper .ProseMirror h2,
        .rich-text-editor-wrapper .ProseMirror h3,
        .rich-text-editor-wrapper .ProseMirror h4,
        .rich-text-editor-wrapper .ProseMirror h5,
        .rich-text-editor-wrapper .ProseMirror h6 {
          font-weight: bold;
          margin: 1rem 0 0.5rem 0;
        }
        .rich-text-editor-wrapper .ProseMirror h1 { font-size: 2rem; }
        .rich-text-editor-wrapper .ProseMirror h2 { font-size: 1.5rem; }
        .rich-text-editor-wrapper .ProseMirror h3 { font-size: 1.25rem; }
        /* Blockquote */
        .rich-text-editor-wrapper .ProseMirror .tiptap-blockquote {
          border-right: 4px solid #cbd5e1;
          padding-right: 1rem;
          margin: 0.5rem 0;
          color: #64748b;
          font-style: italic;
        }
        /* Code */
        .rich-text-editor-wrapper .ProseMirror code {
          background: #f1f5f9;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', monospace;
          color: #dc2626;
          font-size: 0.9em;
        }
        .rich-text-editor-wrapper .ProseMirror .tiptap-code-block {
          background: #f8fafc;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 0.5rem 0;
          border: 1px solid #cbd5e1;
        }
        .rich-text-editor-wrapper .ProseMirror .tiptap-code-block code {
          background: transparent;
          padding: 0;
          color: #1e293b;
        }
        /* Horizontal Rule */
        .rich-text-editor-wrapper .ProseMirror .tiptap-horizontal-rule {
          border: none;
          border-top: 2px solid #cbd5e1;
          margin: 1rem 0;
        }
        /* Tables */
        .rich-text-editor-wrapper .ProseMirror .tiptap-table {
          border-collapse: collapse;
          margin: 0.5rem 0;
          width: 100%;
          table-layout: fixed;
          overflow: hidden;
        }
        .rich-text-editor-wrapper .ProseMirror .tiptap-table td,
        .rich-text-editor-wrapper .ProseMirror .tiptap-table th {
          min-width: 1em;
          border: 1px solid #cbd5e1;
          padding: 0.5rem;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
          color: #000000;
        }
        .rich-text-editor-wrapper .ProseMirror .tiptap-table th {
          font-weight: bold;
          text-align: right;
          background-color: #f1f5f9;
          color: #1e293b;
        }
        .rich-text-editor-wrapper .ProseMirror .tiptap-table .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          background: rgba(59, 130, 246, 0.1);
          pointer-events: none;
        }
        .rich-text-editor-wrapper .ProseMirror .tiptap-table .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: -2px;
          width: 4px;
          background-color: #3b82f6;
          pointer-events: none;
        }
        .rich-text-editor-wrapper .ProseMirror .tiptap-table p {
          margin: 0;
        }
      `}</style>
    </div>
  );
}
