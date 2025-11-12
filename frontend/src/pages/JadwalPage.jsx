import { useState } from 'react';
import { Plus, Calendar, RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react';
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

  // Stats calculation - disesuaikan dengan status baru
  const stats = {
    total: jadwal?.length || 0,
    active: jadwal?.filter(item => item.status === 'aktif' || item.status === 'merekam')?.length || 0,
    completed: jadwal?.filter(item => item.status === 'selesai')?.length || 0,
    today: jadwal?.filter(item => {
      const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' }).toUpperCase();
      return item.hari === today;
    })?.length || 0
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-xl">
        <div className="flex items-center">
          <div className="shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium">Gagal memuat data jadwal</h3>
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
        <div className="bg-linear-to-r from-blue-500 to-cyan-400 rounded-2xl p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-2">Manajemen Jadwal</h1>
              <p className="text-blue-100">
                Atur jadwal pembelajaran dan monitoring dosen
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
                className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all duration-200 hover:shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span>Buat Jadwal</span>
              </button>
            </div>
          </div>
          
          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-blue-100 text-sm">Total Jadwal</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.active}</div>
              <div className="text-blue-100 text-sm">Jadwal Aktif</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.today}</div>
              <div className="text-blue-100 text-sm">Hari Ini</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.completed}</div>
              <div className="text-blue-100 text-sm">Selesai</div>
            </div>
          </div>
        </div>
      )}

      {/* Content Section */}
      {showForm ? (
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-blue-800">
                {editingJadwal ? 'Edit Jadwal' : 'Buat Jadwal Baru'}
              </h2>
              <p className="text-blue-600 text-sm mt-1">
                {editingJadwal 
                  ? 'Perbarui informasi jadwal pembelajaran' 
                  : 'Tambahkan jadwal monitoring baru ke dalam sistem'
                }
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          
          <JadwalForm
            jadwal={editingJadwal}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Daftar Jadwal</h2>
              <p className="text-gray-600 text-sm">
                {jadwal?.length || 0} jadwal terdaftar dalam sistem
              </p>
            </div>
            {jadwal && jadwal.length > 0 && (
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>{stats.active} Aktif</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span>{stats.completed} Selesai</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4 text-amber-500" />
                  <span>{stats.today} Hari Ini</span>
                </div>
              </div>
            )}
          </div>
          
          <JadwalList
            jadwal={jadwal || []}
            onEdit={handleEdit}
            onUpdate={refetch}
          />

          {/* Empty State */}
          {jadwal?.length === 0 && (
            <div className="text-center py-16 bg-linear-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-dashed border-blue-200">
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Calendar className="h-10 w-10 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-blue-800 mb-2">Belum ada jadwal</h3>
              <p className="text-blue-600 max-w-sm mx-auto">
                Buat jadwal pertama Anda untuk memulai monitoring dengan sistem CLAIRE
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}