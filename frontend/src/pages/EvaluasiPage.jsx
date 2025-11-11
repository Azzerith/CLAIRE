import { useState } from 'react';
import { BarChart3, TrendingUp, RefreshCw, Download, Filter } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { evaluasiAPI } from '../services/api';
import EvaluasiList from '../components/evaluasi/EvaluasiList';

export default function EvaluasiPage() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const { data: evaluasi, loading, error, refetch } = useApi(evaluasiAPI.getAll);

  const filteredEvaluasi = evaluasi?.filter(item => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'high') return item.akurasi >= 80;
    if (selectedFilter === 'medium') return item.akurasi >= 60 && item.akurasi < 80;
    if (selectedFilter === 'low') return item.akurasi < 60;
    return true;
  }) || [];

  const stats = {
    total: evaluasi?.length || 0,
    high: evaluasi?.filter(item => item.akurasi >= 80)?.length || 0,
    medium: evaluasi?.filter(item => item.akurasi >= 60 && item.akurasi < 80)?.length || 0,
    low: evaluasi?.filter(item => item.akurasi < 60)?.length || 0,
    avgAkurasi: evaluasi?.length ? 
      (evaluasi.reduce((sum, item) => sum + (item.akurasi || 0), 0) / evaluasi.length).toFixed(1) : 0
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-xl">
        <div className="flex items-center">
          <div className="shrink-0">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium">Gagal memuat data evaluasi</h3>
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
      {/* Header Section */}
      <div className="bg-linear-to-r from-emerald-500 to-teal-400 rounded-2xl p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Hasil Evaluasi</h1>
            <p className="text-emerald-100">
              Analisis dan rangkuman hasil monitoring pembelajaran dosen
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
              className="bg-white text-emerald-600 hover:bg-emerald-50 px-4 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all duration-200 hover:shadow-lg"
            >
              <Download className="h-5 w-5" />
              <span>Export Laporan</span>
            </button>
          </div>
        </div>
        
        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-emerald-100 text-sm">Total Evaluasi</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats.high}</div>
            <div className="text-emerald-100 text-sm">Akurasi Tinggi</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats.medium}</div>
            <div className="text-emerald-100 text-sm">Akurasi Sedang</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats.avgAkurasi}%</div>
            <div className="text-emerald-100 text-sm">Rata-rata Akurasi</div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Detail Evaluasi</h2>
            <p className="text-gray-600 text-sm">
              {filteredEvaluasi.length} hasil evaluasi ditemukan
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Filter Options */}
            <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-1">
              <Filter className="h-4 w-4 text-gray-500" />
              <select 
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="bg-transparent border-0 text-sm text-gray-700 focus:ring-0 focus:outline-none"
              >
                <option value="all">Semua</option>
                <option value="high">Tinggi (≥80%)</option>
                <option value="medium">Sedang (60-79%)</option>
                <option value="low">Rendah (&lt;60%)</option>
              </select>
            </div>

            {evaluasi && evaluasi.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>{stats.high} Tinggi</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span>{stats.medium} Sedang</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                  <span>{stats.low} Rendah</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <EvaluasiList 
          evaluasi={filteredEvaluasi} 
          loading={loading}
        />

        {/* Empty State */}
        {filteredEvaluasi.length === 0 && evaluasi?.length === 0 && (
          <div className="text-center py-16 bg-linear-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-dashed border-emerald-200">
            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <TrendingUp className="h-10 w-10 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-emerald-800 mb-2">Belum ada evaluasi</h3>
            <p className="text-emerald-600 max-w-sm mx-auto">
              Hasil evaluasi monitoring akan muncul di sini setelah sistem melakukan analisis
            </p>
          </div>
        )}

        {filteredEvaluasi.length === 0 && evaluasi?.length > 0 && (
          <div className="text-center py-16 bg-linear-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-dashed border-amber-200">
            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Filter className="h-10 w-10 text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold text-amber-800 mb-2">Tidak ada hasil</h3>
            <p className="text-amber-600 max-w-sm mx-auto">
              Tidak ditemukan evaluasi dengan filter yang dipilih
            </p>
          </div>
        )}
      </div>
    </div>
  );
}