import { useState } from 'react';
import { Edit2, Trash2, Mic, Square, Calendar, User, Clock } from 'lucide-react';
import { jadwalAPI } from '../../services/api';

export default function JadwalList({ jadwal, onEdit, onUpdate }) {
  const [loading, setLoading] = useState(null);
  const [recordingAction, setRecordingAction] = useState(null);

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'terjadwal': return 'text-blue-600 bg-blue-100';
      case 'merekam': return 'text-red-600 bg-red-100';
      case 'selesai': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'terjadwal': return 'Terjadwal';
      case 'merekam': return 'Sedang Merekam';
      case 'selesai': return 'Selesai';
      default: return status;
    }
  };

  const isUpcoming = (waktuMulai) => {
    return new Date(waktuMulai) > new Date();
  };

  const isOngoing = (waktuMulai, waktuSelesai) => {
    const now = new Date();
    return now >= new Date(waktuMulai) && now <= new Date(waktuSelesai);
  };

  return (
    <div className="space-y-4">
      {jadwal.map((j) => (
        <div key={j.id} className="card">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-semibold text-lg text-gray-800">{j.nama_matkul}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(j.status)}`}>
                  {getStatusText(j.status)}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  <span>{j.dosen?.nama} {j.dosen?.gelar && `- ${j.dosen.gelar}`}</span>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    {new Date(j.waktu_mulai).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>
                    {new Date(j.waktu_mulai).toLocaleTimeString('id-ID')} - {' '}
                    {new Date(j.waktu_selesai).toLocaleTimeString('id-ID')}
                  </span>
                </div>
                
                {j.ruangan && (
                  <div>
                    <span className="font-medium">Ruangan:</span> {j.ruangan}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2 ml-4">
              {!j.sedang_rekam && isOngoing(j.waktu_mulai, j.waktu_selesai) && (
                <button
                  onClick={() => handleRecording(j.id, 'start')}
                  disabled={recordingAction === `start-${j.id}`}
                  className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  <Mic className="h-4 w-4" />
                  <span>{recordingAction === `start-${j.id}` ? 'Memulai...' : 'Mulai Rekam'}</span>
                </button>
              )}
              
              {j.sedang_rekam && (
                <button
                  onClick={() => handleRecording(j.id, 'stop')}
                  disabled={recordingAction === `stop-${j.id}`}
                  className="flex items-center space-x-1 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  <Square className="h-4 w-4" />
                  <span>{recordingAction === `stop-${j.id}` ? 'Menghentikan...' : 'Stop Rekam'}</span>
                </button>
              )}
              
              <button
                onClick={() => onEdit(j)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => handleDelete(j.id)}
                disabled={loading === j.id}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Hapus"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            Terakhir update: {new Date(j.tanggal_diupdate).toLocaleString('id-ID')}
          </div>
        </div>
      ))}
      
      {jadwal.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada jadwal</h3>
          <p className="text-gray-500">Buat jadwal pertama Anda untuk memulai monitoring</p>
        </div>
      )}
    </div>
  );
}