import { useApi } from '../hooks/useApi';
import { dosenAPI, jadwalAPI, evaluasiAPI } from '../services/api';
import { Users, Calendar, BarChart3, Mic, TrendingUp, Clock, Activity } from 'lucide-react';

export default function Dashboard() {
  const { data: dosen, loading: loadingDosen } = useApi(dosenAPI.getAll);
  const { data: jadwal, loading: loadingJadwal } = useApi(jadwalAPI.getAll);
  const { data: evaluasi, loading: loadingEvaluasi } = useApi(evaluasiAPI.getAll);

  // Fungsi untuk mendapatkan nama hari dalam Bahasa Indonesia
  const getTodayName = () => {
    const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    return days[new Date().getDay()];
  };

  const stats = [
    {
      title: 'Total Dosen',
      value: dosen?.length || 0,
      icon: Users,
      color: 'indigo',
      description: 'Dosen terdaftar'
    },
    {
      title: 'Jadwal Hari Ini',
      value: jadwal?.filter(j => j.hari === getTodayName())?.length || 0,
      icon: Calendar,
      color: 'emerald',
      description: 'Jadwal untuk hari ini'
    },
    {
      title: 'Total Evaluasi',
      value: evaluasi?.length || 0,
      icon: BarChart3,
      color: 'purple',
      description: 'Evaluasi selesai'
    },
    {
      title: 'Sedang Rekam',
      value: jadwal?.filter(j => j.status === 'merekam')?.length || 0,
      icon: Mic,
      color: 'rose',
      description: 'Sedang aktif merekam'
    },
  ];

  const recentEvaluasi = evaluasi?.slice(0, 5) || [];
  
  // Jadwal aktif dan terjadwal untuk upcoming
  const upcomingJadwal = jadwal
    ?.filter(j => j.status === 'aktif' || j.status === 'terjadwal')
    ?.slice(0, 5) || [];

  if (loadingDosen || loadingJadwal || loadingEvaluasi) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const averageEffectiveness = evaluasi?.length > 0 
    ? (evaluasi.reduce((sum, ev) => sum + ev.skor_efektivitas, 0) / evaluasi.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-linear-to-r from-indigo-500 to-purple-400 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-indigo-100">Overview sistem monitoring pengajar CLAIRE</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            indigo: 'bg-indigo-100 text-indigo-600',
            emerald: 'bg-emerald-100 text-emerald-600',
            purple: 'bg-purple-100 text-purple-600',
            rose: 'bg-rose-100 text-rose-600'
          };
          
          return (
            <div key={stat.title} className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Evaluations */}
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Evaluasi Terbaru</h2>
            <div className="p-2 bg-indigo-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          
          <div className="space-y-4">
            {recentEvaluasi.map((evalItem) => (
              <div key={evalItem.id} className="flex items-center justify-between p-4 bg-linear-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-100 hover:border-indigo-200 transition-colors duration-200">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 truncate">{evalItem.jadwal?.nama_matkul}</p>
                  <p className="text-sm text-gray-600 truncate">{evalItem.jadwal?.dosen?.nama}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  evalItem.skor_efektivitas >= 80 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                  evalItem.skor_efektivitas >= 60 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                  'bg-rose-100 text-rose-800 border border-rose-200'
                }`}>
                  {evalItem.skor_efektivitas}%
                </div>
              </div>
            ))}
            
            {recentEvaluasi.length === 0 && (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Belum ada evaluasi</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Schedule */}
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Jadwal Aktif</h2>
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Clock className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          
          <div className="space-y-4">
            {upcomingJadwal.map((jadwalItem) => {
              // Konfigurasi status
              const getStatusConfig = () => {
                switch (jadwalItem.status) {
                  case 'merekam':
                    return {
                      color: 'bg-rose-100 text-rose-800',
                      text: 'Live'
                    };
                  case 'aktif':
                    return {
                      color: 'bg-emerald-100 text-emerald-800',
                      text: 'Aktif'
                    };
                  case 'terjadwal':
                    return {
                      color: 'bg-blue-100 text-blue-800',
                      text: 'Terjadwal'
                    };
                  default:
                    return {
                      color: 'bg-gray-100 text-gray-800',
                      text: jadwalItem.status
                    };
                }
              };

              const statusConfig = getStatusConfig();

              return (
                <div key={jadwalItem.id} className="p-4 bg-linear-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100 hover:border-purple-200 transition-colors duration-200">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-gray-800 flex-1">{jadwalItem.nama_matkul}</p>
                    <span className={`ml-2 px-2 py-1 ${statusConfig.color} text-xs rounded-full font-medium`}>
                      {statusConfig.text}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{jadwalItem.dosen?.nama}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {jadwalItem.hari}
                    </span>
                    <span>
                      {jadwalItem.waktu_mulai} - {jadwalItem.waktu_selesai}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {upcomingJadwal.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Tidak ada jadwal aktif</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-linear-to-br from-indigo-500 to-purple-400 rounded-xl p-6 text-white text-center hover:shadow-lg transition-shadow duration-300">
          <Activity className="h-8 w-8 mx-auto mb-3 text-indigo-200" />
          <div className="text-3xl font-bold mb-1">{averageEffectiveness}%</div>
          <div className="text-indigo-100 text-sm">Rata-rata Efektivitas</div>
        </div>
        
        <div className="bg-linear-to-br from-emerald-500 to-green-400 rounded-xl p-6 text-white text-center hover:shadow-lg transition-shadow duration-300">
          <TrendingUp className="h-8 w-8 mx-auto mb-3 text-emerald-200" />
          <div className="text-3xl font-bold mb-1">
            {evaluasi?.filter(ev => ev.kepercayaan_pembicara >= 0.8).length || 0}
          </div>
          <div className="text-emerald-100 text-sm">Identifikasi Akurat</div>
        </div>
        
        <div className="bg-linear-to-br from-blue-500 to-cyan-400 rounded-xl p-6 text-white text-center hover:shadow-lg transition-shadow duration-300">
          <Users className="h-8 w-8 mx-auto mb-3 text-blue-200" />
          <div className="text-3xl font-bold mb-1">
            {jadwal?.filter(j => j.status === 'selesai').length || 0}
          </div>
          <div className="text-blue-100 text-sm">Sesi Selesai</div>
        </div>
      </div>
    </div>
  );
}