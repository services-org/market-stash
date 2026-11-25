"use client";
import { ScanBarcode, X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

// The BarcodeDetector API is not part of the TypeScript DOM lib yet
type DetectedBarcode = { rawValue: string };
type BarcodeDetectorInstance = { detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]> };
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance;

function getDetector(): BarcodeDetectorConstructor | undefined {
    if (typeof window === "undefined") return undefined;
    return (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
}

type BarcodeScanButtonProps = {
    onScan: (code: string) => void;
    className?: string;
};

/** Camera barcode scanner. Renders nothing on browsers without BarcodeDetector support. */
export function BarcodeScanButton({ onScan, className }: Readonly<BarcodeScanButtonProps>) {
    const supported = useSyncExternalStore(
        () => () => {},
        () => !!getDetector(),
        () => false,
    );
    const [open, setOpen] = useState(false);

    if (!supported) return null;

    return (
        <>
            <Button type="button" variant="outline" size="icon" aria-label="مسح باركود" className={className ?? "size-9 shrink-0"} onClick={() => setOpen(true)}>
                <ScanBarcode className="size-4" />
            </Button>
            {open && (
                <ScannerOverlay
                    onClose={() => setOpen(false)}
                    onDetect={(code) => {
                        setOpen(false);
                        onScan(code);
                    }}
                />
            )}
        </>
    );
}

function ScannerOverlay({ onClose, onDetect }: Readonly<{ onClose: () => void; onDetect: (code: string) => void }>) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const callbacks = useRef({ onClose, onDetect });

    useEffect(() => {
        callbacks.current = { onClose, onDetect };
    });

    useEffect(() => {
        const Detector = getDetector();
        if (!Detector) return;

        let stream: MediaStream | undefined;
        let frame = 0;
        let stopped = false;
        const detector = new Detector();

        async function start() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
                const video = videoRef.current;
                if (!video || stopped) return;
                video.srcObject = stream;
                await video.play();

                const tick = async () => {
                    if (stopped) return;
                    try {
                        const codes = await detector.detect(video);
                        if (codes[0]?.rawValue) {
                            callbacks.current.onDetect(codes[0].rawValue);
                            return;
                        }
                    } catch {
                        // keep scanning
                    }
                    frame = window.setTimeout(tick, 250);
                };
                tick();
            } catch {
                toast.error("تعذر فتح الكاميرا. تأكد من السماح للموقع باستخدام الكاميرا.");
                callbacks.current.onClose();
            }
        }

        start();

        return () => {
            stopped = true;
            window.clearTimeout(frame);
            stream?.getTracks().forEach((track) => track.stop());
        };
    }, []);

    // Rendered in a portal; Radix dialogs disable pointer events outside of themselves, so re-enable them here
    return createPortal(
        <div className="fixed inset-0 z-[200] flex flex-col bg-black" style={{ pointerEvents: "auto" }}>
            <div className="flex items-center justify-between p-4 text-white">
                <span className="text-sm font-semibold">وجّه الكاميرا نحو الباركود</span>
                <button type="button" aria-label="إغلاق" onClick={onClose} className="flex size-9 items-center justify-center rounded-full bg-white/15">
                    <X className="size-5" />
                </button>
            </div>
            <div className="relative flex-1">
                <video ref={videoRef} className="size-full object-cover" playsInline muted />
                <div className="pointer-events-none absolute inset-x-8 top-1/2 h-40 -translate-y-1/2 rounded-2xl border-2 border-primary/90" />
            </div>
        </div>,
        document.body,
    );
}
