import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Circle, Upload, Volume2, ChevronDown, ChevronUp } from 'lucide-react';
import { dosenAPI, APP_CONFIG } from '../../services/api';

export default function RekamSuaraModal({ dosen, onClose, onSuccess }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [currentLine, setCurrentLine] = useState(0);
  const [showScript, setShowScript] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const scriptRef = useRef(null);
  const lineRefs = useRef([]);

  // Script panduan rekaman
  const recordingScript = [
    "Selamat pagi, nama saya [NAMA LENGKAP DOSEN]. Saya akan merekam sample suara untuk sistem pengenalan pembicara.",
    "Hari ini tanggal [TANGGAL SEKARANG] dan rekaman ini akan digunakan untuk meningkatkan akurasi identifikasi dalam proses monitoring pembelajaran.",
    "Dalam era digital seperti sekarang, teknologi artificial intelligence telah membawa banyak perubahan signifikan di berbagai bidang, termasuk pendidikan.",
    "Sistem pengenalan suara atau speaker recognition memanfaatkan karakteristik vokal yang unik dari setiap individu untuk melakukan identifikasi.",
    "Pendidikan tinggi menghadapi tantangan transformasi digital yang membutuhkan adaptasi cepat dari seluruh sivitas akademika.",
    "Inovasi dalam teknologi pembelajaran tidak hanya tentang alat, tetapi juga tentang metodologi dan pendekatan yang lebih efektif.",
    "Big data analytics dan machine learning menjadi komponen penting dalam menganalisis efektivitas proses belajar mengajar.",
    "Data yang terkumpul dari berbagai sumber dapat memberikan insights berharga untuk perbaikan berkelanjutan.",
    "Virtual classroom dan hybrid learning telah menjadi norma baru dalam pendidikan modern.",
    "Fleksibilitas dalam pembelajaran memungkinkan akses yang lebih luas dan inklusif bagi mahasiswa dari berbagai latar belakang.",
    "Quality assurance dalam pendidikan memerlukan monitoring yang komprehensif dan objektif.",
    "Teknologi speaker recognition dapat membantu dalam mengevaluasi konsistensi dan kualitas penyampaian materi perkuliahan.",
    "Blockchain technology menawarkan solusi untuk keamanan sertifikat akademik dan transkrip nilai.",
    "Sistem yang terdesentralisasi ini meminimalkan risiko pemalsuan dokumen penting.",
    "Internet of Things dalam kampus pintar memungkinkan optimasi penggunaan energi dan pemeliharaan fasilitas.",
    "Pada akhirnya, tujuan utama teknologi dalam pendidikan adalah meningkatkan kualitas pembelajaran.",
    "Dan memastikan bahwa setiap mahasiswa mendapatkan pengalaman belajar yang optimal dan bermakna untuk masa depan mereka."
  ];

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Auto-scroll to current line
  useEffect(() => {
    if (autoScroll && lineRefs.current[currentLine]) {
      lineRefs.current[currentLine].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentLine, autoScroll]);

  // Update current line based on recording time
  useEffect(() => {
    if (isRecording) {
      // Calculate which line should be read based on recording time
      // Assuming each line takes about 3.5 seconds (60 seconds / 17 lines ≈ 3.5s per line)
      const lineIndex = Math.min(
        Math.floor(recordingTime / 3.5),
        recordingScript.length - 1
      );
      setCurrentLine(lineIndex);
    }
  }, [recordingTime, isRecording]);

  const startRecording = async () => {
    try {
      // Reset state
      setError('');
      setAudioBlob(null);
      setRecordingTime(0);
      setRecordingDuration(0);
      setCurrentLine(0);

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        
        // Convert to WAV format
        convertToWav(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      // Start recording
      mediaRecorder.start(1000);
      setIsRecording(true);
      
      // Start timer
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingTime(elapsed);
        
        // Auto-stop after 70 seconds for safety (extra 10 seconds buffer)
        if (elapsed >= 70) {
          stopRecording();
        }
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Tidak dapat mengakses mikrofon. Pastikan browser mengizinkan akses mikrofon dan periksa koneksi mikrofon Anda.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingDuration(recordingTime);
    }
  };

  const convertToWav = (webmBlob) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const fileReader = new FileReader();

    fileReader.onload = function() {
      audioContext.decodeAudioData(fileReader.result, (buffer) => {
        const wavBlob = bufferToWav(buffer);
        setAudioBlob(wavBlob);
      });
    };

    fileReader.readAsArrayBuffer(webmBlob);
  };

  const bufferToWav = (buffer) => {
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;
    const channels = buffer.numberOfChannels;
    
    const interleaved = new Float32Array(length * channels);
    for (let channel = 0; channel < channels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        interleaved[i * channels + channel] = channelData[i];
      }
    }

    const wavBuffer = new ArrayBuffer(44 + interleaved.length * 2);
    const view = new DataView(wavBuffer);

    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + interleaved.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * 2, true);
    view.setUint16(32, channels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, interleaved.length * 2, true);

    let offset = 44;
    for (let i = 0; i < interleaved.length; i++) {
      const sample = Math.max(-1, Math.min(1, interleaved[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([wavBuffer], { type: 'audio/wav' });
  };

  const handleUpload = async () => {
    if (!audioBlob) return;

    setLoading(true);
    setError('');

    try {
      const audioFile = new File([audioBlob], `rekaman_${dosen.id}_${Date.now()}.wav`, { 
        type: 'audio/wav' 
      });
      
      await dosenAPI.rekamSuara(dosen.id, audioFile);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengupload rekaman');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRetry = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    setRecordingDuration(0);
    setError('');
    setCurrentLine(0);
  };

  const replacePlaceholders = (text) => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return text
      .replace('[NAMA LENGKAP DOSEN]', dosen.nama)
      .replace('[TANGGAL SEKARANG]', formattedDate);
  };

  return (
    <div className="fixed inset-0 backdrop-blur drop-shadow-2xl bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            Rekam Sample Suara - {dosen.nama}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-3">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-hidden flex">
          {/* Script Panel */}
          {showScript && (
            <div className="w-1/2 border-r border-gray-200 flex flex-col">
              <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-medium text-gray-800">Script Panduan</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setAutoScroll(!autoScroll)}
                    className={`text-xs px-2 py-1 rounded ${
                      autoScroll ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => setShowScript(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div 
                ref={scriptRef}
                className="flex-1 overflow-y-auto p-4 bg-gray-25"
              >
                <div className="space-y-3">
                  {recordingScript.map((line, index) => (
                    <div
                      key={index}
                      ref={el => lineRefs.current[index] = el}
                      className={`p-3 rounded-lg transition-all duration-300 ${
                        index === currentLine && isRecording
                          ? 'bg-blue-100 border-2 border-blue-300 shadow-sm'
                          : 'bg-white border border-gray-200'
                      } ${
                        index < currentLine 
                          ? 'opacity-60' 
                          : 'opacity-100'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          index === currentLine && isRecording
                            ? 'bg-blue-500 text-white'
                            : index < currentLine
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {index + 1}
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {replacePlaceholders(line)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Controls Panel */}
          <div className={`${showScript ? 'w-1/2' : 'w-full'} flex flex-col`}>
            <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-medium text-gray-800">Kontrol Rekaman</h3>
              {!showScript && (
                <button
                  onClick={() => setShowScript(true)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Recording Controls */}
                <div className="flex flex-col items-center space-y-4">
                  {!isRecording && !audioBlob && (
                    <div className="text-center py-8">
                      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <Mic className="h-10 w-10 text-blue-600" />
                      </div>
                      <p className="text-gray-600 mb-2 text-lg">
                        Siap untuk merekam sample suara
                      </p>
                      <p className="text-sm text-gray-500 mb-6 max-w-md">
                        Baca script panduan yang tersedia. Rekaman akan berdurasi sekitar 1 menit untuk hasil recognition yang optimal.
                      </p>
                      <button
                        onClick={startRecording}
                        className="btn-primary flex items-center space-x-2 text-lg px-8 py-3"
                      >
                        <Mic className="h-5 w-5" />
                        <span>Mulai Rekam</span>
                      </button>
                    </div>
                  )}

                  {isRecording && (
                    <div className="text-center py-6">
                      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
                        <Circle className="h-8 w-8 text-red-600 fill-red-600" />
                      </div>
                      <div className="text-3xl font-mono font-bold text-red-600 mb-2">
                        {formatTime(recordingTime)}
                      </div>
                      <p className="text-gray-600 mb-2 font-medium">Sedang merekam...</p>
                      <p className="text-sm text-gray-500 mb-4">
                        Ikuti script panduan untuk hasil terbaik
                      </p>
                      <button
                        onClick={stopRecording}
                        className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg flex items-center space-x-2 mx-auto text-lg"
                      >
                        <Square className="h-5 w-5" />
                        <span>Stop Rekam</span>
                      </button>
                    </div>
                  )}

                  {audioBlob && !isRecording && (
                    <div className="text-center w-full">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <Volume2 className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="text-gray-600 mb-2 text-lg">
                        Rekaman selesai! ({formatTime(recordingDuration)})
                      </p>
                      
                      <div className="space-y-4 w-full max-w-md mx-auto">
                        <p className="text-sm font-medium text-gray-700">Preview rekaman:</p>
                        <audio controls className="w-full mb-4">
                          <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                          Browser Anda tidak mendukung pemutar audio.
                        </audio>
                        
                        <div className="flex space-x-3">
                          <button
                            onClick={handleUpload}
                            disabled={loading}
                            className="flex-1 flex items-center space-x-2 btn-primary justify-center disabled:opacity-50 py-3"
                          >
                            <Upload className="h-5 w-5" />
                            <span>{loading ? 'Mengupload...' : 'Simpan Sample'}</span>
                          </button>
                          
                          <button
                            onClick={handleRetry}
                            disabled={loading}
                            className="flex items-center space-x-2 btn-secondary disabled:opacity-50 py-3 px-6"
                          >
                            <span>Rekam Ulang</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Indicator */}
                {isRecording && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-blue-800">Progress</span>
                      <span className="text-sm text-blue-600">
                        {currentLine + 1} / {recordingScript.length}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentLine + 1) / recordingScript.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Panduan Rekaman:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• <strong>Baca natural</strong> dengan kecepatan sedang</li>
                    <li>• <strong>Volume konsisten</strong> - tidak terlalu keras atau pelan</li>
                    <li>• <strong>Jeda seperlunya</strong> di antara kalimat</li>
                    <li>• <strong>Lafal jelas</strong> untuk setiap kata</li>
                    <li>• <strong>Target durasi</strong> sekitar 1 menit</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}