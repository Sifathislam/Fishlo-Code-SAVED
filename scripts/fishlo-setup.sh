#!/bin/bash

# ========================================
#   Fishlo Printer Setup (v4 - STABLE)
# ========================================

echo "----------------------------------------"
echo "  Fishlo Printer Setup (macOS/Linux)"
echo "----------------------------------------"

# 1. Require Root
if [ "$EUID" -ne 0 ]; then
  echo "[System] Please run as root (use sudo ./fishlo-setup.sh)"
  exit
fi

CERT_CONTENT=$(cat <<EOF
-----BEGIN CERTIFICATE-----
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
-----END CERTIFICATE-----
EOF
)

# 2. Identify OS and Environment
IS_MAC=false
if [ "$(uname)" == "Darwin" ]; then
    IS_MAC=true
    QZ_PATH="/Applications/QZ Tray.app"
    # For sudo, $HOME might be /var/root, we want the real user's home
    REAL_HOME=$(eval echo "~$SUDO_USER")
    OVERRIDE_PATH="$REAL_HOME/Library/Application Support/qz/override.crt"
    PROP_FILE="$REAL_HOME/Library/Application Support/qz/qz-tray.properties"
    CONSOLE_PATH="$QZ_PATH/Contents/Resources/qz-tray-console.jar"
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    QZ_PATH="/opt/qz-tray"
    REAL_HOME=$(eval echo "~$SUDO_USER")
    OVERRIDE_PATH="$REAL_HOME/.qz/override.crt"
    PROP_FILE="$REAL_HOME/.qz/qz-tray.properties"
    CONSOLE_PATH="$QZ_PATH/qz-tray-console.jar"
fi

if [ -d "$QZ_PATH" ] || [ -f "$CONSOLE_PATH" ]; then
    echo "[1/4] Installing System Trust..."
    mkdir -p "$(dirname "$OVERRIDE_PATH")"
    echo "$CERT_CONTENT" > "$OVERRIDE_PATH"
    
    TEMP_PEM="/tmp/fishlo_temp.crt"
    echo "$CERT_CONTENT" > "$TEMP_PEM"

    if [ "$IS_MAC" = true ]; then
        # Install to macOS System Keychain
        security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "$TEMP_PEM"
    else
        # Install to Linux CA Store
        cp "$TEMP_PEM" /usr/local/share/ca-certificates/fishlo.crt
        update-ca-certificates
    fi

    echo "[2/4] Updating Properties Fallback..."
    # Escape path for properties file
    ESCAPED_PATH=$(echo "$OVERRIDE_PATH" | sed 's/\//\\\//g')
    if [ -f "$PROP_FILE" ]; then
        sed -i.bak '/authcert.override/d' "$PROP_FILE"
        echo "authcert.override=$OVERRIDE_PATH" >> "$PROP_FILE"
    else
        echo "authcert.override=$OVERRIDE_PATH" > "$PROP_FILE"
    fi

    echo "[3/4] Whitelisting via QZ Console..."
    if [ -f "$CONSOLE_PATH" ]; then
        java -jar "$CONSOLE_PATH" --whitelist "$TEMP_PEM"
    fi
    rm "$TEMP_PEM"

    echo "[4/4] Restarting QZ Tray..."
    pkill -f "qz-tray" || true
    sleep 1
    
    if [ "$IS_MAC" = true ]; then
        open "$QZ_PATH"
    else
        # Run as the real user, not root
        sudo -u $SUDO_USER "$QZ_PATH/qz-tray" > /dev/null 2>&1 &
    fi

    echo "----------------------------------------"
    echo "  Fishlo Setup Complete! (v4)"
    echo "  Please REFRESH your browser tab now."
    echo "----------------------------------------"
else
    echo "Error: QZ Tray not found! Please install it first."
fi