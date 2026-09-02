"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { recognizeVin } from "@/lib/ocr";
import { validateVin, normalizeVin } from "@/lib/vin";

type Props = { onVin: (vin: string) => void; onClose: () => void };
type Tab = "camera" | "upload";
type CamState = "starting" | "live" | "error";
type OcrState = "idle" | "running" | "done" | "failed";

export default function ScanModal({ onVin, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("camera");
  const [camState, setCamState] = useState<CamState>("starting");
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [hasMulti, setHasMulti] = useState(false);
  const [ocrState, setOcrState] = useState<OcrState>("idle");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [detectedVin, setDetectedVin] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const nativeRef = useRef<HTMLInputElement>(null);

  /* ── Camera ──────────────────────────────────── */
  const stopCam = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const startCam = useCallback(async (facingMode: "environment" | "user") => {
    if (!videoRef.current) return;
    stopCam();
    setCamState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCamState("live");
      const devices = await navigator.mediaDevices.enumerateDevices();
      setHasMulti(devices.filter(d => d.kind === "videoinput").length > 1);
    } catch {
      setCamState("error");
    }
  }, [stopCam]);

  useEffect(() => {
    if (tab === "camera") startCam(facing);
    else stopCam();
    return stopCam;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, facing]);

  useEffect(() => () => { stopCam(); }, [stopCam]);

  /* ── OCR ─────────────────────────────────────── */
  async function processFile(file: File) {
    const url = URL.createObjectURL(file);
    setPreview(url);
    setOcrState("running");
    setOcrProgress(0);
    setDetectedVin(null);
    setOcrError(null);

    try {
      const result = await recognizeVin(file, (p: number) => setOcrProgress(p));
      const norm = normalizeVin(result.vin ?? "");
      const v = validateVin(norm);
      if (v.valid) {
        setDetectedVin(norm);
        setOcrState("done");
      } else {
        setOcrError(
          norm.length > 0
            ? `Found "${norm}" but it is not a valid VIN. Try a clearer photo.`
            : "No VIN found. Make sure the plate is sharp, well-lit and fills the frame."
        );
        setOcrState("failed");
      }
    } catch (err: unknown) {
      setOcrError(err instanceof Error ? err.message : "Could not read the image.");
      setOcrState("failed");
    }
  }

  function capture() {
    const v = videoRef.current;
    if (!v || camState !== "live") return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d")?.drawImage(v, 0, 0);
    canvas.toBlob(b => {
      if (b) processFile(new File([b], "capture.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.93);
  }

  function resetOcr() {
    setOcrState("idle");
    setPreview(null);
    setDetectedVin(null);
    setOcrError(null);
  }

  function switchTab(t: Tab) {
    resetOcr();
    setTab(t);
  }

  /* ── Drag-and-drop ───────────────────────────── */
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) processFile(file);
  }

  /* ── Render ──────────────────────────────────── */
  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">

        {/* Header */}
        <div className="modal-header">
          <span>Scan / Upload VIN</span>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: 20, lineHeight: 1, padding: "2px 6px" }}>×</button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button className={`modal-tab ${tab === "camera" ? "active" : ""}`} onClick={() => switchTab("camera")}>
            📷 Live camera
          </button>
          <button className={`modal-tab ${tab === "upload" ? "active" : ""}`} onClick={() => switchTab("upload")}>
            📁 Upload image
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">

          {/* ── OCR result / preview (shared between tabs) ── */}
          {preview && (
            <div style={{ marginBottom: 20 }}>
              <img
                src={preview}
                alt="Captured"
                style={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 8, background: "var(--surface)" }}
              />

              {ocrState === "running" && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
                    Analysing image… {Math.round(ocrProgress * 100)}%
                  </div>
                  <div style={{ height: 3, background: "var(--surface)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${ocrProgress * 100}%`, background: "var(--text)", borderRadius: 2, transition: "width .2s" }} />
                  </div>
                </div>
              )}

              {ocrState === "done" && detectedVin && (
                <div className="ocr-success">
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", marginBottom: 4 }}>VIN detected</div>
                  <div style={{ fontFamily: "ui-monospace,monospace", fontSize: 17, fontWeight: 700, letterSpacing: ".1em", marginBottom: 12 }}>
                    {detectedVin}
                  </div>
                  <button className="btn-primary" style={{ width: "100%" }} onClick={() => onVin(detectedVin)}>
                    Use this VIN →
                  </button>
                </div>
              )}

              {ocrState === "failed" && (
                <div className="ocr-error">
                  <div style={{ fontSize: 13, color: "var(--red)", marginBottom: 8 }}>{ocrError}</div>
                  <button className="btn-ghost" style={{ padding: 0 }} onClick={resetOcr}>← Try again</button>
                </div>
              )}
            </div>
          )}

          {/* ── Camera tab ── */}
          {tab === "camera" && !preview && (
            <>
              <div className="cam-wrap">
                <video ref={videoRef} autoPlay playsInline muted />

                {camState === "starting" && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13 }}>
                    Starting camera…
                  </div>
                )}

                {camState === "live" && (
                  <>
                    <div className="vin-frame" />
                    <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", fontSize: 11, color: "rgba(255,255,255,.8)", whiteSpace: "nowrap", pointerEvents: "none" }}>
                      Align the VIN barcode within the frame
                    </div>
                  </>
                )}

                {camState === "error" && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", gap: 10, padding: 20, textAlign: "center" }}>
                    <div style={{ fontSize: 13 }}>Camera unavailable</div>
                    <button className="btn-ghost" style={{ color: "#aaa", fontSize: 12 }} onClick={() => switchTab("upload")}>
                      Use upload instead
                    </button>
                  </div>
                )}
              </div>

              {/* Capture row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 18 }}>
                {hasMulti && (
                  <button
                    className="btn-outline"
                    style={{ width: 40, height: 40, padding: 0, borderRadius: "50%", fontSize: 16 }}
                    onClick={() => setFacing(f => f === "environment" ? "user" : "environment")}
                    title="Flip camera"
                  >
                    🔄
                  </button>
                )}
                <button className="capture-btn" disabled={camState !== "live"} onClick={capture} title="Capture">
                  <div className="capture-btn-inner" />
                </button>
                {hasMulti && <div style={{ width: 40 }} />}
              </div>
              <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "var(--muted)" }}>
                Tap the button to capture
              </div>

              {/* Also offer alternatives */}
              <div style={{ borderTop: "1px solid var(--border)", marginTop: 16, paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                <button className="btn-outline" style={{ width: "100%" }} onClick={() => nativeRef.current?.click()}>
                  📷 Open device camera (mobile)
                </button>
                <button className="btn-outline" style={{ width: "100%" }} onClick={() => switchTab("upload")}>
                  📁 Upload from files / gallery
                </button>
              </div>
            </>
          )}

          {/* ── Upload tab ── */}
          {tab === "upload" && !preview && (
            <>
              {/* Drag-and-drop zone */}
              <div
                className={`drop-zone ${dragOver ? "over" : ""}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
              >
                <div style={{ fontSize: 36, marginBottom: 10 }}>🖼️</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Drop an image here</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>or click to browse files</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8, opacity: .7 }}>
                  JPG · PNG · WEBP · HEIC · any image format
                </div>
              </div>

              {/* Native camera (mobile) */}
              <button
                className="btn-outline"
                style={{ width: "100%", marginTop: 10 }}
                onClick={() => nativeRef.current?.click()}
              >
                📷 Take a photo with device camera
              </button>

              <div style={{ marginTop: 12, fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
                <strong>Tips for best results:</strong> Hold the camera steady, ensure the VIN is fully
                visible, use good lighting, and avoid reflections on the sticker.
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hidden inputs */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.currentTarget.value = ""; }}
      />
      <input
        ref={nativeRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.currentTarget.value = ""; }}
      />
    </div>
  );
}
