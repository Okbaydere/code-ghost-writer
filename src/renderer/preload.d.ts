import { IpcRendererEvent } from 'electron';

// Kanal isimlerini preload.ts ile senkronize et
export type Channels = 'ipc-example' | 'gemini-generate' | 'gemini-explain';

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    electron: {
      ipcRenderer: {
        sendMessage(channel: Channels, args: unknown[]): void;
        on(channel: Channels, func: (...args: unknown[]) => void): (() => void) | undefined;
        once(channel: Channels, func: (...args: unknown[]) => void): void;
        // invoke metodunun tipini güncelle
        invoke(channel: 'gemini-generate', prompt: string): Promise<{ filename: string; code: string }[]>;
        invoke(channel: 'gemini-explain', codeSnippet: string, question: string): Promise<string>; // Açıklama için dönüş tipi string varsayalım
      };
    };
  }
}

export {};
