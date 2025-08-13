import React, { useState, useEffect } from "react";
import subcribebg from "../assets/subcribebg.png";
import ReceiptModal from "./ReceiptModal";
import "./subscription.css";
import { authFetch } from "../scripts/AuthProvider";

const Subscription = () => {
    const [expiryDate, setExpiryDate] = useState("0 days");
    const [planName, setPlanName] = useState("Premium");
    const [billingHistory, setBillingHistory] = useState([]);
    const [showReceipt, setShowReceipt] = useState(false);

    // Fetch subscription details and billing history
    const fetchSubscriptionDetails = async () => {
        try {
            const response = await authFetch('/admin/subscribtion', { method: 'GET' });
            const data = await response.json();
            setExpiryDate((data.expires_in || 0) + " days");
            setPlanName(data.current_plan);
            const history = data.billing_history.map(bill => ({
                id: bill.transaction_id,
                particular: bill.plan_name,
                date: new Date(bill.purchase_date).toDateString(),
                credits: bill.credits,
                cost: bill.cost,
                status: bill.status
            }));
            setBillingHistory(history);
        } catch (err) {
            console.error("Error fetching subscription data:", err);
        }
    };

    // Navigate to plan change URL
    const handleChangePlan = () => {
        window.open("https://crackthecampus.com/", "_blank");
    };

    useEffect(() => {
        fetchSubscriptionDetails();
    }, []);

    return (
        <div className="subscription-container justify-center flex flex-wrap">
            <div className="subscription-box">
                <h1>Subscription</h1>

                <div className="subscription-card-container">
                    <h3>Your Plan:</h3>
                    <div className="flex subscribe-card-wrapper">
                        <div className="subscribe-card">
                            <img src={subcribebg} alt="background" className="subscribe-bg" />
                            <h3>{planName}</h3>
                            <ul>
                                <li>Full Language Learning Access</li>
                                <li>10 Assessments Included Annually</li>
                                <li>AI Speech & Coding Included</li>
                                <li>Additional Contest Access</li>
                            </ul>
                        </div>
                    </div>
                    <div className="subscribe-bottom">
                        <p>Expires in: <span>{expiryDate}</span></p>
                        <button onClick={handleChangePlan}>Change Plan</button>
                    </div>
                </div>

                <div className="w-full justify-start flex credit-history">
                    <p className="credit-history active">Billing History</p>
                </div>

                <div className="flex justify-center rounded-sm">
                    <table className="subcribe-history-table">
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
            </div>

            {showReceipt && <ReceiptModal onClose={() => setShowReceipt(false)} />}
        </div>
    );
};

export default Subscription;
