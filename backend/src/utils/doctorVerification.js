const VERIFICATION_STATUS = Object.freeze({
  NOT_SUBMITTED: "not_submitted",
  PENDING: "pending",
  VERIFIED: "verified",
  FAILED: "failed",
  MANUAL_REVIEW: "manual_review",
});

function normalizeStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  const valid = new Set(Object.values(VERIFICATION_STATUS));
  return valid.has(normalized) ? normalized : VERIFICATION_STATUS.NOT_SUBMITTED;
}

function buildVerificationLabel({ hasLicenseSubmitted, verificationStatus, isNmcVerified }) {
  if (!hasLicenseSubmitted) {
    return "Unverified Doctor";
  }

  if (isNmcVerified || verificationStatus === VERIFICATION_STATUS.VERIFIED) {
    return "NMC Verified Doctor";
  }

  if (verificationStatus === VERIFICATION_STATUS.FAILED) {
    return "License Submitted (NMC Verification Failed)";
  }

  if (verificationStatus === VERIFICATION_STATUS.MANUAL_REVIEW) {
    return "License Submitted (Manual Review Needed)";
  }

  return "License Submitted (Pending NMC Verification)";
}

function getDoctorVerificationState(doctor) {
  const hasLicenseSubmitted = Boolean(String(doctor?.liscenceImage || "").trim());
  const isNmcVerified = Boolean(doctor?.isNmcVerified);
  let verificationStatus = normalizeStatus(doctor?.licenseVerificationStatus);

  if (!hasLicenseSubmitted) {
    verificationStatus = VERIFICATION_STATUS.NOT_SUBMITTED;
  } else if (isNmcVerified) {
    verificationStatus = VERIFICATION_STATUS.VERIFIED;
  } else if (verificationStatus === VERIFICATION_STATUS.NOT_SUBMITTED) {
    verificationStatus = VERIFICATION_STATUS.PENDING;
  }

  return {
    hasLicenseSubmitted,
    isNmcVerified,
    verificationStatus,
    verificationLabel: buildVerificationLabel({
      hasLicenseSubmitted,
      verificationStatus,
      isNmcVerified,
    }),
    extractedNmcNumber: String(doctor?.extractedNmcNumber || "").trim(),
    verificationConfidence: Number(doctor?.verificationConfidence || 0),
    verificationSource: String(doctor?.verificationSource || "none").trim() || "none",
    verificationFailureReason: String(doctor?.verificationFailureReason || "").trim(),
    verificationLastCheckedAt: doctor?.verificationLastCheckedAt || null,
    verifiedAt: doctor?.verifiedAt || null,
  };
}

module.exports = {
  VERIFICATION_STATUS,
  getDoctorVerificationState,
};
