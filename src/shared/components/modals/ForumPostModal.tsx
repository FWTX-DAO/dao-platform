import { memo } from "react";
import { X } from "lucide-react";

const CATEGORIES = [
  "General",
  "Governance",
  "Technical",
  "Events",
  "Education",
] as const;

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
  onChangePostData: (data: {
    title: string;
    content: string;
    category: string;
  }) => void;
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
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
      style={{ overscrollBehavior: "contain" }}
    >
      <div className="bg-white rounded-t-xl sm:rounded-lg w-full sm:max-w-2xl p-6 sm:my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 focus-visible:ring-2 focus-visible:outline-hidden rounded-md p-2 -m-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {error && (
          <div
            role="alert"
            className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-sm"
          >
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title{" "}
              <span className="text-xs text-gray-500">
                ({postData.title.length}/200)
              </span>
            </label>
            <input
              type="text"
              name="title"
              autoComplete="off"
              value={postData.title}
              onChange={(e) =>
                onChangePostData({
                  ...postData,
                  title: e.target.value.slice(0, 200),
                })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-xs focus:border-violet-500 focus:ring-violet-500"
              placeholder="Enter post title..."
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              name="category"
              value={postData.category}
              onChange={(e) =>
                onChangePostData({ ...postData, category: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-xs focus:border-violet-500 focus:ring-violet-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Content{" "}
              <span className="text-xs text-gray-500">
                ({postData.content.length}/10000)
              </span>
            </label>
            <textarea
              name="content"
              value={postData.content}
              onChange={(e) =>
                onChangePostData({
                  ...postData,
                  content: e.target.value.slice(0, 10000),
                })
              }
              rows={6}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-xs focus:border-violet-500 focus:ring-violet-500"
              placeholder="Write your post content here..."
              maxLength={10000}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 focus-visible:ring-2 focus-visible:outline-hidden min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={
                isPending || !postData.title.trim() || !postData.content.trim()
              }
              className="px-4 py-2.5 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 focus-visible:ring-2 focus-visible:outline-hidden min-h-[44px]"
            >
              {isPending ? pendingLabel : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
