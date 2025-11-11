import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { dosenAPI } from '../services/api';
import DosenForm from '../components/dosen/DosenForm';
import DosenList from '../components/dosen/DosenList';

export default function DosenPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingDosen, setEditingDosen] = useState(null);
  const { data: dosen, loading, error, refetch } = useApi(dosenAPI.getAll);

  const handleEdit = (dosen) => {
    setEditingDosen(dosen);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingDosen(null);
    refetch();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingDosen(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Dosen</h1>
          <p className="text-gray-600">Kelola data dosen dan sample suara untuk recognition</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Dosen</span>
        </button>
      </div>

      {showForm ? (
        <div className="card max-w-2xl">
          <h2 className="text-xl font-semibold mb-4">
            {editingDosen ? 'Edit Dosen' : 'Tambah Dosen Baru'}
          </h2>
          <DosenForm
            dosen={editingDosen}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <DosenList
          dosen={dosen || []}
          onEdit={handleEdit}
          onUpdate={refetch}
        />
      )}
    </div>
  );
}