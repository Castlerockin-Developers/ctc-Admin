import React, { useEffect, useState, useRef } from "react";
import "./receiptModal.css";
import { authFetch } from "../scripts/AuthProvider";
import { error as logError } from "../utils/logger";

const ReceiptModal = ({ transactionId, onClose }) => {
    const [pdfUrl, setPdfUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const urlRef = useRef(null);

    useEffect(() => {
        if (!transactionId) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        setPdfUrl("");
        (async () => {
            try {
                const response = await authFetch(`/admin/receipt/${encodeURIComponent(transactionId)}/`, {
                    method: "GET",
                });
                const blob = await response.blob();
                if (cancelled) return;
                if (urlRef.current) URL.revokeObjectURL(urlRef.current);
                const url = URL.createObjectURL(blob);
                urlRef.current = url;
                setPdfUrl(url);
            } catch (err) {
                if (!cancelled) {
                    logError("Failed to fetch receipt:", err);
                    setError(err?.message || "Failed to load receipt");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
            if (urlRef.current) {
                URL.revokeObjectURL(urlRef.current);
                urlRef.current = null;
            }
        };
    }, [transactionId]);

    const handleDownload = () => {
        if (!pdfUrl) return;
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = `Receipt_${transactionId || "receipt"}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="receipt-modal-overlay">
            <div className="receipt-modal-container">
                <h2 className="modal-title">Receipt Preview</h2>

                {loading && (
                    <div className="receipt-loading">Loading receipt…</div>
                )}
                {error && (
                    <div className="receipt-error">
                        <p>{error}</p>
                        <p className="receipt-error-hint">Please try again or contact support.</p>
                    </div>
                )}
                {pdfUrl && !loading && !error && (
                    <iframe
                        src={`${pdfUrl}#zoom=page-width`}
                        title="Receipt PDF"
                        className="full-screen-pdf"
                    />
                )}

                <div className="modal-buttons">
                    <button type="button" className="back-btn" onClick={onClose}>Back</button>
                    <button
                        type="button"
                        className="download-btn"
                        onClick={handleDownload}
                        disabled={!pdfUrl}
                    >
                        Download PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;
