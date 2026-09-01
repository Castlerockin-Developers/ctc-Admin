import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { log, error as logError } from "../utils/logger";
import { SESSION_EXPIRED_MESSAGE } from "../scripts/AuthProvider";
import Spinner from "../loader/Spinner";
import { useCache } from "../hooks/useCache";
import {
    fetchAdminHomeData,
    getStoredDashboardGroup,
    setStoredDashboardGroup,
} from "../api/adminHome";
import StudentAnalyticsSection from "./StudentAnalyticsSection";
import GroupFilterSelect from "./GroupFilterSelect";

function readPanelScopeSubtitle() {
    try {
        const raw = localStorage.getItem("panelScope");
        if (!raw) return null;
        const s = JSON.parse(raw);
        if (s?.admin_panel_access_level !== "branch") return null;
        const det = s.admin_panel_groups_detail;
        if (Array.isArray(det) && det.length) {
            const names = det.map((g) => g?.name).filter(Boolean);
            if (names.length) return `Branches: ${names.join(", ")}`;
        }
        return "Scoped to your assigned branches.";
    } catch {
        return null;
    }
}

function buildScopeSubtitle(sa, selectedGroupName) {
    if (sa?.scope === "group") {
        const names = Array.isArray(sa.branch_group_names) && sa.branch_group_names.length
            ? sa.branch_group_names.join(", ")
            : selectedGroupName;
        return names ? `Group: ${names}` : "Scoped to the selected user group.";
    }
    if (sa?.scope === "branch" && Array.isArray(sa.branch_group_names) && sa.branch_group_names.length) {
        return `Branches: ${sa.branch_group_names.join(", ")}`;
    }
    return readPanelScopeSubtitle();
}

/**
 * Dedicated Analytics view: same `/admin/home/` student KPIs as Dashboard, for org admins and branch coordinators.
 */
export default function OrgAnalyticsPage({ cacheAllowed }) {
    const navigate = useNavigate();
    const [selectedGroup, setSelectedGroup] = useState(getStoredDashboardGroup);

    const fetchData = useCallback(async () => {
        log("OrgAnalyticsPage: fetchAdminHomeData group=%s", selectedGroup);
        try {
            return await fetchAdminHomeData({ group: selectedGroup, includeAnalytics: true });
        } catch (err) {
            if (selectedGroup !== "all" && err.status === 400) {
                setSelectedGroup("all");
                setStoredDashboardGroup("all");
                return fetchAdminHomeData({ group: "all", includeAnalytics: true });
            }
            throw err;
        }
    }, [selectedGroup]);

    const onCacheHit = useCallback(() => {
        log("Org analytics loaded from cache");
    }, []);

    const onCacheMiss = useCallback(() => {
        log("Org analytics fetched fresh");
    }, []);

    const onError = useCallback((err) => {
        logError("Org analytics fetch error:", err);
    }, []);

    const {
        data: payload,
        loading,
        error,
        forceRefresh,
    } = useCache(`analytics_data_v4_${selectedGroup || "all"}`, fetchData, {
        enabled: cacheAllowed !== false,
        expiryMs: 3 * 60 * 1000,
        autoRefresh: false,
        onCacheHit,
        onCacheMiss,
        onError,
    });

    const sa = payload?.studentAnalytics ?? null;
    const orgGroups = payload?.groups ?? [];
    const selectedGroupName = orgGroups.find((g) => String(g.id) === String(selectedGroup))?.name;
    const payloadGroupId = payload?.selectedGroup?.id ?? null;
    const analyticsMatchesGroup =
        selectedGroup === "all"
            ? payloadGroupId == null
            : payloadGroupId != null && String(payloadGroupId) === String(selectedGroup);
    const scopeSubtitle = useMemo(
        () => buildScopeSubtitle(sa, selectedGroupName),
        [sa, selectedGroupName]
    );
    const isBranchScope = sa?.scope === "branch";
    const isGroupScope = sa?.scope === "group";

    const handleGroupChange = (value) => {
        setSelectedGroup(value);
        setStoredDashboardGroup(value);
    };

    if (loading || (payload && !analyticsMatchesGroup)) return <Spinner className="min-h-[200px]" />;

    if (error) {
        const isOrgMissing =
            typeof error.message === "string" && error.message.toLowerCase().includes("organization not found");

        if (error.status === 403) {
            navigate("/access-denied", { replace: true });
            return null;
        }
        const isSessionExpired = error.message === SESSION_EXPIRED_MESSAGE;
        return (
            <div className="flex flex-col items-center justify-center p-4 text-center">
                <p className="mb-4 text-lg text-red-500">
                    {isSessionExpired
                        ? "Your session has expired. Please log in again."
                        : isOrgMissing
                          ? "We could not find an organization associated with your admin account. Please contact support to get your organization set up."
                          : (error.message || "Failed to load analytics")}
                </p>
                {isSessionExpired ? (
                    <a href="/" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                        Log in again
                    </a>
                ) : (
                    <button
                        type="button"
                        onClick={forceRefresh}
                        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                        Retry
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="box-border flex h-full w-full max-w-full min-w-0 flex-col overflow-hidden">
            <StudentAnalyticsSection
                sa={sa}
                pageTitle="Analytics"
                scopeSubtitle={scopeSubtitle}
                sectionEyebrow={isGroupScope ? "Group analytics" : "Org analytics"}
                ctcCohortLabel={
                    isGroupScope
                        ? "Students per band (selected group)"
                        : isBranchScope
                          ? "Students per band (your cohort)"
                          : "Students per band (org cohort)"
                }
                readinessSubtitle={
                    isGroupScope
                        ? "Share of students in this group who started each recent exam"
                        : isBranchScope
                          ? "Share of students in your scope who started each recent exam"
                          : "Share of org students who started each recent exam"
                }
                headerRight={
                    <GroupFilterSelect
                        groups={orgGroups}
                        value={selectedGroup}
                        onChange={handleGroupChange}
                        className="w-full sm:w-auto sm:min-w-[12rem]"
                    />
                }
            />
        </div>
    );
}
