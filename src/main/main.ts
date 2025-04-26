/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

// --- Gemini API Entegrasyonu Başlangıç ---
import dotenv from 'dotenv';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Part } from '@google/generative-ai';

// .env dosyasını yükle
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('Hata: GEMINI_API_KEY çevre değişkeni bulunamadı. Lütfen .env dosyasını kontrol edin.');
  // Uygulamayı burada sonlandırmak veya kullanıcıya bir hata mesajı göstermek iyi olabilir.
  // Şimdilik sadece konsola yazıyoruz.
}

// API İstemcisini Başlat (API_KEY varsa)
let genAI: GoogleGenerativeAI | null = null;
let model: any = null; // Daha spesifik tip verilebilir: GenerativeModel

if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", // Veya başka bir uygun model
  });
}

// Güvenlik Ayarları (Örnek - İhtiyaca göre ayarlanmalı)
const generationConfig = {
  temperature: 0.9,
  topK: 1,
  topP: 1,
  maxOutputTokens: 2048, // Çıktı uzunluğunu kod için ayarlayın
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// IPC Dinleyicisi: Renderer'dan gelen kod üretme isteklerini işle
ipcMain.handle('gemini-generate', async (event, prompt: string): Promise<string> => {
  console.log(`Ana süreçte Gemini isteği alındı: ${prompt}`);

  if (!model) {
    console.error('Gemini modeli başlatılamadı. API anahtarını kontrol edin.');
    throw new Error('Gemini modeli başlatılamadı.'); // Hata fırlat
  }

  try {
    const parts = [
      { text: `Aşağıdaki isteğe göre bir kod parçası yaz: ${prompt}` }, // Prompt'u özelleştir
    ];

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig,
      safetySettings,
    });

    // Cevabı kontrol et ve metni al
    if (result.response && result.response.candidates && result.response.candidates.length > 0) {
      const candidate = result.response.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        // Genellikle kod markdown formatında ```kod``` olarak dönebilir,
        // veya sadece saf metin olarak. Şimdilik sadece text alıyoruz.
        const generatedText = candidate.content.parts.map((part: Part) => part.text).join('');
        console.log(`Gemini yanıtı: ${generatedText.substring(0,100)}...`); // Yanıtın başını logla
        
        // Markdown kod bloklarını temizlemeye çalış (basit regex)
        const codeMatch = generatedText.match(/```(?:[a-z]+)?\n([\s\S]*?)\n```/);
        if (codeMatch && codeMatch[1]) {
          return codeMatch[1].trim(); // Sadece kod kısmını al
        } else {
          return generatedText.trim(); // Eğer blok yoksa tüm metni al
        }

      } else {
        console.error('Gemini\'den geçerli içerik alınamadı veya engellendi.', result.response);
        const blockReason = result.response?.promptFeedback?.blockReason;
        throw new Error(`Gemini yanıt vermedi${blockReason ? `: ${blockReason}` : '.'}`); // Hata fırlat
      }
    } else {
      console.error('Gemini\'den geçerli içerik alınamadı veya engellendi.', result.response);
      const blockReason = result.response?.promptFeedback?.blockReason;
      throw new Error(`Gemini yanıt vermedi${blockReason ? `: ${blockReason}` : '.'}`); // Hata fırlat
    }
  } catch (error) {
    console.error('Gemini API isteği sırasında hata:', error);
    // Hata mesajını güvenli bir şekilde al
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`API isteği başarısız: ${errorMessage}`); // Hata fırlat
  }
});

// --- Gemini API Entegrasyonu Bitiş ---

// --- AppUpdater ve mainWindow tanımlamaları ---
class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
// --- Bitiş: AppUpdater ve mainWindow tanımlamaları ---

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
