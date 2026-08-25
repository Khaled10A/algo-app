## Installation & Usage

### 1. Install dependencies

```bash
npm install
```

### 2. Configure optional AI support

```bash
cp .env.example .env
```

The AI Assistant calls `/api/assistant`, which needs `GROQ_API_KEY` as a server-side environment variable (see README — never prefix it with `VITE_`).

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
