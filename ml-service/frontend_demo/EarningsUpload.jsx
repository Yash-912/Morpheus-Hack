import React, { useState, useCallback } from 'react';

/**
 * EarningsUpload — demo component for the earnings prediction pipeline.
 *
 * User uploads a raw platform CSV → POST /predict/earnings → shows
 * a table of per-worker predicted earnings + confidence.
 */

const API_URL =
    import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

export default function EarningsUpload() {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fileName, setFileName] = useState('');

    const handleUpload = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setLoading(true);
        setError(null);
        setResults(null);

        try {
            const form = new FormData();
            form.append('file', file);

            const res = await fetch(`${API_URL}/predict/earnings`, {
                method: 'POST',
                body: form,
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.detail || `Server error ${res.status}`);
            }

            const data = await res.json();
            setResults(data);
        } catch (err) {
            setError(err.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center">
            {/* Header */}
            <div className="w-full max-w-4xl mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                    Earnings Predictor
                </h1>
                <p className="text-slate-400 mt-1">
                    Upload a platform CSV to predict tomorrow's earnings for each worker.
                </p>
            </div>

            {/* Upload card */}
            <div className="w-full max-w-4xl bg-slate-800/60 backdrop-blur border border-slate-700 rounded-2xl p-8 mb-8">
                <label
                    htmlFor="csv-upload"
                    className="flex flex-col items-center justify-center gap-3 cursor-pointer
                               border-2 border-dashed border-slate-600 hover:border-teal-500
                               rounded-xl p-10 transition-colors"
                >
                    {/* Upload icon */}
                    <svg
                        className="w-10 h-10 text-teal-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                        />
                    </svg>
                    <span className="text-slate-300 text-sm font-medium">
                        {fileName || 'Click to upload CSV file'}
                    </span>
                    <span className="text-xs text-slate-500">
                        Accepts .csv with columns: worker_id, date, worked, rainfall_mm,
                        temp_celsius, average_rating, incentives_earned, net_earnings,
                        efficiency_ratio
                    </span>
                </label>
                <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleUpload}
                />
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center gap-3 text-teal-400 mb-8">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                            className="opacity-25"
                            cx="12" cy="12" r="10"
                            stroke="currentColor" strokeWidth="4" fill="none"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
                        />
                    </svg>
                    <span className="text-sm">Running feature engineering & prediction…</span>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="w-full max-w-4xl bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-8 text-sm">
                    ⚠ {error}
                </div>
            )}

            {/* Results table */}
            {results && results.length > 0 && (
                <div className="w-full max-w-4xl bg-slate-800/60 backdrop-blur border border-slate-700 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-200">
                            Predictions
                        </h2>
                        <span className="text-xs text-slate-500">
                            {results.length} workers
                        </span>
                    </div>

                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-700/50 sticky top-0">
                                <tr>
                                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Worker ID</th>
                                    <th className="text-right px-4 py-3 text-slate-400 font-medium">Predicted Earnings</th>
                                    <th className="text-right px-4 py-3 text-slate-400 font-medium">Confidence</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {results.map((r) => (
                                    <tr key={r.worker_id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3 text-slate-300 font-mono">
                                            #{r.worker_id}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                                            ₹{r.predicted_earnings_rupees.toLocaleString('en-IN', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${r.confidence >= 0.85
                                                        ? 'bg-emerald-500/20 text-emerald-400'
                                                        : r.confidence >= 0.75
                                                            ? 'bg-yellow-500/20 text-yellow-400'
                                                            : 'bg-orange-500/20 text-orange-400'
                                                    }`}
                                            >
                                                {(r.confidence * 100).toFixed(0)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
