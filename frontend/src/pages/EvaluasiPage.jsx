import { useApi } from '../hooks/useApi';
import { evaluasiAPI } from '../services/api';
import EvaluasiList from '../components/evaluasi/EvaluasiList';

export default function EvaluasiPage() {
  const { data: evaluasi, loading, error, refetch } = useApi(evaluasiAPI.getAll);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Hasil Evaluasi</h1>
        <p className="text-gray-600">Analisis dan rangkuman hasil monitoring pembelajaran</p>
      </div>

      <EvaluasiList 
        evaluasi={evaluasi || []} 
        loading={loading}
      />
    </div>
  );
}