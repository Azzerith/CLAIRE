import { useState, useEffect } from 'react';
import { Edit2, Trash2, Mic, Square, Calendar, User, Clock, MapPin, Play, Pause, Radio, CheckCircle } from 'lucide-react';
import { jadwalAPI } from '../../services/api';

export default function JadwalList({ jadwal, onEdit, onUpdate }) {
  const [loading, setLoading] = useState(null);
  const [recordingAction, setRecordingAction] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState({});

  // Auto-refresh status setiap 30 detik untuk update lebih real-time
  useEffect(() => {
    const interval = setInterval(() => {
      onUpdate();
    }, 30000);

    return () => clearInterval(interval);
  }, [onUpdate]);

  // Effect untuk mengecek jadwal yang harus direkam
  useEffect(() => {
    const checkScheduledRecordings = () => {
      const now = new Date();
      const currentDay = getCurrentDayIndonesian();
      const currentTime = now.toTimeString().slice(0, 5); // Format HH:MM

      jadwal.forEach(j => {
        if (j.status === 'aktif' && j.hari === currentDay) {
          const recordingTimes = calculateRecordingTimes(j.waktu_mulai);
          
          // Cek apakah saat ini adalah waktu rekaman
          if (recordingTimes.includes(currentTime) && !recordingStatus[j.id]) {
            startAutoRecording(j.id);
          }
        }
      });
    };

    // Check setiap menit
    const recordingInterval = setInterval(checkScheduledRecordings, 60000);
    
    // Check immediately on mount
    checkScheduledRecordings();

    return () => clearInterval(recordingInterval);
  }, [jadwal, recordingStatus]);

  const getCurrentDayIndonesian = () => {
    const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    return days[new Date().getDay()];
  };

  const calculateRecordingTimes = (startTime) => {
    // Format: "08:00" -> rekaman pada 08:10 dan 08:15
    const [hours, minutes] = startTime.split(':').map(Number);
    
    // Rekaman pertama: 10 menit setelah mulai (08:10)
    const firstRecording = new Date();
    firstRecording.setHours(hours, minutes + 10, 0, 0);
    
    // Rekaman kedua: 13 menit 30 detik setelah rekaman pertama (08:23:30)
    const secondRecording = new Date(firstRecording);
    secondRecording.setMinutes(secondRecording.getMinutes() + 3, 30);
    
    return [
      firstRecording.toTimeString().slice(0, 5),
      secondRecording.toTimeString().slice(0, 5)
    ];
  };

  const startAutoRecording = async (jadwalId) => {
    console.log(`Auto recording started for jadwal: ${jadwalId}`);
    setRecordingStatus(prev => ({ ...prev, [jadwalId]: true }));
    
    try {
      // Panggil API untuk mulai rekaman otomatis
      await jadwalAPI.mulaiRekamanOtomatis(jadwalId);
      
      // Update status setelah rekaman selesai (simulasi 2.5 menit)
      setTimeout(() => {
        setRecordingStatus(prev => ({ ...prev, [jadwalId]: false }));
        onUpdate(); // Refresh data
      }, 150000); // 2.5 menit = 150 detik
      
    } catch (err) {
      console.error('Auto recording failed:', err);
      setRecordingStatus(prev => ({ ...prev, [jadwalId]: false }));
    }
  };

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
    // Jika sedang dalam proses rekaman otomatis
    if (recordingStatus[jadwalItem.id]) {
      return {
        color: 'bg-purple-100 border-purple-200',
        textColor: 'text-purple-700',
        icon: Radio,
        text: 'Auto Recording',
        dotColor: 'bg-purple-500 animate-pulse'
      };
    }

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

  // Cek apakah jadwal sedang berlangsung berdasarkan hari dan waktu
  const isJadwalActive = (jadwalItem) => {
    const now = new Date();
    const currentDay = getCurrentDayIndonesian();
    const currentTime = now.toTimeString().slice(0, 5);
    
    return jadwalItem.hari === currentDay && 
           currentTime >= jadwalItem.waktu_mulai && 
           currentTime <= jadwalItem.waktu_selesai;
  };

  // Cek apakah bisa merekam (hanya untuk jadwal aktif yang tidak sedang merekam)
  const canRecord = (jadwalItem) => {
    return jadwalItem.status === 'aktif' && !jadwalItem.sedang_rekam;
  };

  // Hitung waktu sampai rekaman berikutnya
  const getNextRecordingTime = (jadwalItem) => {
    if (jadwalItem.status !== 'aktif' || jadwalItem.hari !== getCurrentDayIndonesian()) {
      return null;
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const recordingTimes = calculateRecordingTimes(jadwalItem.waktu_mulai);
    
    const nextRecording = recordingTimes.find(time => time > currentTime);
    
    if (nextRecording) {
      const [nextHours, nextMinutes] = nextRecording.split(':').map(Number);
      const nextTime = new Date();
      nextTime.setHours(nextHours, nextMinutes, 0, 0);
      
      const diffMs = nextTime - now;
      const diffMins = Math.floor(diffMs / 60000);
      
      return diffMins;
    }
    
    return null;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      {jadwal.map((j) => {
        const statusConfig = getStatusConfig(j);
        const StatusIcon = statusConfig.icon;
        const nextRecording = getNextRecordingTime(j);
        const isActiveNow = isJadwalActive(j);

        return (
          <div 
            key={j.id} 
            className={`bg-white rounded-xl shadow-sm border-2 p-6 hover:shadow-md transition-all duration-300 ${
              recordingStatus[j.id] 
                ? 'border-purple-300 bg-purple-50' 
                : isActiveNow 
                  ? 'border-emerald-200' 
                  : 'border-gray-200'
            }`}
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

                {/* Next Recording Info */}
                {nextRecording !== null && nextRecording <= 15 && (
                  <div className="flex items-center space-x-2 text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-lg">
                    <Radio className="h-3 w-3" />
                    <span className="font-medium">
                      Auto record in {nextRecording} {nextRecording === 1 ? 'minute' : 'minutes'}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-1 ml-4">
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
                {isActiveNow && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                    LIVE NOW
                  </span>
                )}
              </div>
              
              {/* Ruangan */}
              {j.ruangan && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">{j.ruangan}</span>
                </div>
              )}

              {/* Recording Schedule */}
              {j.status === 'aktif' && j.hari === getCurrentDayIndonesian() && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 text-sm text-blue-700 mb-2">
                    <Radio className="h-3 w-3" />
                    <span className="font-medium">Auto Recording Schedule</span>
                  </div>
                  <div className="text-xs text-blue-600 space-y-1">
                    {calculateRecordingTimes(j.waktu_mulai).map((time, index) => (
                      <div key={index} className="flex justify-between">
                        <span>Session {index + 1}:</span>
                        <span className="font-medium">{time} (2m 30s)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer dengan timestamp */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Diupdate: {new Date(j.tanggal_diupdate).toLocaleString('id-ID')}
              </span>
              
              {/* Recording Indicator */}
              {(recordingStatus[j.id] || j.status === 'aktif') && (
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    recordingStatus[j.id] ? 'bg-purple-500' : 'bg-emerald-500'
                  } animate-pulse`}></div>
                  <span className={`text-xs font-medium ${
                    recordingStatus[j.id] ? 'text-purple-600' : 'text-emerald-600'
                  }`}>
                    {recordingStatus[j.id] ? 'RECORDING' : 'LIVE'}
                  </span>
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