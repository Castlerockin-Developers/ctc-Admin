import { authFetch } from "../scripts/AuthProvider";

export const DASHBOARD_GROUP_STORAGE_KEY = "ctc_admin_dashboard_group";

export function getStoredDashboardGroup() {
    try {
        return sessionStorage.getItem(DASHBOARD_GROUP_STORAGE_KEY) || "all";
    } catch {
        return "all";
    }
}

export function setStoredDashboardGroup(groupId) {
    try {
        if (groupId && groupId !== "all") {
            sessionStorage.setItem(DASHBOARD_GROUP_STORAGE_KEY, String(groupId));
        } else {
            sessionStorage.removeItem(DASHBOARD_GROUP_STORAGE_KEY);
        }
    } catch {
        // ignore quota / private-mode failures
    }
}

export async function fetchAdminGroups() {
    const response = await authFetch("/admin/groups/", { method: "GET" });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
}

/**
 * Shared payload shape for Dashboard and Org analytics (GET /admin/home/).
 */
export async function fetchAdminHomeData({ group, includeAnalytics = false } = {}) {
    const params = new URLSearchParams();
    params.set("recent_limit", "10");
    params.set("completed_limit", "10");
    params.set("active_limit", "10");
    if (group && group !== "all") params.set("group", String(group));
    if (includeAnalytics) params.set("include_analytics", "1");
    const response = await authFetch(`/admin/home/?${params.toString()}`, { method: "GET" });
    const responseData = await response.json();
    return {
        dashboardData: {
            activeContest: responseData.active_exam,
            liveContest: responseData.completed_exams_count,
            credit: responseData.credits,
            totalStudents: responseData.total_users,
        },
        testDetails: responseData.active_exams,
        completedResults: responseData.completed_exams,
        recentExams: responseData.recent_exams ?? [],
        userData: responseData.logged_in_user,
        studentAnalytics: responseData.student_analytics ?? null,
        selectedGroup: responseData.selected_group ?? null,
        groups: Array.isArray(responseData.groups) ? responseData.groups : [],
    };
}
