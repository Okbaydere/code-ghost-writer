import React, { useState } from 'react';
import './App.css';
import CodeEditor from './CodeEditor';
import ChatPanel from './ChatPanel'; // Yeni bileşeni import et

// Dosya yapısı için tip tanımı
interface CodeFile {
  filename: string;
  code: string;
}

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [targetCode, setTargetCode] = useState(''); // Editor için hedef kod
  // Birden fazla dosya olabileceğinden, dosya listesini tutalım
  const [generatedFiles, setGeneratedFiles] = useState<{ filename: string; code: string }[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0); // Seçili dosya indeksi
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedFiles([]); // Önceki sonuçları temizle
    setTargetCode(''); // Editörü temizle
    try {
      // Main process'teki Gemini handler'ını çağır
      const files = await window.electron.ipcRenderer.invoke('gemini-generate', prompt);
      if (files && files.length > 0) {
        setGeneratedFiles(files);
        setSelectedFileIndex(0); // İlk dosyayı seçili yap
        setTargetCode(files[0].code); // İlk dosyanın kodunu editöre yükle
      } else {
        const errorMsg = "AI'dan gecerli bir kod alinamadi.";
        setError(errorMsg);
      }
    } catch (err: any) {
      console.error('IPC hatası veya Gemini hatası:', err);
      const defaultError = 'Kod uretilirken bir hata olustu.';
      setError(err?.message ? String(err.message) : defaultError);
    } finally {
      setIsLoading(false);
    }
  };

  // Dosya seçimi değiştiğinde
  const handleFileSelect = (index: number) => {
    if (index >= 0 && index < generatedFiles.length) {
        setSelectedFileIndex(index);
        setTargetCode(generatedFiles[index].code);
        // İleride: Seçili dosya değiştiğinde Chat paneline bilgi verilebilir
    }
  };

  return (
    <div className="app-container">
      {/* Sol Panel: İstek Girişi */}
      <div className="panel request-panel">
        <h2>Kod İsteği</h2>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='Üretmek istediğiniz kodu açıklayın (örneğin, "javascript ile basit bir butona tıklama olayı ekle")'
          rows={5}
          disabled={isLoading}
        />
        <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()}>
          {isLoading ? 'Üretiliyor...' : 'Üret'}
        </button>
        {error && <p className="error-message">Hata: {error}</p>}

        {/* Dosya Listesi (birden fazla dosya varsa göster) */}
        {generatedFiles.length > 1 && (
          <div className="file-list">
            <h4>Üretilen Dosyalar:</h4>
            <ul>
              {generatedFiles.map((file, index) => (
                <li
                  key={index}
                  className={index === selectedFileIndex ? 'selected' : ''}
                  onClick={() => handleFileSelect(index)}
                >
                  {file.filename}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Orta Panel: Kod Editörü */}
      <div className="panel editor-panel">
        {/* Dosya adı başlığı (tek dosya varsa veya seçiliyse) */}
        {generatedFiles.length > 0 && (
             <h3>{generatedFiles[selectedFileIndex]?.filename || 'Kod Editörü'}</h3>
        )}
        <CodeEditor targetCode={targetCode} />
      </div>

      {/* Sağ Panel: Sohbet/Açıklama */}
      <div className="panel chat-panel">
         <h2>Açıklama / Sohbet</h2>
         <ChatPanel currentCode={targetCode} /> 
      </div>
    </div>
  );
}
