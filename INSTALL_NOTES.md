## Installation & Usage

### 1. Install dependencies

```bash
npm install
```

### 2. Configure optional AI support

```bash
cp .env.example .env
```

Set `VITE_GROQ_KEY` in `.env` if you want to use the AI Assistant tab.

### 3. Run the app

```bash
npm run dev
```

Open `http://localhost:5173`.

### 4. Build for production

```bash
npm run build
```

### 5. Run Cypress tests

Start the dev server first:

```bash
npm run dev
```

Then run:

```bash
npm run test:e2e
```
