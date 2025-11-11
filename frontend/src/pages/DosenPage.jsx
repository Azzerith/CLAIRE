import { useState } from 'react';
import { Plus, Users, RefreshCw } from 'lucide-react';
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-xl">
        <div className="flex items-center">
          <div className="shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium">Gagal memuat data dosen</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={refetch}
            className="ml-auto bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section - hanya ditampilkan saat tidak dalam mode form */}
      {!showForm && (
        <div className="bg-linear-to-r from-indigo-500 to-purple-400 rounded-2xl p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-2">Manajemen Dosen</h1>
              <p className="text-indigo-100">
                Kelola data dosen dan sample suara untuk sistem recognition CLAIRE
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={refetch}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 backdrop-blur-sm"
                title="Refresh Data"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all duration-200 hover:shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span>Tambah Dosen</span>
              </button>
            </div>
          </div>
          
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{dosen?.length || 0}</div>
              <div className="text-indigo-100 text-sm">Total Dosen</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {dosen?.filter(d => d.path_sample_suara)?.length || 0}
              </div>
              <div className="text-indigo-100 text-sm">Sample Tersedia</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {dosen?.filter(d => !d.path_sample_suara)?.length || 0}
              </div>
              <div className="text-indigo-100 text-sm">Perlu Sample</div>
            </div>
          </div>
        </div>
      )}

      {/* Content Section */}
      {showForm ? (
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-indigo-800">
                {editingDosen ? 'Edit Data Dosen' : 'Tambah Dosen Baru'}
              </h2>
              <p className="text-indigo-600 text-sm mt-1">
                {editingDosen 
                  ? 'Perbarui informasi dosen dan sample suara' 
                  : 'Tambahkan dosen baru ke dalam sistem CLAIRE'
                }
              </p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          
          <DosenForm
            dosen={editingDosen}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Daftar Dosen</h2>
              <p className="text-gray-600 text-sm">
                {dosen?.length || 0} dosen terdaftar dalam sistem
              </p>
            </div>
            {dosen && dosen.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>
                  {dosen.filter(d => d.path_sample_suara).length} dengan sample suara
                </span>
              </div>
            )}
          </div>
          
          <DosenList
            dosen={dosen || []}
            onEdit={handleEdit}
            onUpdate={refetch}
          />
        </div>
      )}
    </div>
  );
}