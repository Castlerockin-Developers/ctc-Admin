import React, { useState, useEffect } from "react";
import subcribebg from "../assets/subcribebg.png";
import coin from "../assets/CTCcoin.png";
import ReceiptModal from "./ReceiptModal"; // Import the ReceiptModal component
import "./subscription.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle, faShoppingBag } from "@fortawesome/free-solid-svg-icons";
import { authFetch } from "../scripts/AuthProvider"
 
const Subscription = () => {
    // State for credit quantity
    const [quantity, setQuantity] = useState(0);
    const pricePerCredit = 30;
 
    const numericQuantity = parseInt(quantity || "0", 10);
    const total = numericQuantity * pricePerCredit;
 
    const [activeTab, setActiveTab] = useState("buy");
 
    const [expiryDate, setExpiryDate] = useState("0 days");
    const [credits, setCredits] = useState(0);
    const [message, setMessage] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [billingHistory, setBillingHistory] = useState([]);
    const [plan_name, setPlan] = useState("Premium");
 
    const fetchSubscriptionDetails = async () => {
        const response = authFetch('/admin/subscribtion', { method: 'GET' });
        response.then((res) => res.json())
            .then((data) => {
                setExpiryDate((data.expires_in || "0") + " days");
                setCredits(data.credits);
                setPlan(data.current_plan);
                const billingData = data.billing_history.map((bill) => ({
                    id: bill.transaction_id,
                    particular: bill.plan_name,
                    date: new Date(bill.purchase_date).toDateString(),
                    credits: bill.credits,
                    cost: bill.cost,
                    status: bill.status
                }
                ));
                setBillingHistory(billingData);
            }
            ).catch((err) => console.error("Error fetching subscription data:", err));
    };
 
 
    // State for receipt modal visibility
    const [showReceipt, setShowReceipt] = useState(false);
 
    const handleIncrement = () => {
        setQuantity(String(numericQuantity + 500));
    };
 
    // Decrement in steps of 500 (cannot go below 0)
    const handleDecrement = () => {
        const newVal = Math.max(numericQuantity - 500, 0);
        setQuantity(String(newVal));
    };
 
    // Allow typing any non-negative integer or blank
    const handleChange = (e) => {
        const val = e.target.value;
        // Only allow digits or empty
        if (/^\d*$/.test(val)) {
            setQuantity(val);
        }
    };
 
    const mockPurchaseApi = () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, message: "Purchase successful!" });
            }, 1000);
        });
    };
 
    const handlePurchase = async () => {
        if (quantity === 0) {
            setMessage("Please select a quantity greater than 0.");
            setShowModal(true);
            return;
        }
 
        const response = await mockPurchaseApi();
        if (response.success) {
            setMessage(response.message);
            setQuantity(0); // Reset quantity after purchase
        } else {
            setMessage("Purchase failed. Please try again.");
        }
        setShowModal(true);
    };
 
    const closeModal = () => {
        setShowModal(false);
        setMessage("");
    };
 
    const handleChangePlan = () => {
        // Replace with the actual URL you want to navigate to
        window.location.href = "https://castlerockin.com";
    };
 
    useEffect(() => {
        fetchSubscriptionDetails();
 
        if (activeTab === "history") {
            fetchSubscriptionDetails();
        }
    }, [activeTab]);
 
    return (
        <div className={`subscription-container justify-center flex flex-wrap ${showReceipt ? "blur-background" : ""}`}>
            <div className="subscription-box">
                <h1>Subscription</h1>
                <div className="subscription-card-container">
                    <h3>Your Plan:</h3>
                    <div className='flex subscribe-card-wrapper'>
                        <div className="subscribe-card">
                            <img src={subcribebg} alt="background" className="subscribe-bg" />
                            <h3>{plan_name}</h3>
                            <ul>
                                <li>Full Language Learning Access</li>
                                <li>10 Assessment Included Annually</li>
                                <li>AI Speech & Coding Included</li>
                                <li>Additional Contest Access</li>
                            </ul>
                        </div>
                        <div className="subscribe-card">
                            <h3>Credits</h3>
                            <div className="flex w-full credit-balance">
                                <h2 className='credits-remain-text'>Credits remaining: <span>{credits}</span></h2>
                            </div>
                            <ul>
                                <li>Credits Used & Left</li>
                                <li>Per Assessment & Usage</li>
                                <li>Top-up Anytime</li>
                                <li>Upgrade Plan</li>
                            </ul>
                        </div>
                    </div>
                    <div className="subscribe-bottom">
                        <p>
                            Expires in: <span>{expiryDate}</span>
                        </p>
                        {/* dont touch */}
                        <p></p>
                        <p></p>
                        <p></p>
                        <p></p>
                        <p></p>
                        <p></p>
                        <p></p>
                        <button onClick={handleChangePlan}>Change Plan</button>
                    </div>
                </div>
            </div>
 
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
 
 
            {activeTab === "buy" && (
                //             div has been added
                <div>
                    <div className="flex justify-center rounded-sm">
                        <table className="subcribe-table">
                            <thead>
                                <tr style={{ borderBottom: "1px solid #ccc" }}>
 
                                    <th style={{ textAlign: "center", padding: "8px" }}>No.</th>
                                    <th style={{ textAlign: "center", padding: "8px" }}>Particulars</th>
                                    <th style={{ textAlign: "center", padding: "8px" }}>Credit</th>
                                    <th style={{ textAlign: "center", padding: "8px" }}>Price</th>
                                </tr>
                            </thead>
                            <tbody>
 
                                <tr style={{ borderBottom: "1px solid #ccc" }}>
                                    <td style={{ padding: "8px", textAlign: "center" }}>1</td>
                                    <td style={{ padding: "8px", textAlign: "center" }}>
                                        Additional CTC Credits{" "}
                                        <div className="tooltip-icon">
                                            <FontAwesomeIcon
                                                icon={faInfoCircle}
                                                style={{ marginLeft: "8px", color: "#888", cursor: "pointer" }}
                                            />
                                            <span className="tooltiptext">
                                                This is some information about CTC Credits.
                                            </span>
                                        </div>
                                    </td>
                                    <td className="text-center flex justify-center items-center">
                                        <div className="add-credit-btn">
                                            <button onClick={handleDecrement} className="minus">-</button>
                                            <input
                                                type="number"
                                                min="0"
                                                step="500"
                                                value={quantity}
                                                onChange={handleChange}
                                                className="quantity-input"
                                                onKeyDown={(e) => {
                                                    if (["e", "E", "+", "-"].includes(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                            <button onClick={handleIncrement} className="plus">+</button>
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
                            <button onClick={handlePurchase}>
                                <FontAwesomeIcon icon={faShoppingBag} className='bug-icon' />
                                Buy
                            </button>
                        </div>
                    </div>
                </div>
            )}
 
            {activeTab === "history" && (
                <div className="flex justify-center rounded-sm">
                    <table className="subcribe-history-table height-30">
                        <thead>
                            <tr className="bg-gray-200">
                                <th>#ID</th>
                                <th>Particular</th>
                                <th>Date</th>
                                <th>Credits</th>
                                <th>Cost</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {billingHistory.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center">No billing history available.</td>
                                </tr>
                            ) : (
                                billingHistory.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.id}</td>
                                        <td>{item.particular}</td>
                                        <td>{item.date}</td>
                                        <td>{item.credits}</td>
                                        <td>{item.cost}</td>
                                        <td>{item.status}</td>
                                        <td>
                                            <button className='reciept-btn' onClick={() => setShowReceipt(true)}>Get Receipt</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
 
 
            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={closeModal}>&times;</span>
                        <p>{message}</p>
                    </div>
                </div>
            )}
            {/* Receipt Modal */}
            {showReceipt && <ReceiptModal onClose={() => setShowReceipt(false)} />}
        </div>
 
    );
};
 
export default Subscription;