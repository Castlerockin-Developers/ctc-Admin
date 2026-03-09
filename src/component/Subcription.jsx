import React, { useState, useEffect } from "react";
import { error as logError } from "../utils/logger";
import subcribebg from "../assets/subcribebg.png";
import ReceiptModal from "./ReceiptModal";
import { authFetch } from "../scripts/AuthProvider";

const Subscription = () => {
  const [expiryDate, setExpiryDate] = useState("0 days");
  const [planName, setPlanName] = useState("Premium");
  const [billingHistory, setBillingHistory] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedReceiptItem, setSelectedReceiptItem] = useState(null);

  const fetchSubscriptionDetails = async () => {
    try {
      const response = await authFetch("/admin/subscribe", { method: "GET" });
      const data = await response.json();
      setExpiryDate((data.expires_in ?? 0) + " days");
      setPlanName(data.current_plan ?? "Premium");
      const history = (data.billing_history ?? []).map((bill) => ({
        id: bill.transaction_id,
        particular: bill.plan_name,
        date: new Date(bill.purchase_date).toDateString(),
        credits: bill.credits,
        cost: bill.cost,
        status: bill.status,
      }));
      setBillingHistory(history);
    } catch (err) {
      logError("Error fetching subscription data:", err);
    }
  };

  useEffect(() => {
    fetchSubscriptionDetails();
  }, []);

  const planFeatures = [
    "Full Language Learning Access",
    "10 Assessments Included Annually",
    "AI Speech & Coding Included",
    "Additional Contest Access",
  ];

  return (
    <div className="flex h-[87vh] min-h-[calc(100dvh-4.5rem)] w-full max-w-full flex-col overflow-hidden rounded-lg bg-[#282828] p-4 sm:p-5 md:p-6 md:pb-8">
      {/* Single scroll area - no nested scroll to avoid double scrollbar */}
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overflow-x-hidden overscroll-contain">
        <h1 className="shrink-0 text-xl font-semibold text-white sm:text-2xl">
          Subscription
        </h1>

        {/* Your Plan */}
        <div className="shrink-0 rounded-xl border border-[#5a5a5a] bg-[#333333] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-6">
            <div className="relative min-h-[140px] overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#3a3a3a] to-[#252525] p-4 sm:min-w-0 sm:flex-1">
              <img
                src={subcribebg}
                alt=""
                className="pointer-events-none absolute -right-2 top-1/2 h-24 w-24 -translate-y-1/2 object-contain opacity-30 sm:h-28 sm:w-28"
                aria-hidden
              />
              <div className="relative">
                <h3 className="text-lg font-semibold text-white sm:text-xl">
                  {planName}
                </h3>
                <ul className="mt-3 space-y-1.5 pl-4 text-sm text-gray-300">
                  {planFeatures.map((feature, i) => (
                    <li key={i} className="list-disc">
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex shrink-0 flex-col justify-center border-t border-[#5a5a5a] pt-4 sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0">
              <p className="text-sm text-gray-300">
                Expires in: <span className="font-semibold text-white">{expiryDate}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Billing History */}
        <div className="flex min-h-0 flex-col gap-3">
          <p className="shrink-0 border-b-2 border-[#A294F9] pb-2 text-base font-semibold text-white">
            Billing History
          </p>

          {billingHistory.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-[#5a5a5a] bg-[#353535] py-12 text-gray-400">
              No billing history available.
            </div>
          ) : (
            <>
              {/* Mobile: cards */}
              <div className="flex flex-col gap-3 md:hidden">
                {billingHistory.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-[#5a5a5a] bg-[#3a3a3a] p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1" />
                      <span className="shrink-0 rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-400">
                        {item.status}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-300">
                      <span className="text-gray-500">Credits</span>
                      <span className="text-right text-white">{item.credits}</span>
                      <span className="text-gray-500">Cost</span>
                      <span className="text-right text-white">{item.cost}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedReceiptItem(item); setShowReceipt(true); }}
                      className="mt-4 w-full rounded-lg bg-[#A294F9] py-2.5 text-sm font-medium text-white hover:bg-[#8b7ce8]"
                    >
                      Get Receipt
                    </button>
                  </div>
                ))}
              </div>

              {/* Desktop: table - no inner vertical scroll; page scroll only */}
              <div className="hidden overflow-x-auto rounded-lg border border-[#5a5a5a] md:block">
                <div className="min-w-[640px]">
                  <table className="w-full min-w-[640px] table-auto border-collapse">
                    <tbody>
                      {billingHistory.map((item, index) => (
                        <tr
                          key={item.id}
                          className={`border-b border-[#555] transition-colors hover:bg-[#404040] ${
                            index % 2 === 0 ? "bg-[#3a3a3a]" : "bg-[#353535]"
                          }`}
                        >
                          <td className="px-4 py-3 text-center text-sm text-white">
                            {item.credits}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-white">
                            {item.cost}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-400">
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => { setSelectedReceiptItem(item); setShowReceipt(true); }}
                              className="rounded-lg bg-[#A294F9] px-3 py-2 text-sm font-medium text-white hover:bg-[#8b7ce8]"
                            >
                              Get Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showReceipt && selectedReceiptItem && (
        <ReceiptModal
          transactionId={selectedReceiptItem.id}
          onClose={() => { setShowReceipt(false); setSelectedReceiptItem(null); }}
        />
      )}
    </div>
  );
};

export default Subscription;
