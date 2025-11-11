import { useApi } from '../hooks/useApi';
import { dosenAPI, jadwalAPI, evaluasiAPI } from '../services/api';
import { Users, Calendar, BarChart3, Mic, TrendingUp, Clock } from 'lucide-react';

export default function Dashboard() {
  const { data: dosen, loading: loadingDosen } = useApi(dosenAPI.getAll);
  const { data: jadwal, loading: loadingJadwal } = useApi(jadwalAPI.getAll);
  const { data: evaluasi, loading: loadingEvaluasi } = useApi(evaluasiAPI.getAll);

  const stats = [
    {
      title: 'Total Dosen',
      value: dosen?.length || 0,
      icon: Users,
      color: 'blue',
      description: 'Dosen terdaftar'
    },
    {
      title: 'Jadwal Hari Ini',
      value: jadwal?.filter(j => {
        const today = new Date().toDateString();
        return new Date(j.waktu_mulai).toDateString() === today;
      })?.length || 0,
      icon: Calendar,
      color: 'green',
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
      value: jadwal?.filter(j => j.sedang_rekam)?.length || 0,
      icon: Mic,
      color: 'red',
      description: 'Sedang aktif merekam'
    },
  ];

  const recentEvaluasi = evaluasi?.slice(0, 5) || [];
  const upcomingJadwal = jadwal
    ?.filter(j => new Date(j.waktu_mulai) > new Date())
    ?.sort((a, b) => new Date(a.waktu_mulai) - new Date(b.waktu_mulai))
    ?.slice(0, 5) || [];

  if (loadingDosen || loadingJadwal || loadingEvaluasi) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const averageEffectiveness = evaluasi?.length > 0 
    ? (evaluasi.reduce((sum, ev) => sum + ev.skor_efektivitas, 0) / evaluasi.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview sistem monitoring pengajar CLAIRE</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-800">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Evaluations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Evaluasi Terbaru</h2>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {recentEvaluasi.map((evalItem) => (
              <div key={evalItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{evalItem.jadwal?.nama_matkul}</p>
                  <p className="text-sm text-gray-600">{evalItem.jadwal?.dosen?.nama}</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  evalItem.skor_efektivitas >= 80 ? 'bg-green-100 text-green-800' :
                  evalItem.skor_efektivitas >= 60 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {evalItem.skor_efektivitas}%
                </div>
              </div>
            ))}
            
            {recentEvaluasi.length === 0 && (
              <p className="text-center text-gray-500 py-4">Belum ada evaluasi</p>
            )}
          </div>
        </div>

        {/* Upcoming Schedule */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Jadwal Mendatang</h2>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {upcomingJadwal.map((jadwalItem) => (
              <div key={jadwalItem.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800">{jadwalItem.nama_matkul}</p>
                <p className="text-sm text-gray-600">{jadwalItem.dosen?.nama}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(jadwalItem.waktu_mulai).toLocaleString('id-ID')}
                </p>
              </div>
            ))}
            
            {upcomingJadwal.length === 0 && (
              <p className="text-center text-gray-500 py-4">Tidak ada jadwal mendatang</p>
            )}
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">{averageEffectiveness}%</div>
          <div className="text-sm text-gray-600">Rata-rata Efektivitas</div>
        </div>
        
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">
            {evaluasi?.filter(ev => ev.kepercayaan_pembicara >= 0.8).length || 0}
          </div>
          <div className="text-sm text-gray-600">Identifikasi Akurat</div>
        </div>
        
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">
            {jadwal?.filter(j => j.status === 'selesai').length || 0}
          </div>
          <div className="text-sm text-gray-600">Sesi Selesai</div>
        </div>
      </div>
    </div>
  );
}