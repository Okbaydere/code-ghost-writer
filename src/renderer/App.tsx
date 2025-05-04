import React, { useState } from 'react';
import './App.css';
import CodeEditor from './CodeEditor';

// Dosya yapısı için tip tanımı
interface CodeFile {
  filename: string;
  code: string;
}

export default function App() {
  const [inputValue, setInputValue] = useState('');
  const [files, setFiles] = useState<CodeFile[]>([]); // Gelen dosyalar
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null); // Seçili dosya indeksi
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateCode = async () => {
    if (!inputValue.trim()) {
      setFiles([]); // Dosyaları temizle
      setSelectedFileIndex(null); // Seçimi temizle
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    setFiles([]); // Önceki dosyaları temizle
    setSelectedFileIndex(null); // Seçimi temizle

    try {
      // Ana süreçten dosya dizisini bekle
      const generatedFiles: CodeFile[] = await window.electron.ipcRenderer.invoke('gemini-generate', inputValue);
      
      if (generatedFiles && generatedFiles.length > 0) {
          setFiles(generatedFiles);
          setSelectedFileIndex(0); // İlk dosyayı seçili yap
      } else {
          // Ana süreç hata fırlatmalı ama yine de kontrol edelim
          setError('AI\'dan geçerli bir kod yanıtı alınamadı.');
      }

    } catch (err) {
      console.error("Kod üretme hatası:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || 'Kod üretilirken bir hata oluştu.');
      setFiles([]); // Hata durumunda dosyaları temizle
      setSelectedFileIndex(null);
    } finally {
      setIsLoading(false);
    }
    setInputValue('');
  };

  // Dosya seçimi için handler
  const handleFileSelect = (index: number) => {
      setSelectedFileIndex(index);
  };

  // CodeEditor için seçili dosyanın kodunu al
  const currentCode = selectedFileIndex !== null && files[selectedFileIndex] ? files[selectedFileIndex].code : '';

  return (
    <div className="app-container two-panel-layout">
      {/* Sol Panel: Kontroller */}
      <div className="control-panel">
        <h3>Kod İste</h3>
        <div className="input-area">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Bir kod parçası isteyin (örn: python list comprehension örneği)"
            rows={3}
            disabled={isLoading} // Yüklenirken input'u devre dışı bırak
          />
          <button onClick={handleGenerateCode} disabled={isLoading}> {/* Yüklenirken butonu devre dışı bırak */}
            {isLoading ? 'Üretiliyor...' : 'Oluştur'} {/* Buton metnini değiştir */}
          </button>
        </div>
        {/* Hata Mesajı Alanı */}
        {error && (
          <div className="error-message">
            Hata: {error}
          </div>
        )}

        {/* Dosya Listesi Alanı */}
        {files.length > 0 && !isLoading && (
          <div className="file-list-container">
             <h4>Üretilen Dosyalar:</h4>
             <ul className="file-list">
               {files.map((file, index) => (
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

      {/* Sağ Panel: Kod Editörü */}
      <div className="code-editor-panel">
         {isLoading && <div className="loading-indicator">Kod üretiliyor, lütfen bekleyin...</div>} 
         {!isLoading && !error && files.length === 0 && (
             <div className="loading-indicator">Başlamak için bir kod isteyin.</div> // Başlangıç mesajı
         )}
         {!isLoading && !error && files.length > 0 && selectedFileIndex !== null && (
             <CodeEditor targetCode={currentCode} /> // Seçili dosyanın kodunu gönder
         )}
         {/* Hata durumunda CodeEditor yerine hata mesajı gösterilebilir */}
         {!isLoading && error && (
             <div className="loading-indicator error-display">{error}</div> 
         )}
      </div>
    </div>
  );
}
