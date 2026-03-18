export interface QRAccessPassData {
  bookingId: number;
  tenantName: string;
  propertyName: string;
  propertyAddress: string;
  deposit: number;
  monthlyRent: number;
  status?: 'VERIFIED' | 'PENDING';
}

export const QR_CONSTANTS = {
  HEADER: 'PADFINDER TENANT QR ACCESS PASS',
  API_BASE: 'https://api.qrserver.com/v1/create-qr-code/',
  DEFAULT_SIZE: '280x280',
  DEFAULT_MARGIN: '15',
  FORMAT: 'png',
  ECC: 'M',
  QZONE: '2'
} as const;

/**
 * Generate a standardized QR code URL for tenant access passes
 * @param data QR access pass data
 * @returns QR code image URL
 */
export function generateAccessPassQR(data: QRAccessPassData): string {
  const qrContent = [
    QR_CONSTANTS.HEADER,
    `Reference: PF-${String(data.bookingId).padStart(6, "0")}`,
    `Tenant: ${data.tenantName}`,
    `Property: ${data.propertyName}`,
    `Address: ${data.propertyAddress}`,
    `Security Deposit: ₱${data.deposit.toLocaleString()}`,
    `Monthly Rent: ₱${data.monthlyRent.toLocaleString()}`,
    `Generated: ${new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })}`,
    `Status: ${data.status === 'VERIFIED' ? 'VERIFIED ACCESS' : 'PENDING'}`,
    `Valid Until: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US")}`,
    "Scan at Property for Instant Access"
  ].join("\n");

  const params = new URLSearchParams({
    size: QR_CONSTANTS.DEFAULT_SIZE,
    margin: QR_CONSTANTS.DEFAULT_MARGIN,
    format: QR_CONSTANTS.FORMAT,
    ecc: QR_CONSTANTS.ECC,
    qzone: QR_CONSTANTS.QZONE,
    data: qrContent
  });

  return `${QR_CONSTANTS.API_BASE}?${params.toString()}`;
}