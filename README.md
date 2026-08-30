# VIN Decoder Pro

A production-ready, mobile-first VIN decoder built with Next.js, TypeScript, Tailwind CSS and Tesseract.js.

## Features

- 17-character VIN entry with live validation
- VIN character validation and North-American check-digit verification
- Mobile camera / desktop image upload through the native file picker
- Client-side OCR with Tesseract.js
- Image preprocessing and two OCR passes for difficult VIN plates
- Automatic VIN extraction, normalization and decode
- Official NHTSA vPIC `DecodeVinValues` API
- Results grouped into Overview, Engine & Performance, Body & Chassis, Safety Features, Manufacturer & Plant and Other Specs
- Empty NHTSA values are hidden
- Loading skeletons and clear error states
- Dark / light mode
- Copy VIN and share results
- Last 10 VINs stored locally in `localStorage`
- Example VINs for instant testing
- No backend and no environment variables required

## Requirements

- Node.js 20+
- npm 10+ recommended

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

For a production build:

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push this project to GitHub.
2. Import the repository into Vercel.
3. Framework preset: Next.js.
4. No environment variables are required.
5. Deploy.

Camera capture requires a secure context in production. Vercel provides HTTPS automatically.

## How the scan works

1. The Scan VIN button opens the native image capture/file picker.
2. The selected image is processed in the browser.
3. The image is upscaled, converted to grayscale and thresholded.
4. Tesseract.js runs two recognition passes using a VIN character whitelist.
5. Candidate text is cleaned and checked for a 17-character VIN.
6. The detected VIN is placed into the input.
7. The app validates it and immediately calls NHTSA vPIC.

No VIN image is uploaded to an application server by this project.

## API

The app calls:

`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/{VIN}?format=json`

The NHTSA response is transformed into a key/value map in the browser. Empty fields are excluded from the UI.

## Production notes

- NHTSA vPIC availability and response behavior are external dependencies.
- A browser can deny camera/file access; the app falls back to the normal file picker.
- OCR quality depends heavily on focus, lighting, angle and image resolution. Users are explicitly guided to capture a flat, sharp VIN plate.
- VIN check-digit verification is applied when the VIN uses the conventional North-American check-digit format. The NHTSA response remains the authoritative decode source.
- History is local to each browser/device and contains only the VIN, a short vehicle title and a timestamp.

## Project structure

```text
vin-decoder-pro/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── History.tsx
│   ├── Results.tsx
│   ├── ScanButton.tsx
│   ├── Skeleton.tsx
│   ├── ThemeToggle.tsx
│   └── VinInput.tsx
├── lib/
│   ├── ocr.ts
│   ├── vin.ts
│   └── vpic.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```
