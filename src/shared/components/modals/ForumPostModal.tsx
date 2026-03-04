import { memo } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const CATEGORIES = ["General", "Governance", "Technical", "Events", "Education"] as const;

interface ForumPostModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isPending: boolean;
  error?: string;
  postData: {
    title: string;
    content: string;
    category: string;
  };
  onChangePostData: (data: { title: string; content: string; category: string }) => void;
  submitLabel: string;
  pendingLabel: string;
}

export const ForumPostModal = memo(function ForumPostModal({
  title,
  isOpen,
  onClose,
  onSubmit,
  isPending,
  error,
  postData,
  onChangePostData,
  submitLabel,
  pendingLabel,
}: ForumPostModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title <span className="text-xs text-gray-500">({postData.title.length}/200)</span>
            </label>
            <input
              type="text"
              value={postData.title}
              onChange={(e) => onChangePostData({ ...postData, title: e.target.value.slice(0, 200) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
              placeholder="Enter post title..."
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={postData.category}
              onChange={(e) => onChangePostData({ ...postData, category: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Content <span className="text-xs text-gray-500">({postData.content.length}/10000)</span>
            </label>
            <textarea
              value={postData.content}
              onChange={(e) => onChangePostData({ ...postData, content: e.target.value.slice(0, 10000) })}
              rows={6}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
              placeholder="Write your post content here..."
              maxLength={10000}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={isPending || !postData.title.trim() || !postData.content.trim()}
              className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50"
            >
              {isPending ? pendingLabel : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
