import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { jadwalAPI } from '../services/api';
import JadwalForm from '../components/jadwal/JadwalForm';
import JadwalList from '../components/jadwal/JadwalList';

export default function JadwalPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingJadwal, setEditingJadwal] = useState(null);
  const { data: jadwal, loading, error, refetch } = useApi(jadwalAPI.getAll);

  const handleEdit = (jadwal) => {
    setEditingJadwal(jadwal);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingJadwal(null);
    refetch();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingJadwal(null);
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
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Jadwal</h1>
          <p className="text-gray-600">Atur jadwal pembelajaran dan monitoring</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Jadwal</span>
        </button>
      </div>

      {showForm ? (
        <div className="card max-w-2xl">
          <h2 className="text-xl font-semibold mb-4">
            {editingJadwal ? 'Edit Jadwal' : 'Buat Jadwal Baru'}
          </h2>
          <JadwalForm
            jadwal={editingJadwal}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <JadwalList
          jadwal={jadwal || []}
          onEdit={handleEdit}
          onUpdate={refetch}
        />
      )}
    </div>
  );
}