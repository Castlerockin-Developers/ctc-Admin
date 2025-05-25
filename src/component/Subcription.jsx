
import React, { useState, useEffect } from "react";
import subcribebg from "../assets/subcribebg.png";
import coin from "../assets/CTCcoin.png";
import ReceiptModal from "./ReceiptModal"; // Import the ReceiptModal component
import "./subscription.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle, faShoppingBag } from "@fortawesome/free-solid-svg-icons";

const Subscription = () => {
    // State for credit quantity
    const [quantity, setQuantity] = useState(0);
    const pricePerCredit = 30;

    const numericQuantity = parseInt(quantity || "0", 10);
    const total = numericQuantity * pricePerCredit;

    const [activeTab, setActiveTab] = useState("buy");

    const [expiryDate, setExpiryDate] = useState("35 days");
    const [message, setMessage] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [billingHistory, setBillingHistory] = useState([]);
    // Uncomment the code below when your backend endpoint is ready
    /*
    useEffect(() => {
        fetch('/api/subscription')
          .then((res) => res.json())
          .then((data) => {
              // Assuming your backend returns an object with an expiresIn property.
              setExpiryDate(data.expiresIn + " days");
          })
          .catch((err) => console.error("Error fetching subscription data:", err));
    }, []);
    */


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

    const fetchBillingHistory = async () => {
        // Mock API call to fetch billing history
        // Replace this with an actual API call when the backend is ready
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    { id: 56161, particular: "DSA Crash Course", date: "1/7/2025", placeholder1: "Placeholder", placeholder2: "Placeholder", status: "Status" }
                ]);
            }, 500);
        });
    };

    useEffect(() => {
        const getBillingHistory = async () => {
            const history = await fetchBillingHistory();
            setBillingHistory(history);
        };

        if (activeTab === "history") {
            getBillingHistory();
        }
    }, [activeTab]);

    return (
        <div className={`subscription-container justify-center flex flex-wrap ${showReceipt ? "blur-background" : ""}`}>
            <div className="subscription-box">
                <h1>Subscription</h1>
                <div className="subscription-card-container">
                    <h3>Your Plan:</h3>
                    <div className='flex'>
                        <div className="subscribe-card">
                            <img src={subcribebg} alt="background" className="subscribe-bg" />
                            <h3>Premium</h3>
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
                                <div className="flex">
                                    <h2 className='credits-remain-text'>Credits remaining: <span>4000</span></h2>
                                    <img src={coin} alt="coin" className="ctc-coin" />
                                </div>
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
                                <th>Placeholder</th>
                                <th>Placeholder</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {billingHistory.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.id}</td>
                                    <td>{item.particular}</td>
                                    <td>{item.date}</td>
                                    <td>{item.placeholder1}</td>
                                    <td>{item.placeholder2}</td>
                                    <td>{item.status}</td>
                                    <td>
                                        <button className='reciept-btn' onClick={() => setShowReceipt(true)}>Get Receipt</button>
                                    </td>
                                </tr>
                            ))}
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
