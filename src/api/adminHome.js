import { authFetch } from "../scripts/AuthProvider";

/**
 * Shared payload shape for Dashboard and Org analytics (GET /admin/home/).
 */
export async function fetchAdminHomeData() {
    const params = new URLSearchParams();
    params.set("recent_limit", "10");
    params.set("completed_limit", "10");
    params.set("active_limit", "10");
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
    };
}
