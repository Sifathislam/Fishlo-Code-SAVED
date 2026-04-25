import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
// qz-tray imported via global script in index.html for stability
import { useAxios } from '../shared/hooks/useAxios';

const QZContext = createContext();

export const useQZ = () => useContext(QZContext);

const QZ_CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIIECDCCAvCgAwIBAgIUVrjOBeHYvCwq9MiZoECdx4Q11VUwDQYJKoZIhvcNAQEL
BQAwVjELMAkGA1UEBhMCSU4xEDAOBgNVBAgMB0hhcnlhbmExEDAOBgNVBAcMB0d1
cmdhb24xDzANBgNVBAoMBkZpc2hsbzESMBAGA1UEAwwJZmlzaGxvLmluMB4XDTI2
MDMxMDA2MjkyMVoXDTM2MDMwODA2MjkyMVowVjELMAkGA1UEBhMCSU4xEDAOBgNV
BAgMB0hhcnlhbmExEDAOBgNVBAcMB0d1cmdhb24xDzANBgNVBAoMBkZpc2hsbzES
MBAGA1UEAwwJZmlzaGxvLmluMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKC
AQEAwG38CN6Rar0xicXa7QWyMWRAlyDXKGg2eWwng/Cyf8ZmNrHoYNlNq4BjGAJe
ThdFCM5Rjav/3W1vpA0KXJjMObEiKvKE4guimFfdOnFHYtZjpiUIGX6pJsMfhE+D
6/1nzoAVgtesDvVRYELrxa612WLj2315cqD+v9+XhrGJuoRyQXjg4I7xJovpbSaH
mOrk/lxu7Z6yfts0fGBjljiDjkmjHniiZ4j9dkXKMNdBDMhWFcJJ+zVxrT4snGPM
t0c2zEBP8bIuRJ044WO1jJLtYQnyv0Zx0Io5nQBZVJy0oBObdpNVApAnP3POYEc3
wHeMRxaa5IC5/VGvMmX9RXVsyQIDAQABo4HNMIHKMB0GA1UdDgQWBBR1AmaX+lFo
1blmY3QGpnyyJMzJTzAfBgNVHSMEGDAWgBR1AmaX+lFo1blmY3QGpnyyJMzJTzAP
BgNVHRMBAf8EBTADAQH/MA4GA1UdDwEB/wQEAwIB5jAxBgNVHSUEKjAoBggrBgEF
BQcDAQYIKwYBBQUHAwIGCCsGAQUFBwMDBggrBgEFBQcDBDA0BgNVHREELTArggls
b2NhbGhvc3SHBH8AAAGCCWZpc2hsby5pboINd3d3LmZpc2hsby5pbjANBgkqhkiG
9w0BAQsFAAOCAQEAimIVDUCzB4sybljXu1tXk5qP809MVAfMfO+XTlAkuI3O77Ky
M7m2uWyqL3zY1VNsETzeta2eicgiiWZe78FJLd1ZzUtzvGFPncwrtC3MtjglrWBp
N/Ly8RtP9bD+DNMSe7RGglBnPHDqTjYz3RtgeI9AhWkd6ECQrCvzC08SONpHH6eV
tZ1O/eZhzyZQhMCUxc55+sbHWLYQGRR9v1QE6ZT/GAQOPX20QO+JabXqBO8audKY
e9YREqkrsIM14T32rDP58NAnvaeXICsCyjusxecTRmq/FcWwjPuWnCdBy0KNa4Kj
MjQHRGfDifGdgU7bnwSC90whvVj1N0CABy1xRA==
-----END CERTIFICATE-----`;

// Global lock to prevent duplicate connection attempts during React dev remounts
// Use window for persistence across HMR/Remounts
if (typeof window !== 'undefined' && window.qzGlobalConnecting === undefined) {
    window.qzGlobalConnecting = false;
}

const QZProvider = ({ children }) => {
    const qz = window.qzStatic;
    const { api } = useAxios();
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [printer, setPrinter] = useState(localStorage.getItem('qz-printer') || '');
    const [printersList, setPrintersList] = useState([]);
    const [error, setError] = useState(null);

    // Initialization check
    useEffect(() => {
        if (window.qzStatic) {
            // Silently verified
        }
    }, []);

    // Setup QZ Security - Must be done BEFORE connect
    const setupSecurity = useCallback(() => {
        if (!qz) return;
        qz.security.setCertificatePromise((resolve) => {
            resolve(QZ_CERTIFICATE);
        });

        qz.security.setSignaturePromise((toSign) => {
            return (resolve, reject) => {
                api.post('/store/qz-sign/', { request: toSign })
                    .then(res => resolve(res.data))
                    .catch(err => {
                        console.error("QZ Signing Error", err);
                        reject(err);
                    });
            };
        });
    }, [api, qz]);

    const findPrinters = useCallback(async () => {
        if (!qz || !qz.websocket.isActive()) {
            console.warn("QZ WebSocket is not active. Skipping printer search.");
            return;
        }

        try {
            const list = await qz.printers.find();
            setPrintersList(list);

            if (list.length === 0) {
                console.warn("QZ: No printers detected on this system.");
            }
        } catch (err) {
            console.error("QZ: Printer search failed:", err.message);
        }
    }, [qz]);

    const disconnect = useCallback(async () => {
        if (qz && qz.websocket.isActive()) {
            try {
                await qz.websocket.disconnect();
                setIsConnected(false);
            } catch (err) {
                console.error("QZ Disconnect Error", err);
            }
        }
    }, [qz]);

    const connect = useCallback(async () => {
        if (!qz || isConnecting || isConnected || window.qzGlobalConnecting) {
            return;
        }

        try {
            window.qzGlobalConnecting = true;
            setIsConnecting(true);
            setError(null);

            // Ensure security is configured before any connection attempt
            setupSecurity();

            if (!qz.websocket.isActive()) {
                const options = {
                    host: ["localhost", "127.0.0.1", "localhost.qz.io"],
                    usingSecure: window.location.protocol === 'https:'
                };
                await qz.websocket.connect(options);
            }
            
            setIsConnected(true);
            window.qzGlobalConnecting = false; // Release lock on success
            
            await findPrinters();
        } catch (err) {
            console.error("QZ: Connection failed", err);
            setIsConnected(false);
            setError("QZ Tray connection failed.");
            window.qzGlobalConnecting = false; // Reset lock on failure
        } finally {
            setIsConnecting(false);
        }
    }, [findPrinters, qz, isConnecting, isConnected, setupSecurity]);

    // Setup security once on mount or when library becomes available
    useEffect(() => {
        if (qz) {
            setupSecurity();
        }
    }, [qz, setupSecurity]);

    useEffect(() => {
        const isStorePath = window.location.pathname.startsWith('/store');

        if (isStorePath) {
            if (qz && !isConnected && !isConnecting) {
                connect();
            }
        } else {
            if (isConnected || isConnecting) {
                disconnect();
            }
        }
    }, [connect, disconnect, isConnected, isConnecting, qz]);

    const selectPrinter = (name) => {
        setPrinter(name);
        localStorage.setItem('qz-printer', name);
    };


    // Production-ready ESC/POS raw text printing for thermal printers
    const printRaw = async (textContent) => {
        if (!isConnected) {
            throw new Error("QZ Tray is not connected.");
        }
        if (!printer) {
            throw new Error("No printer selected.");
        }

        const config = qz.configs.create(printer);

        const ESC = '\x1B';
        const GS = '\x1D';

        const data = [
            ESC + '@',               // Initialize printer (reset)
            ESC + 't' + '\x00',      // Set character code table (PC437)
            textContent,             // Pre-formatted receipt text from backend
            '\n\n\n\n',             // Feed 4 lines
            GS + 'V' + '\x01',      // Partial cut (works on most thermal printers)
        ];

        return qz.print(config, data);
    };

    return (
        <QZContext.Provider value={{
            isConnected,
            printer,
            printersList,
            error,
            connect,
            selectPrinter,
            printRaw,
            findPrinters
        }}>
            {children}
        </QZContext.Provider>
    );
};

export default QZProvider;
