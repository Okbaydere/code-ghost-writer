# Code Ghost - AI-Powered Interactive Coding Practice

This application is a desktop tool that allows you to generate code snippets using the Google Gemini API and then practice typing them out over "ghost text".

It aims to help users learn and reinforce coding concepts by actively typing the code instead of just copy-pasting.

## ✨ Features

*   **AI Code Generation:** Send requests to the Google Gemini API (currently using the `gemini-1.5-flash` model) to generate code in your desired language and topic.
*   **Ghost Code Editor:** Displays the generated code as faint "ghost text".
*   **Interactive Typing:** "Bring the code to life" by typing over the ghost text character by character.
*   **Instant Feedback:** Correctly typed characters become visible, preventing incorrect input.
*   **Simple Interface:** A clean two-panel interface for requesting code and typing it out.

## 💻 Technologies Used

*   **Framework:** [Electron](https://www.electronjs.org/)
*   **UI:** [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/)
*   **AI:** [Google Generative AI (Gemini API)](https://ai.google.dev/)
*   **Backend (Electron Main Process):** [Node.js](https://nodejs.org/)
*   **Package Management:** [npm](https://www.npmjs.com/)
*   **Boilerplate:** [Electron React Boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate)

## 🚀 Setup and Launch

1.  **Clone the Project:**
    ```bash
    git clone <your_repository_address> code-ghost
    cd code-ghost
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Set Up API Key:**
    *   Create a file named `.env` in the project's root directory (`code-ghost/`).
    *   Add your Gemini API key (obtained from Google AI Studio) to this file in the following format:
        ```env
        GEMINI_API_KEY=YOUR_API_KEY_HERE
        ```

4.  **Start the Application (Development Mode):**
    ```bash
    npm start
    ```

## 📖 Usage

1.  When the application opens, enter a request for the code you want to generate in the text area on the left panel (e.g., "add a simple button click event in javascript").
2.  Click the "Generate" button.
3.  There might be a short waiting period while the AI responds.
4.  The generated code will appear as faint ("ghost") text in the right panel.
5.  Click on the right panel and start typing the same code over the ghost text using your keyboard.
6.  As you type correctly, the code will turn to its normal color, and the next character to be typed will be underlined.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📄 License

This project is licensed under the [MIT](LICENSE) License.
