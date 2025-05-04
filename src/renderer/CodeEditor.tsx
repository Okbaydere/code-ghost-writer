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
  const [wrongKey, setWrongKey] = useState<string | null>(null); // Yanlış basılan tuş
  const [isShaking, setIsShaking] = useState(false); // Titreme animasyonu için

  // Efektleri sıfırlamak için yardımcı fonksiyon
  const resetEffects = () => {
    setWrongKey(null);
    setIsShaking(false);
  }

  useEffect(() => {
    setTypedCode('');
    setIsComplete(false);
    setCopied(false);
    resetEffects(); // Yeni kod geldiğinde efektleri sıfırla
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
    const currentPos = typedCode.length;
    const expectedChar = targetCode[currentPos];

    // Özel tuşlar (Enter, Tab, Backspace) öncelikli
    if (event.key === 'Enter') {
      event.preventDefault();
      if (expectedChar === '\n') {
        // Bir sonraki satırın girintisini bul
        let nextLineStart = currentPos + 1;
        let indentation = '';
        while (nextLineStart < targetCode.length) {
          const char = targetCode[nextLineStart];
          if (char === ' ' || char === '\t') {
            indentation += char;
            nextLineStart++;
          } else {
            break; // İlk boşluk olmayan karaktere ulaşıldı
          }
        }
        updateTypedCode(typedCode + '\n' + indentation);
        resetEffects(); // Başarılı girişte efektleri sıfırla
      } else {
        // Yanlış tuş (Enter beklenmiyordu)
        setWrongKey('Enter');
        setIsShaking(true);
        setTimeout(resetEffects, 500);
      }
      return;
    } else if (event.key === 'Tab') {
      event.preventDefault();
      const expectedNextFour = targetCode.substring(currentPos, currentPos + 4);
      if (expectedNextFour === '    ') {
        updateTypedCode(typedCode + '    ');
        resetEffects();
      } else if (expectedChar === '\t') {
        updateTypedCode(typedCode + '\t');
        resetEffects();
      } else {
        // Yanlış tuş (Tab beklenmiyordu)
        setWrongKey('Tab');
        setIsShaking(true);
        setTimeout(resetEffects, 500);
      }
      return;
    } else if (event.key === 'Backspace') {
        resetEffects(); // Backspace'de efektleri temizle (varsayılan davranışa izin ver)
        return; // handleInputChange halledecek
    }

    // Yazdırılabilir karakter kontrolü (ve diğer kontrol tuşlarını engelleme)
    // Sadece tek karakterlik tuşları ve beklenen karakterle karşılaştır
    if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      if (expectedChar === event.key) {
        // Doğru tuş: handleInputChange'in işlemesine izin ver (varsayılan davranış)
        resetEffects();
      } else {
        // Yanlış tuş
        event.preventDefault(); // Yanlış karakterin input'a girmesini engelle
        setWrongKey(event.key === ' ' ? 'Space' : event.key); // Boşluk için 'Space' göster
        setIsShaking(true);
        setTimeout(resetEffects, 500); // Efekti 500ms sonra kaldır
      }
    } else if (!['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape', 'Delete', 'Home', 'End', 'PageUp', 'PageDown', 'Insert', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(event.key)) {
        // İzin verilmeyen diğer kontrol tuşları için de titretme (isteğe bağlı)
        event.preventDefault();
        setWrongKey(event.key);
        setIsShaking(true);
        setTimeout(resetEffects, 500);
    }
    // Shift, Ctrl, Alt gibi değiştirici tuşlar için bir şey yapma
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
             {/* İmleç ve yanlış tuş göstergesi için kapsayıcı */}
             <span className={`caret-container ${isShaking ? 'shake' : ''}`}>
                {/* Yanlış tuş göstergesi (sadece wrongKey varsa) */}
                {wrongKey && (
                    <span className="wrong-key-display">{wrongKey}</span>
                )}
                {/* İmleç sadece odaklıyken göster */}
                {isFocused && (
                    <span className="caret"></span>
                )}
             </span>
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