import React, { useState } from 'react';
import './App.css';
import CodeEditor from './CodeEditor'; // Yeni bileşeni import edeceğiz

// type Message = { ... } // Mesaj tipi artık gerekli değil

export default function App() {
  // const [messages, setMessages] = useState<Message[]>([ ... ]); // Mesaj state'i kaldırıldı
  const [inputValue, setInputValue] = useState(''); // Giriş alanının değeri
  const [targetCode, setTargetCode] = useState<string>(''); // Hedef kod state'i
  const [isLoading, setIsLoading] = useState<boolean>(false); // Yüklenme durumu state'i
  const [error, setError] = useState<string | null>(null); // Hata mesajı state'i

  const handleGenerateCode = async () => {
    if (!inputValue.trim()) {
      setTargetCode('');
      setError(null);
      return;
    }

    setIsLoading(true); // Yükleniyor durumunu başlat
    setError(null); // Önceki hataları temizle
    setTargetCode(''); // Önceki kodu temizle

    try {
      // Ana sürece prompt'u gönder ve cevabı (kodu) bekle
      // 'electron' objesi preload.ts'de tanımlandı
      const generatedCode = await window.electron.ipcRenderer.invoke('gemini-generate', inputValue);
      setTargetCode(generatedCode);
    } catch (err) {
      console.error("Kod üretme hatası:", err);
      // Hata mesajını güvenli bir şekilde al
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || 'Kod üretilirken bir hata oluştu.');
      setTargetCode(''); // Hata durumunda hedef kodu boşalt
    } finally {
      setIsLoading(false); // Yükleniyor durumunu bitir
    }

    setInputValue(''); // Input'u temizle
  };


  return (
    <div className="app-container two-panel-layout"> {/* Ana layout değişti */}
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
      </div>

      {/* Sağ Panel: Kod Editörü */}
      <div className="code-editor-panel">
         {/* Yüklenirken bir gösterge eklenebilir */} 
         {isLoading && <div className="loading-indicator">Kod üretiliyor, lütfen bekleyin...</div>} 
         {!isLoading && !error && (
             <CodeEditor targetCode={targetCode} />
         )}
         {/* Hata durumunda belki farklı bir mesaj gösterilebilir */} 
      </div>
    </div>
  );
}
