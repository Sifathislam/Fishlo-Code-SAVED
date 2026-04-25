from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.backends import default_backend
from cryptography import x509
from cryptography.x509.oid import NameOID
import datetime
import os
import ipaddress

# 1. Generate Private Key
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
)

# 2. Save Private Key
with open("certs/private-key.pem", "wb") as f:
    f.write(private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption(),
    ))

# 3. Generate Certificate
subject = issuer = x509.Name([
    x509.NameAttribute(NameOID.COUNTRY_NAME, u"IN"),
    x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, u"Haryana"),
    x509.NameAttribute(NameOID.LOCALITY_NAME, u"Gurgaon"),
    x509.NameAttribute(NameOID.ORGANIZATION_NAME, u"Fishlo"),
    x509.NameAttribute(NameOID.COMMON_NAME, u"fishlo.in"),
])

san = x509.SubjectAlternativeName([
    x509.DNSName(u"localhost"),
    x509.IPAddress(ipaddress.IPv4Address(u"127.0.0.1")),
    x509.DNSName(u"fishlo.in"),
    x509.DNSName(u"www.fishlo.in"),
])

cert = (
    x509.CertificateBuilder()
    .subject_name(subject)
    .issuer_name(issuer)
    .public_key(private_key.public_key())
    .serial_number(x509.random_serial_number())
    # backdate 1 day to prevent clock skew issues
    .not_valid_before(datetime.datetime.utcnow() - datetime.timedelta(days=1))
    .not_valid_after(datetime.datetime.utcnow() + datetime.timedelta(days=3650))
    .add_extension(
        x509.SubjectKeyIdentifier.from_public_key(private_key.public_key()),
        critical=False,
    )
    .add_extension(
        x509.AuthorityKeyIdentifier.from_issuer_public_key(private_key.public_key()),
        critical=False,
    )
    .add_extension(
        x509.BasicConstraints(ca=True, path_length=None), critical=True
    )
    .add_extension(
        x509.KeyUsage(
            digital_signature=True,
            content_commitment=True, # Non-Repudiation
            key_encipherment=True,
            data_encipherment=False,
            key_agreement=False,
            key_cert_sign=True, # Required for CA
            crl_sign=True,
            encipher_only=False,
            decipher_only=False,
        ),
        critical=True,
    )
    .add_extension(
        x509.ExtendedKeyUsage([
            x509.oid.ExtendedKeyUsageOID.SERVER_AUTH,
            x509.oid.ExtendedKeyUsageOID.CLIENT_AUTH,
            x509.oid.ExtendedKeyUsageOID.CODE_SIGNING,
            x509.oid.ExtendedKeyUsageOID.EMAIL_PROTECTION,
        ]),
        critical=False,
    )
    .add_extension(san, critical=False)
    .sign(private_key, hashes.SHA256(), default_backend())
)

# 4. Save Certificate
with open("certs/certificate.pem", "wb") as f:
    f.write(cert.public_bytes(serialization.Encoding.PEM))

print("Keys and certificate generated successfully in certs/ directory.")
