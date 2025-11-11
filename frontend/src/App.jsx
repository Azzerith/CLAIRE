import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import DosenPage from './pages/DosenPage';
import JadwalPage from './pages/JadwalPage';
import EvaluasiPage from './pages/EvaluasiPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dosen" element={<DosenPage />} />
          <Route path="/jadwal" element={<JadwalPage />} />
          <Route path="/evaluasi" element={<EvaluasiPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;