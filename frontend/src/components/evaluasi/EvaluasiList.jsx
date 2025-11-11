import { useState } from 'react';
import { Filter, Download,BarChart3 } from 'lucide-react';
import EvaluasiCard from './EvaluasiCard';

export default function EvaluasiList({ evaluasi, loading }) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvaluasi = evaluasi?.filter(ev => {
    const matchesSearch = ev.jadwal?.nama_matkul?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ev.jadwal?.dosen?.nama?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'high') return matchesSearch && ev.skor_efektivitas >= 80;
    if (filter === 'medium') return matchesSearch && ev.skor_efektivitas >= 60 && ev.skor_efektivitas < 80;
    if (filter === 'low') return matchesSearch && ev.skor_efektivitas < 60;
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Filter dan Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Cari berdasarkan mata kuliah atau dosen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
          />
        </div>
        
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">Semua Evaluasi</option>
            <option value="high">Tinggi (≥80%)</option>
            <option value="medium">Sedang (60-79%)</option>
            <option value="low">Rendah (&lt;60%)</option>
          </select>
          
          <button className="btn-secondary flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-800">{evaluasi?.length || 0}</div>
          <div className="text-sm text-gray-600">Total Evaluasi</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {evaluasi?.filter(ev => ev.skor_efektivitas >= 80).length || 0}
          </div>
          <div className="text-sm text-gray-600">Tinggi</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {evaluasi?.filter(ev => ev.skor_efektivitas >= 60 && ev.skor_efektivitas < 80).length || 0}
          </div>
          <div className="text-sm text-gray-600">Sedang</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">
            {evaluasi?.filter(ev => ev.skor_efektivitas < 60).length || 0}
          </div>
          <div className="text-sm text-gray-600">Rendah</div>
        </div>
      </div>

      {/* Daftar Evaluasi */}
      <div className="grid gap-6">
        {filteredEvaluasi?.map((evaluasi) => (
          <EvaluasiCard key={evaluasi.id} evaluasi={evaluasi} />
        ))}
      </div>

      {filteredEvaluasi?.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filter !== 'all' ? 'Tidak ada evaluasi yang sesuai' : 'Belum ada evaluasi'}
          </h3>
          <p className="text-gray-500">
            {searchTerm || filter !== 'all' 
              ? 'Coba ubah pencarian atau filter Anda' 
              : 'Evaluasi akan muncul setelah proses rekaman dan analisis selesai'
            }
          </p>
        </div>
      )}
    </div>
  );
}