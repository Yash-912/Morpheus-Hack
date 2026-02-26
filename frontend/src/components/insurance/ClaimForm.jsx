import { useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';

/**
 * ClaimForm — Submit an insurance claim.
 *
 * @param {object} props
 * @param {Array} props.activePolicies — List of active insurance policies
 * @param {Function} props.onSubmit — Called with FormData
 * @param {boolean} [props.isLoading]
 */
const ClaimForm = ({ activePolicies = [], onSubmit, isLoading = false }) => {
    const [selectedPolicy, setSelectedPolicy] = useState('');
    const [description, setDescription] = useState('');
    const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
    const [documents, setDocuments] = useState([]);

    const typeLabels = {
        daily_accident: '🤕 Accident Cover',
        weekly_health: '💊 Health Guard',
        device: '📱 Device Protection',
        vehicle_breakdown: '🔧 Vehicle Breakdown',
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (documents.length + files.length > 5) {
            alert('Maximum 5 documents allowed');
            return;
        }
        setDocuments((prev) => [...prev, ...files]);
    };

    const removeDocument = (index) => {
        setDocuments((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedPolicy || !description.trim()) return;

        const formData = new FormData();
        formData.append('policyId', selectedPolicy);
        formData.append('description', description.trim());
        formData.append('incidentDate', incidentDate);
        documents.forEach((doc) => {
            formData.append('documents', doc);
        });

        onSubmit?.(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="card">
            <h3 className="text-heading-md mb-4">File a Claim</h3>

            {/* Policy selector */}
            <div className="mb-4">
                <label className="text-label text-gigpay-text-secondary mb-1.5 block">
                    Select Policy
                </label>
                {activePolicies.length === 0 ? (
                    <p className="text-body-md text-red-600 p-3 bg-red-50 rounded-xl border border-red-200">
                        No active policies. Activate a plan first.
                    </p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {activePolicies.map((policy) => (
                            <button
                                key={policy.id}
                                type="button"
                                onClick={() => setSelectedPolicy(policy.id)}
                                className={`p-3 rounded-xl border-[1.5px] text-left transition-all duration-75 ${selectedPolicy === policy.id
                                        ? 'border-gigpay-navy bg-[#C8F135]/10 shadow-[2px_2px_0px_#0D1B3E]'
                                        : 'border-gigpay-border bg-white'
                                    }`}
                            >
                                <span className="text-body-md font-semibold">
                                    {typeLabels[policy.type] || policy.type}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Incident date */}
            <div className="mb-4">
                <label className="text-label text-gigpay-text-secondary mb-1.5 block">
                    Incident Date
                </label>
                <input
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="input"
                />
            </div>

            {/* Description */}
            <div className="mb-4">
                <label className="text-label text-gigpay-text-secondary mb-1.5 block">
                    What happened?
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the incident in detail..."
                    rows={4}
                    className="input h-auto resize-none"
                    required
                />
            </div>

            {/* Document upload */}
            <div className="mb-4">
                <label className="text-label text-gigpay-text-secondary mb-1.5 block">
                    Supporting Documents (max 5)
                </label>

                {/* Upload buttons row */}
                <div className="flex gap-2 mb-2">
                    <label className="btn-secondary flex items-center gap-1.5 cursor-pointer flex-1 justify-center">
                        <Camera size={16} />
                        <span>Camera</span>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </label>
                    <label className="btn-secondary flex items-center gap-1.5 cursor-pointer flex-1 justify-center">
                        <Upload size={16} />
                        <span>Gallery</span>
                        <input
                            type="file"
                            accept="image/*,application/pdf"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </label>
                </div>

                {/* Uploaded file chips */}
                {documents.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {documents.map((doc, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-1.5 bg-gigpay-surface border border-gigpay-border rounded-lg px-2.5 py-1.5"
                            >
                                <span className="text-caption text-gigpay-text-secondary truncate max-w-[120px]">
                                    {doc.name}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeDocument(i)}
                                    className="text-red-400 hover:text-red-600"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={!selectedPolicy || !description.trim() || isLoading || activePolicies.length === 0}
                className="btn-primary w-full"
            >
                {isLoading ? 'Submitting...' : 'Submit Claim'}
            </button>
        </form>
    );
};

export default ClaimForm;
