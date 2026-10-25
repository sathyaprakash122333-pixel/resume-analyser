import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CloudUpload, 
  FileText, 
  CheckCircle2, 
  Trash2, 
  RefreshCw, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  Loader2 
} from "lucide-react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { analyzeResume, getCareerTargets } from "../services/api";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function AnalyzeResume({ user, onSignOut }) {
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [analysisType, setAnalysisType] = useState("general"); // 'general' or 'job_match'
  const [jobDescription, setJobDescription] = useState("");

  // Pre-populate target role and company from user's saved Supabase career targets
  React.useEffect(() => {
    if (!user) return;
    getCareerTargets(user)
      .then((targets) => {
        if (Array.isArray(targets) && targets.length > 0) {
          const latest = targets[0];
          if (latest.target_role) setTargetRole(latest.target_role);
          if (latest.target_company) setTargetCompany(latest.target_company);
        }
      })
      .catch((err) => console.warn("Could not load user targets:", err));
  }, [user]);
  
  // UI states
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Validate and assign selected file
  const handleFileSelection = (selectedFile) => {
    setValidationError(null);
    setApiError(null);

    if (!selectedFile) return;

    // Validate PDF MIME type and extension
    const isPdf =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setValidationError("Unsupported file format. Please upload a PDF document (.pdf).");
      return;
    }

    // Validate 5MB file size limit
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (selectedFile.size / (1024 * 1024)).toFixed(2);
      setValidationError(`File size (${sizeMb} MB) exceeds the 5 MB limit. Please upload a smaller file.`);
      return;
    }

    setFile(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setValidationError(null);
    setApiError(null);

    // Front-end validation rules
    if (!file) {
      setValidationError("Please select or drop a resume PDF before starting analysis.");
      return;
    }
    if (!targetRole.trim()) {
      setValidationError("Target job role is required.");
      return;
    }
    if (analysisType === "job_match" && !jobDescription.trim()) {
      setValidationError("Please enter a job description when 'Match a specific job description' is selected.");
      return;
    }

    try {
      setSubmitting(true);
      const result = await analyzeResume({
        file,
        targetRole,
        targetCompany,
        analysisType,
        jobDescription,
        user,
      });

      // When the backend returns a successful analysis result, navigate to the summary route
      if (result && result.analysis_id) {
        navigate(`/analysis/${result.analysis_id}`, { state: { report: result } });
      }
    } catch (err) {
      console.error("Resume analysis submission error:", err);
      setApiError(err.message || "Failed to submit resume for analysis.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <Header user={user} onSignOut={onSignOut} />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-6 lg:px-12 py-8 max-w-5xl mx-auto w-full">
          {/* Page Title & Stepper Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Analyze Resume
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Upload your resume and provide details about your target role.
              </p>
            </div>

            {/* Stepper matching reference design */}
            <div className="flex items-center gap-3 bg-[#0b0f17] border border-[#161f30] px-4 py-2 rounded-xl text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-blue-400">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">
                  1
                </span>
                <span>Upload</span>
              </div>
              <div className="w-8 h-px bg-[#1e293b]" />
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="w-5 h-5 rounded-full bg-[#161f30] text-slate-400 flex items-center justify-center text-[11px]">
                  2
                </span>
                <span>Results</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Step 1: Upload Dropzone Card */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`bg-[#0b0f17] border-2 rounded-2xl p-8 sm:p-10 transition-all text-center flex flex-col items-center justify-center ${
                isDragging
                  ? "border-blue-500 bg-blue-950/20"
                  : file
                  ? "border-[#1e293b] bg-[#0c1017]"
                  : "border-dashed border-[#1e293b] hover:border-slate-700"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => handleFileSelection(e.target.files[0])}
              />

              {!file ? (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 shadow-lg shadow-blue-500/10">
                    <CloudUpload className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Drop your resume here
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">
                    or{" "}
                    <button
                      type="button"
                      onClick={handleBrowseClick}
                      className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2 cursor-pointer"
                    >
                      click to browse files
                    </button>
                  </p>
                  <p className="text-[11px] text-slate-500">PDF only • Max size 5 MB</p>

                  <button
                    type="button"
                    onClick={handleBrowseClick}
                    className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#161f30] hover:bg-[#1e293b] text-xs font-semibold text-slate-200 border border-slate-700/60 transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>Choose PDF</span>
                  </button>
                </>
              ) : (
                /* Selected File Preview Box */
                <div className="w-full max-w-md bg-[#080c14] border border-[#1e293b] rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-left truncate">
                      <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                      <p className="text-[11px] text-slate-400">{formatFileSize(file.size)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleBrowseClick}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#161f30] transition-colors cursor-pointer"
                      title="Replace file"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Validation Alert Box */}
            {validationError && (
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/60 text-amber-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">{validationError}</div>
              </div>
            )}

            {/* Target Role & Company Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Target role <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Python Backend Developer"
                  className="w-full bg-[#0b0f17] border border-[#161f30] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Target company <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  placeholder="e.g. Google"
                  className="w-full bg-[#0b0f17] border border-[#161f30] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Analysis Type Radio Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-300">Analysis type</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    analysisType === "general"
                      ? "bg-blue-950/20 border-blue-500 text-white"
                      : "bg-[#0b0f17] border-[#161f30] text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="analysisType"
                    value="general"
                    checked={analysisType === "general"}
                    onChange={() => setAnalysisType("general")}
                    className="accent-blue-600"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-white block">General resume review</span>
                    <span className="text-[11px] text-slate-400">
                      Evaluates structure, skills, and industry role alignment
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    analysisType === "job_match"
                      ? "bg-blue-950/20 border-blue-500 text-white"
                      : "bg-[#0b0f17] border-[#161f30] text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="analysisType"
                    value="job_match"
                    checked={analysisType === "job_match"}
                    onChange={() => setAnalysisType("job_match")}
                    className="accent-blue-600"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-white block">
                      Match a specific job description
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Tailors evaluation specifically against job requirements
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Job Description Textarea */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Job description{" "}
                {analysisType === "job_match" ? (
                  <span className="text-red-400">* (required for job-match)</span>
                ) : (
                  <span className="text-slate-500 font-normal">(optional for general review)</span>
                )}
              </label>
              <textarea
                rows={4}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                className="w-full bg-[#0b0f17] border border-[#161f30] rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono leading-relaxed"
              />
            </div>

            {/* Privacy Note */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#080c14] border border-[#161f30] text-[11px] text-slate-400 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Zero-Retention Privacy Note:</strong> Uploaded resumes are processed in-memory only. The backend does not retain permanent copies of your resume file or raw document text once analyzed.
              </div>
            </div>

            {/* API Status / Error Alert Banner */}
            {apiError && (
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/60 text-red-300 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <strong className="text-white block mb-0.5">Backend Service Notice:</strong>
                  {apiError}
                </div>
              </div>
            )}

            {/* Informational Loading Card during AI analysis */}
            {submitting && (
              <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-800/40 text-blue-300 text-xs flex items-center gap-2.5 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
                <span>Evaluating technical skills, experience depth, and career alignment with Gemini AI...</span>
              </div>
            )}

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 shadow-xl shadow-blue-600/20 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span className="text-sm">Analyzing Resume with Gemini AI...</span>
                </>
              ) : (
                <>
                  <span className="text-sm">Start Analysis</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
