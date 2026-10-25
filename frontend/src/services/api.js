/**
 * ResumeIQ Centralized API Client Service
 * Communicates with the FastAPI backend using verified Firebase ID tokens.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

/**
 * Helper to obtain the Bearer authorization header with a fresh Firebase ID token.
 */
async function getAuthHeaders(user, isJson = true) {
  if (!user) {
    throw new Error("You must be signed in to perform this operation.");
  }
  let token;
  try {
    token = await user.getIdToken();
  } catch (err) {
    console.error("[API] Failed to retrieve Firebase ID token:", err);
    throw new Error("Authentication session expired. Please sign in again.");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
  };
  if (isJson) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

/**
 * Helper to safely extract error messages from backend responses.
 */
async function handleResponseError(response) {
  let message = `Request failed with status ${response.status}`;
  try {
    const errorData = await response.json();
    if (errorData.detail) {
      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        message = errorData.detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
      } else {
        message = JSON.stringify(errorData.detail);
      }
    }
  } catch (_) {
    // Fall back to default message if body is not JSON
  }

  if (response.status === 401) {
    throw new Error("Authentication failed: invalid or expired session. Please sign in again.");
  } else if (response.status === 403) {
    throw new Error("Access forbidden: you do not have permission to view or edit this resource.");
  } else if (response.status === 413) {
    throw new Error(message || "The uploaded resume file exceeds the 5 MB maximum allowed size.");
  } else if (response.status === 422) {
    throw new Error(message || "Validation error: please verify all submitted fields.");
  } else if (response.status === 429) {
    throw new Error("AI service rate limit reached. Please wait a moment and try again.");
  } else if (response.status >= 500) {
    throw new Error(message || "Internal server error occurred while processing your request.");
  }

  throw new Error(message);
}

/**
 * Checks the operational health of the FastAPI backend and database connectivity.
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/health`);
    if (!res.ok) {
      throw new Error(`Health check returned status ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.warn("[API] Backend health check failed:", error.message);
    return { status: "offline", error: error.message };
  }
}

/**
 * Retrieves the aggregated longitudinal dashboard metrics for the authenticated user.
 */
export async function getDashboardData(user) {
  const headers = await getAuthHeaders(user, false);
  const response = await fetch(`${API_BASE_URL}/api/v1/dashboard`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    await handleResponseError(response);
  }

  return await response.json();
}

/**
 * Retrieves or initializes the user profile in Supabase PostgreSQL.
 */
export async function getUserProfile(user) {
  const headers = await getAuthHeaders(user, false);
  const response = await fetch(`${API_BASE_URL}/api/v1/profile`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    await handleResponseError(response);
  }

  return await response.json();
}

/**
 * Updates editable user profile fields.
 */
export async function updateUserProfileApi(user, profileData) {
  const headers = await getAuthHeaders(user, true);
  const response = await fetch(`${API_BASE_URL}/api/v1/profile`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    await handleResponseError(response);
  }

  return await response.json();
}

/**
 * Retrieves all career targets for the authenticated user.
 */
export async function getCareerTargets(user) {
  const headers = await getAuthHeaders(user, false);
  const response = await fetch(`${API_BASE_URL}/api/v1/career-targets`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    await handleResponseError(response);
  }

  return await response.json();
}

/**
 * Creates a new career target for the authenticated user.
 */
export async function createCareerTarget(user, targetData) {
  const headers = await getAuthHeaders(user, true);
  const response = await fetch(`${API_BASE_URL}/api/v1/career-targets`, {
    method: "POST",
    headers,
    body: JSON.stringify(targetData),
  });

  if (!response.ok) {
    await handleResponseError(response);
  }

  return await response.json();
}

/**
 * Updates an existing career target owned by the authenticated user.
 */
export async function updateCareerTarget(user, targetId, targetData) {
  const headers = await getAuthHeaders(user, true);
  const response = await fetch(`${API_BASE_URL}/api/v1/career-targets/${targetId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(targetData),
  });

  return await response.json();
}

/**
 * Deletes an existing career target owned by the authenticated user.
 */
export async function deleteCareerTarget(user, targetId) {
  const headers = await getAuthHeaders(user, false);
  const response = await fetch(`${API_BASE_URL}/api/v1/career-targets/${targetId}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    await handleResponseError(response);
  }

  return true;
}

/**
 * Submits a resume PDF and target criteria for AI analysis with Gemini.
 */
export async function analyzeResume({ file, targetRole, targetCompany, analysisType, jobDescription, user }) {
  if (!file) {
    throw new Error("Please select a resume file (PDF) to analyze.");
  }
  if (!targetRole || !targetRole.trim()) {
    throw new Error("Target job role is required.");
  }
  if (analysisType === "job_match" && (!jobDescription || !jobDescription.trim())) {
    throw new Error("A job description is required when 'Match a specific job description' is selected.");
  }

  const authHeaders = await getAuthHeaders(user, false);

  // Prepare multipart form data
  const formData = new FormData();
  formData.append("file", file);
  formData.append("target_role", targetRole.trim());
  if (targetCompany && targetCompany.trim()) {
    formData.append("target_company", targetCompany.trim());
  }
  formData.append("analysis_type", analysisType);
  if (jobDescription && jobDescription.trim()) {
    formData.append("job_description", jobDescription.trim());
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/analyses`, {
      method: "POST",
      headers: authHeaders,
      body: formData,
    });

    if (!response.ok) {
      await handleResponseError(response);
    }

    return await response.json();
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error(
        `Unable to connect to FastAPI backend at ${API_BASE_URL}. Ensure the backend server is running.`
      );
    }
    throw error;
  }
}

/**
 * Retrieves the authenticated user's score history in chronological order.
 */
export async function getScoreHistory(user) {
  const headers = await getAuthHeaders(user, false);
  const response = await fetch(`${API_BASE_URL}/api/v1/analyses/history`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    await handleResponseError(response);
  }

  return await response.json();
}

export default {
  API_BASE_URL,
  checkBackendHealth,
  getDashboardData,
  getUserProfile,
  updateUserProfileApi,
  getCareerTargets,
  createCareerTarget,
  updateCareerTarget,
  deleteCareerTarget,
  analyzeResume,
  getScoreHistory,
};
