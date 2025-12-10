import { useState } from 'react';
import api from '../config/api';

const TestConnection = () => {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const testBackend = async () => {
    setStatus('testing');
    setMessage('Backend bağlantısı test ediliyor...');

    try {
      // Swagger endpoint'ini kontrol et
      const response = await fetch('http://localhost:5226/swagger/index.html');
      if (response.ok) {
        setStatus('success');
        setMessage('✅ Backend çalışıyor! (Swagger erişilebilir)');
      } else {
        setStatus('error');
        setMessage('❌ Backend çalışıyor ama Swagger erişilemiyor');
      }
    } catch (error) {
      setStatus('error');
      setMessage(`❌ Backend bağlantı hatası: ${error.message}`);
    }
  };

  const testRegisterEndpoint = async () => {
    setStatus('testing');
    setMessage('Register endpoint test ediliyor...');

    try {
      // OPTIONS preflight request
      const response = await api.post('/auth/register', {
        FirstName: 'Test',
        LastName: 'User',
        Email: `test${Date.now()}@test.com`,
        Password: 'Test1234!',
        ConfirmPassword: 'Test1234!',
        Role: 2,
        StudentNumber: `STU${Date.now()}`,
        DepartmentId: 1,
      });
      setStatus('success');
      setMessage('✅ Register endpoint çalışıyor!');
    } catch (error) {
      if (error.response) {
        // Backend'e ulaşıldı ama hata var
        setStatus('warning');
        setMessage(`⚠️ Backend çalışıyor ama hata: ${error.response.data?.message || error.response.statusText}`);
      } else if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        setStatus('error');
        setMessage('❌ Backend bağlantı hatası! Backend çalışmıyor olabilir.');
      } else {
        setStatus('error');
        setMessage(`❌ Hata: ${error.message}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Backend Bağlantı Testi
        </h1>

        <div className="space-y-4">
          <button
            onClick={testBackend}
            disabled={status === 'testing'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            Swagger Kontrolü
          </button>

          <button
            onClick={testRegisterEndpoint}
            disabled={status === 'testing'}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            Register Endpoint Testi
          </button>

          {message && (
            <div
              className={`p-4 rounded-lg ${
                status === 'success'
                  ? 'bg-green-500/20 text-green-300'
                  : status === 'warning'
                  ? 'bg-yellow-500/20 text-yellow-300'
                  : status === 'error'
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-blue-500/20 text-blue-300'
              }`}
            >
              {message}
            </div>
          )}
        </div>

        <div className="mt-6 text-sm text-gray-300">
          <p className="font-semibold mb-2">Beklenen Backend URL:</p>
          <code className="bg-black/30 p-2 rounded block">
            http://localhost:5226/api/v1
          </code>
        </div>
      </div>
    </div>
  );
};

export default TestConnection;

