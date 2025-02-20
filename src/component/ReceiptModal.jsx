import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import "./receiptModal.css";

const ReceiptModal = ({ onClose }) => {
    const [pdfUrl, setPdfUrl] = useState("");

    useEffect(() => {
        generatePDF();
    }, []);

    const generatePDF = () => {
        const doc = new jsPDF();

        doc.setFont("helvetica", "bold");
        doc.text("Receipt", 90, 20);

        // Generate PDF URL
        const pdfBlob = doc.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUrl);
    };

    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = "Receipt.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="receipt-modal-container">
                {/* Heading */}
                <h2 className="modal-title">Receipt Preview</h2>

                {/* Full-Screen PDF Viewer */}
                {pdfUrl && (
                    <iframe
                        src={`${pdfUrl}#zoom=page-width`}
                        title="Receipt PDF"
                        className="full-screen-pdf"
                    ></iframe>
                )}

                {/* Bottom Buttons */}
                <div className="modal-buttons">
                    <button className="back-btn" onClick={onClose}>Back</button>
                    <button className="download-btn" onClick={handleDownload}>Download PDF</button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;
