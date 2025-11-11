import { Calendar, User, BarChart3, Clock } from 'lucide-react';

export default function EvaluasiCard({ evaluasi }) {
  const getEffectivenessColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg text-gray-800">
            {evaluasi.jadwal?.nama_matkul}
          </h3>
          <p className="text-gray-600 flex items-center">
            <User className="h-4 w-4 mr-1" />
            {evaluasi.jadwal?.dosen?.nama}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getEffectivenessColor(evaluasi.skor_efektivitas)}`}>
          {evaluasi.skor_efektivitas}%
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-sm">
          <span className="text-gray-500">Kepercayaan Pembicara:</span>
          <span className={`ml-2 font-medium ${getConfidenceColor(evaluasi.kepercayaan_pembicara)}`}>
            {(evaluasi.kepercayaan_pembicara * 100).toFixed(1)}%
          </span>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Waktu Pemrosesan:</span>
          <span className="ml-2 font-medium text-gray-800">
            {evaluasi.waktu_pemrosesan}s
          </span>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
          <BarChart3 className="h-4 w-4 mr-2" />
          Rangkuman Materi
        </h4>
        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          {evaluasi.rangkuman || 'Tidak ada rangkuman tersedia'}
        </p>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold text-gray-700 mb-2">Transkripsi</h4>
        <div className="max-h-32 overflow-y-auto">
          <p className="text-sm text-gray-600">
            {evaluasi.teks_transkripsi || 'Tidak ada transkripsi tersedia'}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          {new Date(evaluasi.tanggal_dibuat).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
        <div className="flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          {new Date(evaluasi.tanggal_dibuat).toLocaleTimeString('id-ID')}
        </div>
      </div>
    </div>
  );
}