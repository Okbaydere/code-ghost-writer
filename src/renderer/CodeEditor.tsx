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

  useEffect(() => {
    setTypedCode('');
    if (targetCode && hiddenInputRef.current) {
       hiddenInputRef.current.focus();
       setIsFocused(true);
    }
    if (!targetCode) {
      setIsFocused(false);
    }
  }, [targetCode]);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const currentTyped = event.target.value;

    if (targetCode.startsWith(currentTyped)) {
       setTypedCode(currentTyped);
    } else {
       if (hiddenInputRef.current) {
           hiddenInputRef.current.value = typedCode; 
       }
    }
  };

  const handleClick = () => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.focus();
      setIsFocused(true);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const currentPos = typedCode.length;
  const typedPart = targetCode.substring(0, currentPos);
  const nextChar = targetCode.substring(currentPos, currentPos + 1);
  const ghostPart = targetCode.substring(currentPos + 1);

  return (
    <div className="code-editor-container" onClick={handleClick} ref={displayRef}>
      <pre className="code-display">
        <span className="typed-code">{typedPart}</span>
        {isFocused && (
             <span className="caret"></span>
        )}
        {nextChar && (
           <span className="next-char">{nextChar}</span>
        )}
        <span className="ghost-code">{ghostPart}</span>
      </pre>
      <textarea
        ref={hiddenInputRef}
        className="hidden-input"
        value={typedCode}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        spellCheck="false"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
};

export default CodeEditor; 