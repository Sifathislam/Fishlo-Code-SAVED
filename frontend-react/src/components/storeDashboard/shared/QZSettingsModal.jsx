import React, { useState } from 'react';
import { useQZ } from '../../../providers/QZProvider';

const QZSettingsModal = ({ show, onClose }) => {
    const { isConnected, printer, printersList, error, selectPrinter, connect, findPrinters } = useQZ();
    const [isRefreshing, setIsRefreshing] = useState(false);

    if (!show) return null;

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await findPrinters();
        setIsRefreshing(false);
    };

    const handleReconnect = async () => {
        setIsRefreshing(true);
        await connect();
        setIsRefreshing(false);
    };

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 10080 }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4">
                    <div className="modal-header border-bottom-0 p-4">
                        <h5 className="modal-title fw-bold">Printer Settings (QZ Tray)</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body p-4">
                        <div className="mb-4">
                            <label className="form-label text-muted small fw-medium text-uppercase mb-2">Connection Status</label>
                            <div className="d-flex align-items-center gap-2 p-3 rounded-3 bg-light border">
                                <div className={`rounded-circle ${isConnected ? 'bg-success' : 'bg-danger'}`} style={{ width: '10px', height: '10px' }}></div>
                                <span className={`fw-medium ${isConnected ? 'text-success' : 'text-danger'}`}>
                                    {isConnected ? 'Connected to QZ Tray' : error || 'Not Connected'}
                                </span>
                                {!isConnected && (
                                    <button 
                                        className="btn btn-sm btn-outline-primary ms-auto"
                                        onClick={handleReconnect}
                                        disabled={isRefreshing}
                                    >
                                        {isRefreshing ? 'Connecting...' : 'Try Again'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {isConnected && (
                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="form-label text-muted small fw-medium text-uppercase m-0">Select Default Printer</label>
                                    <button 
                                        className="btn btn-link btn-sm text-decoration-none p-0"
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                    >
                                        <i className={`bi bi-arrow-clockwise ${isRefreshing ? 'spin' : ''}`}></i> Refresh List
                                    </button>
                                </div>
                                <select 
                                    className="form-select border p-3 rounded-3"
                                    value={printer}
                                    onChange={(e) => selectPrinter(e.target.value)}
                                >
                                    <option value="">-- Choose a Printer --</option>
                                    {printersList.map((p, idx) => (
                                        <option key={idx} value={p}>{p}</option>
                                    ))}
                                </select>
                                <p className="mt-2 text-muted small">
                                    <i className="bi bi-info-circle me-1"></i>
                                    Common names for thermal printers: <strong>XP-80, POS-80, Generic / Text Only</strong>.
                                </p>
                            </div>
                        )}

                        <div className="alert alert-info rounded-3 border-0 bg-opacity-10 d-flex gap-3 m-0">
                            <i className="bi bi-lightbulb text-info h4 m-0"></i>
                            <div className="small">
                                <strong>Silent Printing Tip:</strong> Ensure QZ Tray is running on this computer. The first time you print, remember to check <strong>"Always Allow"</strong> to make it fully silent.
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer border-top-0 p-4 pt-0">
                        <button type="button" className="btn sd-btn-primary w-100 py-3 fw-bold shadow-soft" onClick={onClose}>
                            Done
                        </button>
                    </div>
                </div>
            </div>
            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default QZSettingsModal;
