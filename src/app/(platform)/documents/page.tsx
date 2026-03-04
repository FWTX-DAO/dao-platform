'use client';

import { useDocuments } from '@hooks/useDocuments';

export default function DocumentsPage() {
  const { data: docs = [], isLoading } = useDocuments();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
      <p className="text-gray-600">DAO documents and files stored on IPFS</p>
      {isLoading ? (
        <div className="py-8 text-center text-gray-500">Loading documents\u2026</div>
      ) : docs.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No documents yet.</div>
      ) : (
        <div className="space-y-4">
          {docs.map((doc: any) => (
            <div key={doc.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{doc.title || doc.name}</h3>
                  {doc.description && <p className="text-sm text-gray-600 mt-1">{doc.description}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    {doc.category} · {doc.author_name || 'Anonymous'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
