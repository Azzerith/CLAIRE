import { useState, useEffect } from 'react';
import { Edit2, Trash2, Mic, Square, Calendar, User, Clock, MapPin, Play, Pause, Radio, CheckCircle } from 'lucide-react';
import { jadwalAPI } from '../../services/api';

export default function JadwalList({ jadwal, onEdit, onUpdate }) {
  const [loading, setLoading] = useState(null);
  const [recordingAction, setRecordingAction] = useState(null);

  // Auto-refresh status setiap menit
  useEffect(() => {
    const interval = setInterval(() => {
      onUpdate();
    }, 60000); // Refresh setiap 1 menit

    return () => clearInterval(interval);
  }, [onUpdate]);

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;

    setLoading(id);
    try {
      await jadwalAPI.delete(id);
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.error || 'Terjadi kesalahan');
    } finally {
      setLoading(null);
    }
  };

  const handleRecording = async (id, action) => {
    setRecordingAction(`${action}-${id}`);
    try {
      if (action === 'start') {
        await jadwalAPI.mulaiRekaman(id);
      } else {
        await jadwalAPI.hentikanRekaman(id);
      }
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.error || 'Terjadi kesalahan');
    } finally {
      setRecordingAction(null);
    }
  };

  // Fungsi untuk mendapatkan nama hari dalam Bahasa Indonesia
  const getHariName = (hari) => {
    const hariMap = {
      'SENIN': 'Senin',
      'SELASA': 'Selasa',
      'RABU': 'Rabu',
      'KAMIS': 'Kamis',
      'JUMAT': 'Jumat',
      'SABTU': 'Sabtu',
      'MINGGU': 'Minggu'
    };
    return hariMap[hari] || hari;
  };

  const getStatusConfig = (jadwalItem) => {
    switch (jadwalItem.status) {
      case 'merekam':
        return {
          color: 'bg-red-100 border-red-200',
          textColor: 'text-red-700',
          icon: Radio,
          text: 'Sedang Merekam',
          dotColor: 'bg-red-500 animate-pulse'
        };
      
      case 'aktif':
        return {
          color: 'bg-emerald-100 border-emerald-200',
          textColor: 'text-emerald-700',
          icon: Play,
          text: 'Sedang Berlangsung',
          dotColor: 'bg-emerald-500 animate-pulse'
        };
      
      case 'selesai':
        return {
          color: 'bg-gray-100 border-gray-200',
          textColor: 'text-gray-700',
          icon: CheckCircle,
          text: 'Selesai',
          dotColor: 'bg-gray-500'
        };
      
      case 'terjadwal':
      default:
        return {
          color: 'bg-blue-100 border-blue-200',
          textColor: 'text-blue-700',
          icon: Calendar,
          text: 'Terjadwal',
          dotColor: 'bg-blue-500'
        };
    }
  };

  // Cek apakah bisa merekam (hanya untuk jadwal aktif yang tidak sedang merekam)
  const canRecord = (jadwalItem) => {
    return jadwalItem.status === 'aktif' && !jadwalItem.sedang_rekam;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      {jadwal.map((j) => {
        const statusConfig = getStatusConfig(j);
        const StatusIcon = statusConfig.icon;

        return (
          <div 
            key={j.id} 
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-200 transition-all duration-300"
          >
            {/* Header dengan status dan tombol aksi */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-3">
                  <h3 className="font-bold text-lg text-gray-800 truncate">{j.nama_matkul}</h3>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${statusConfig.color} ${statusConfig.textColor}`}>
                    <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`}></div>
                    <StatusIcon className="h-3 w-3" />
                    <span className="text-xs font-medium">{statusConfig.text}</span>
                  </div>
                </div>
                
                {/* Informasi Dosen */}
                <div className="flex items-center space-x-3 text-gray-600 mb-3">
                  <User className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">
                    {j.dosen?.nama} {j.dosen?.gelar && `- ${j.dosen.gelar}`}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-1 ml-4">
                {/* Tombol Rekam - hanya muncul untuk jadwal aktif */}
                {/* {canRecord(j) && (
                  <button
                    onClick={() => handleRecording(j.id, 'start')}
                    disabled={recordingAction === `start-${j.id}`}
                    className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Mulai Rekaman"
                  >
                    <Mic className="h-4 w-4" />
                    <span>{recordingAction === `start-${j.id}` ? '...' : 'Rekam'}</span>
                  </button>
                )} */}
                
                {/* Tombol Stop Rekam - hanya muncul untuk jadwal yang sedang merekam */}
                {j.sedang_rekam && (
                  <button
                    onClick={() => handleRecording(j.id, 'stop')}
                    disabled={recordingAction === `stop-${j.id}`}
                    className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Hentikan Rekaman"
                  >
                    <Square className="h-4 w-4" />
                    <span>{recordingAction === `stop-${j.id}` ? '...' : 'Stop'}</span>
                  </button>
                )}
                
                {/* Tombol Edit */}
                <button
                  onClick={() => onEdit(j)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:shadow-sm"
                  title="Edit Jadwal"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                
                {/* Tombol Hapus */}
                <button
                  onClick={() => handleDelete(j.id)}
                  disabled={loading === j.id}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Hapus Jadwal"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Detail Jadwal */}
            <div className="space-y-3 mb-4">
              {/* Hari */}
              <div className="flex items-center space-x-3 text-gray-600">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{getHariName(j.hari)}</span>
              </div>
              
              {/* Waktu */}
              <div className="flex items-center space-x-3 text-gray-600">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">
                  {j.waktu_mulai} - {j.waktu_selesai}
                </span>
              </div>
              
              {/* Ruangan */}
              {j.ruangan && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">{j.ruangan}</span>
                </div>
              )}
            </div>
            
            {/* Footer dengan timestamp */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Diupdate: {new Date(j.tanggal_diupdate).toLocaleString('id-ID')}
              </span>
              
              {/* Recording Indicator */}
              {j.status === 'aktif' && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-red-600 font-medium">LIVE</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {/* Empty State */}
      {jadwal.length === 0 && (
        <div className="col-span-full text-center py-16 bg-linear-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-dashed border-blue-200">
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
  );
}