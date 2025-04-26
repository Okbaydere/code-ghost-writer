// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Kanal isimlerini daha belirgin hale getirelim
export type IpcChannel = 'ipc-example' | 'gemini-generate';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: IpcChannel, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: IpcChannel, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: IpcChannel, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    // İstek-cevap modeli için invoke ekleyelim
    invoke(channel: IpcChannel, ...args: unknown[]): Promise<any> {
       return ipcRenderer.invoke(channel, ...args);
    }
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
