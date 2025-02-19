import React, { useState } from "react";
import subcribebg from "../assets/subcribebg.png";
import coin from "../assets/CTCcoin.png";
import ReceiptModal from "./ReceiptModal"; // Import the ReceiptModal component
import "./subscription.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle, faShoppingBag } from "@fortawesome/free-solid-svg-icons";

const Subscription = () => {
    // State for credit quantity
    const [quantity, setQuantity] = useState(0);
    const pricePerCredit = 500; // Base price per item
    const total = quantity * pricePerCredit;

    // State for active tab: "buy" for Buy Credits, "history" for Billing History
    const [activeTab, setActiveTab] = useState("buy");

    // State for receipt modal visibility
    const [showReceipt, setShowReceipt] = useState(false);

    const handleIncrement = () => {
        setQuantity((prev) => prev + 1);
    };

    const handleDecrement = () => {
        if (quantity > 0) {
            setQuantity((prev) => prev - 1);
        }
    };

    return (
        <div className={`subscription-container justify-center flex flex-wrap ${showReceipt ? "blur-background" : ""}`}>
            <div className="subscription-box">
                <h1>Subscription</h1>
                <div className="subscription-card-container">
                    <h3>Your Plan:</h3>
                    <div className="subscribe-card">
                        <img src={subcribebg} alt="background" className="subscribe-bg" />
                        <h3>Premium</h3>
                        <ul>
                            <li>Full Language Learning Access</li>
                            <li>10 Assessments Included Annually</li>
                            <li>AI Speech & Coding Included</li>
                            <li>Additional Contest Access</li>
                        </ul>
                        <div className="flex justify-end w-full credit-balance">
                            <p className="flex">
                                Credits remaining: <span>4000</span>
                                <img src={coin} alt="coin" className="ctc-coin" />
                            </p>
                        </div>
                    </div>
                    <div className="subscribe-bottom">
                        <p>
                            Expires in: <span>365 days</span>
                        </p>
                        {/* dont touch */}
                        <p></p>
                        <p></p>
                        <p></p>
                        <p></p>
                        <p></p>
                        <p></p>
                        <p></p>
                        <button>Change Plan</button>
                    </div>
                </div>
            </div>

            {/* Toggle Buttons */}
            <div className="w-full justify-start flex credit-history mb-4">
                <div className="flex">
                    <p
                        onClick={() => setActiveTab("buy")}
                        className={`credit-history ${activeTab === "buy" ? "active" : ""}`}
                    >
                        Buy Credits
                    </p>
                    <p
                        onClick={() => setActiveTab("history")}
                        className={`credit-history ${activeTab === "history" ? "active" : ""}`}
                    >
                        Billing History
                    </p>
                </div>
            </div>

            {/* Billing History */}
             {/* Conditionally Render the Buy Credits Table */}
             {activeTab === "buy" && (
                <>
                    <div className="flex justify-center rounded-sm">
                        <table className="subcribe-table">
                            <thead>
                                <tr style={{ borderBottom: "1px solid #ccc" }}>
                                    <th style={{ textAlign: "center", padding: "8px" }}>#</th>
                                    <th style={{ textAlign: "center", padding: "8px" }}>Particulars</th>
                                    <th style={{ textAlign: "center", padding: "8px" }}>Quantity</th>
                                    <th style={{ textAlign: "center", padding: "8px" }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: "1px solid #ccc" }}>
                                    <td style={{ padding: "8px", textAlign: "center" }}>#1</td>
                                    <td style={{ padding: "8px", textAlign: "center" }}>
                                        Additional CTC Credits{" "}
                                        <FontAwesomeIcon
                                            icon={faInfoCircle}
                                            style={{ marginLeft: "8px", color: "#888", cursor: "pointer" }}
                                        />
                                    </td>
                                    <td className="text-center flex justify-center items-center">
                                        <div className="add-credit-btn">
                                            <button onClick={handleDecrement} className="minus">
                                                -
                                            </button>
                                            {quantity}
                                            <button onClick={handleIncrement} className="plus">
                                                +
                                            </button>
                                        </div>
                                    </td>
                                    <td style={{ padding: "8px", textAlign: "center" }}>{total}</td>
                                </tr>
                                <tr style={{ borderBottom: "1px solid #ccc" }}>
                                    <td style={{ padding: "8px", textAlign: "center" }}>#2</td>
                                    <td style={{ padding: "8px", textAlign: "center" }}>
                                        Additional CTC Credits{" "}
                                        <FontAwesomeIcon
                                            icon={faInfoCircle}
                                            style={{ marginLeft: "8px", color: "#888" }}
                                        />
                                    </td>
                                    <td className="text-center flex justify-center items-center">
                                        <div className="add-credit-btn">
                                            <button onClick={handleDecrement} className="minus">
                                                -
                                            </button>
                                            {quantity}
                                            <button onClick={handleIncrement} className="plus">
                                                +
                                            </button>
                                        </div>
                                    </td>
                                    <td style={{ padding: "8px", textAlign: "center" }}>{total}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className='buy-item'>
                        <div className='flex'>
                            <p>Total: {total}</p>
                            <button><FontAwesomeIcon icon={faShoppingBag} className='bug-icon' />Buy</button>
                        </div>
                    </div>
                </>
            )}

            {activeTab === "history" && (
                <div className="flex justify-center rounded-sm">
                    <table className="subcribe-history-table">
                        <thead>
                            <tr className="bg-gray-200">
                                <th>#ID</th>
                                <th>Particular</th>
                                <th>Date</th>
                                <th>Placeholder</th>
                                <th>Placeholder</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>56161</td>
                                <td>DSA Crash Course</td>
                                <td>1/7/2025</td>
                                <td>Placeholder</td>
                                <td>Placeholder</td>
                                <td>Status</td>
                                <td>
                                    <button className="reciept-btn" onClick={() => setShowReceipt(true)}>Get Receipt</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* Receipt Modal */}
            {showReceipt && <ReceiptModal onClose={() => setShowReceipt(false)} />}
        </div>
    );
};

export default Subscription;
