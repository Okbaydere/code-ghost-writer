import React, { useState, useEffect, useRef } from 'react';
import './CodeEditor.css'; // Bileşene özel CSS dosyası

interface CodeEditorProps {
  targetCode: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ targetCode }) => {
  const [typedCode, setTypedCode] = useState('');
  const displayRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isComplete, setIsComplete] = useState(false); // Tamamlanma durumu
  const [copied, setCopied] = useState(false); // Kopyalandı mesajı için

  useEffect(() => {
    setTypedCode('');
    setIsComplete(false); // Yeni kod geldiğinde sıfırla
    setCopied(false); // Kopyalandı durumunu sıfırla
    if (targetCode && hiddenInputRef.current) {
      hiddenInputRef.current.focus();
      setIsFocused(true);
    } else {
      setIsFocused(false); // Odak dışı bırak eğer hedef kod yoksa
    }
  }, [targetCode]);

  // Yazılan kodu ve tamamlanma durumunu güncelleyen yardımcı fonksiyon
  const updateTypedCode = (newCode: string) => {
    if (targetCode.startsWith(newCode)) {
      setTypedCode(newCode);
      if (newCode === targetCode) {
        setIsComplete(true);
        setIsFocused(false); // Tamamlanınca gizli input'tan odağı kaldırabiliriz
      } else {
        setIsComplete(false);
      }
      return true; // Başarılı güncelleme
    } 
    return false; // Başarısız (hedef kodla eşleşmiyor)
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!updateTypedCode(event.target.value) && hiddenInputRef.current) {
       // Eğer updateTypedCode başarısız olduysa (olmamalı ama garanti)
       // input değerini eski haline getir
       hiddenInputRef.current.value = typedCode; 
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
     if (event.key === 'Tab') {
       event.preventDefault(); // Sekmenin varsayılan davranışını engelle
       const currentPos = typedCode.length;
       const expectedNextFour = targetCode.substring(currentPos, currentPos + 4);
       
       if (expectedNextFour === '    ') {
         updateTypedCode(typedCode + '    ');
       }
       // Eğer sonraki 4 karakter boşluk değilse, Tab bir şey yapmaz.
     } 
     // Başka tuşlar için özel kontroller buraya eklenebilir (örn: Enter)
  };

  const handleCopy = () => {
    if (!isComplete) return;
    navigator.clipboard.writeText(targetCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500); // 1.5 saniye sonra "Kopyalandı" mesajını kaldır
    }).catch(err => {
      console.error('Kopyalama başarısız:', err);
      // Kullanıcıya hata mesajı gösterilebilir
    });
  };

  // Tıklama ile gizli input'a odaklanma (sadece tamamlanmadıysa)
  const handleClick = () => {
    if (!isComplete && hiddenInputRef.current) {
      hiddenInputRef.current.focus();
      setIsFocused(true);
    }
  };

  const handleFocus = () => {
    if (!isComplete) { // Sadece tamamlanmadıysa focus state'ini güncelle
       setIsFocused(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const currentPos = typedCode.length;
  const typedPart = targetCode.substring(0, currentPos);
  const nextChar = targetCode.substring(currentPos, currentPos + 1);
  const ghostPart = targetCode.substring(currentPos + 1);

  return (
    // Tamamlandığında farklı bir class ekle
    <div className={`code-editor-container ${isComplete ? 'completed' : ''}`} onClick={handleClick} ref={displayRef}>
      {/* Kopyala Butonu (sadece tamamlandığında görünür) */}
      {isComplete && (
          <button onClick={handleCopy} className="copy-button">
              {copied ? 'Kopyalandı!' : 'Kopyala'}
          </button>
      )}

      <pre className="code-display">
        {/* Tamamlandığında tüm kod farklı renkte gösterilebilir */}
        {isComplete ? (
            <span className="completed-code">{targetCode}</span>
        ) : (
           <>
             <span className="typed-code">{typedPart}</span>
             {/* İmleç sadece odaklıyken göster */}
             {isFocused && (
                  <span className="caret"></span>
             )}
             {/* Vurgulanacak sonraki karakter */}
             {nextChar && (
                <span className="next-char">{nextChar}</span>
             )}
             {/* Kalan hayalet kod */}
             <span className="ghost-code">{ghostPart}</span>
           </>
        )}
      </pre>
      {/* Gizli textarea sadece tamamlanmadıysa aktif */}
      {!isComplete && (
          <textarea
            ref={hiddenInputRef}
            className="hidden-input"
            value={typedCode}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown} // Sekme tuşunu yakala
            onFocus={handleFocus}
            onBlur={handleBlur}
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            // Tamamlanınca devre dışı bırakmaya gerek yok çünkü render edilmiyor
          />
      )}
    </div>
  );
};

export default CodeEditor; 