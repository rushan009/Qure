const fs = require("fs");
const path = require("path");
const multer = require("multer");
const Tesseract = require("tesseract.js");
const Doctor = require("../models/doctor.model");
const User = require("../models/user.model");
const {
  VERIFICATION_STATUS,
  getDoctorVerificationState,
} = require("../utils/doctorVerification");

const LICENSE_UPLOAD_DIR = path.resolve(__dirname, "../../uploads/doctor-licenses");

if (!fs.existsSync(LICENSE_UPLOAD_DIR)) {
  fs.mkdirSync(LICENSE_UPLOAD_DIR, { recursive: true });
}

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const NMC_DEFAULT_SEARCH_URL = "https://www.nmc.org.np/search-registered-doctor/";
const NMC_TIMEOUT_MS = Number(process.env.NMC_VERIFY_TIMEOUT_MS || 15000);

function cleanFileName(fileName) {
  const raw = String(fileName || "license-photo").trim();
  return raw.replace(/[^a-zA-Z0-9._-]/g, "_");
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, LICENSE_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const safeName = cleanFileName(file?.originalname || "license-photo");
    const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniquePrefix}-${safeName}`);
  },
});

function fileFilter(_req, file, cb) {
  const mimeType = String(file?.mimetype || "").toLowerCase();
  if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
    cb(new Error("Only JPG, PNG, or WEBP license photos are allowed."));
    return;
  }

  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

function safeUnlink(filePath) {
  if (!filePath) return;
  if (!fs.existsSync(filePath)) return;

  try {
    fs.unlinkSync(filePath);
  } catch (err) {
    console.error("Failed to delete file:", err?.message || err);
  }
}

function normalizeNmcNumber(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9-]/g, "");
}

function isLikelyNmcNumber(value) {
  const candidate = normalizeNmcNumber(value);
  if (!candidate) return false;
  if (!/\d/.test(candidate)) return false;

  const digits = candidate.match(/\d/g) || [];
  return candidate.length >= 4 && candidate.length <= 20 && digits.length >= 3;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function hasNoRecordText(value) {
  return /(no\s+record|not\s+found|does\s+not\s+exist|unregistered)/i.test(String(value || ""));
}

function containsNmcInText(value, nmcNumber) {
  const normalizedNmc = normalizeNmcNumber(nmcNumber);
  if (!isLikelyNmcNumber(normalizedNmc)) {
    return false;
  }

  const rawText = String(value || "").toUpperCase();
  const escapedNmc = normalizedNmc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const boundaryPattern = new RegExp(`(^|[^A-Z0-9])${escapedNmc}([^A-Z0-9]|$)`, "i");

  if (boundaryPattern.test(rawText)) {
    return true;
  }

  const compactText = rawText.replace(/\s+/g, "");
  return compactText.includes(normalizedNmc);
}

function containsNameInText(value, fullName) {
  const name = String(fullName || "").trim().toLowerCase();
  if (!name) return true;

  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3);

  if (!parts.length) return true;
  const haystack = String(value || "").toLowerCase();

  return parts.every((part) => haystack.includes(part));
}

function parseNmcCandidatesFromText(ocrText) {
  const text = String(ocrText || "");
  const taggedCandidates = [];

  const taggedPattern =
    /(?:\bnmc\b|\breg(?:istration)?\b|\blicen[cs]e\b|\bliscence\b)\s*(?:no|number|num|#)?\s*[:.-]?\s*([A-Z0-9-]{3,20})/gi;
  for (const match of text.matchAll(taggedPattern)) {
    const candidate = normalizeNmcNumber(match?.[1]);
    if (isLikelyNmcNumber(candidate)) {
      taggedCandidates.push(candidate);
    }
  }

  const fallbackCandidates = [];
  const fallbackPattern = /\b\d{4,9}\b/g;
  for (const match of text.matchAll(fallbackPattern)) {
    const candidate = normalizeNmcNumber(match?.[0]);
    if (isLikelyNmcNumber(candidate)) {
      fallbackCandidates.push(candidate);
    }
  }

  const allCandidates = [...new Set([...taggedCandidates, ...fallbackCandidates])];
  const primaryCandidate = allCandidates[0] || "";

  let confidence = 0;
  if (primaryCandidate) {
    confidence = taggedCandidates.includes(primaryCandidate) ? 0.86 : 0.58;
  }

  return {
    primaryCandidate,
    confidence,
  };
}

async function runLicenseOcr(imagePath) {
  const result = await Tesseract.recognize(imagePath, "eng", {
    logger: () => {},
  });

  const extractedText = String(result?.data?.text || "").trim();
  return extractedText;
}

function parseBooleanFromApiPayload(payload, nmcNumber, fullName) {
  if (typeof payload === "boolean") {
    return payload;
  }

  if (typeof payload === "string") {
    if (hasNoRecordText(payload)) return false;
    const hasNmc = containsNmcInText(payload, nmcNumber);
    const hasName = containsNameInText(payload, fullName);
    return hasNmc && hasName;
  }

  if (Array.isArray(payload)) {
    return payload.some((row) => parseBooleanFromApiPayload(row, nmcNumber, fullName));
  }

  if (!payload || typeof payload !== "object") {
    return false;
  }

  const directBooleanKeys = ["verified", "isVerified", "found", "exists", "match"];
  for (const key of directBooleanKeys) {
    if (typeof payload[key] === "boolean") {
      return payload[key];
    }
  }

  const nestedCandidates = [
    payload.data,
    payload.result,
    payload.results,
    payload.records,
    payload.items,
    payload.payload,
  ];

  for (const candidate of nestedCandidates) {
    if (candidate !== undefined) {
      const parsed = parseBooleanFromApiPayload(candidate, nmcNumber, fullName);
      if (parsed) return true;
    }
  }

  const asText = JSON.stringify(payload);
  if (hasNoRecordText(asText)) return false;

  return containsNmcInText(asText, nmcNumber) && containsNameInText(asText, fullName);
}

async function verifyViaConfiguredApi({ nmcNumber, fullName }) {
  const baseUrl = String(process.env.NMC_VERIFY_API_URL || "").trim();
  if (!baseUrl) {
    return {
      attempted: false,
      available: false,
      source: "none",
      verified: false,
      reason: "NMC API URL is not configured.",
    };
  }

  const query = new URLSearchParams();
  query.set("nmcNumber", nmcNumber);
  if (fullName) {
    query.set("fullName", fullName);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), NMC_TIMEOUT_MS);

  try {
    const joiner = baseUrl.includes("?") ? "&" : "?";
    const requestUrl = `${baseUrl}${joiner}${query.toString()}`;
    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
      },
      signal: controller.signal,
    });

    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      return {
        attempted: true,
        available: true,
        source: "nmc_api",
        verified: false,
        reason: `NMC API responded with status ${response.status}.`,
      };
    }

    const verified = parseBooleanFromApiPayload(payload, nmcNumber, fullName);
    return {
      attempted: true,
      available: true,
      source: "nmc_api",
      verified,
      reason: verified ? "" : "No matching registration was returned by NMC API.",
    };
  } catch (err) {
    const timeoutMessage =
      err?.name === "AbortError"
        ? "NMC API request timed out."
        : "NMC API check failed.";

    return {
      attempted: true,
      available: true,
      source: "nmc_api",
      verified: false,
      reason: timeoutMessage,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function getFramesForSearch(page) {
  if (typeof page.frames === "function") {
    const frames = page.frames();
    if (Array.isArray(frames) && frames.length) {
      return frames;
    }
  }

  return [page];
}

async function fillByHeuristic(frame, value, keywordHints = []) {
  const result = await frame.evaluate(
    ({ value: inputValue, keywordHints: hints }) => {
      function isVisible(el) {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden"
        );
      }

      function getLabelText(el) {
        const id = String(el?.id || "").trim();
        if (id) {
          try {
            const directLabel = document.querySelector(`label[for=\"${CSS.escape(id)}\"]`);
            if (directLabel?.textContent) {
              return directLabel.textContent;
            }
          } catch {
            // Ignore CSS.escape / selector errors.
          }
        }

        const parentLabel = el.closest("label");
        if (parentLabel?.textContent) {
          return parentLabel.textContent;
        }

        return "";
      }

      const candidates = Array.from(document.querySelectorAll("input, textarea"))
        .filter((el) => {
          if (!isVisible(el)) return false;

          const type = String(el.getAttribute("type") || "text").toLowerCase();
          if (["hidden", "file", "checkbox", "radio", "button", "submit"].includes(type)) {
            return false;
          }

          return true;
        })
        .map((el, index) => {
          const attrs = [
            String(el.id || ""),
            String(el.name || ""),
            String(el.placeholder || ""),
            String(el.getAttribute("aria-label") || ""),
            String(el.className || ""),
            String(el.getAttribute("autocomplete") || ""),
          ]
            .join(" ")
            .toLowerCase();

          const labelText = String(getLabelText(el) || "").toLowerCase();
          const contextText = String(el.closest("form, .rz-form, .form-group, .row, div")?.textContent || "")
            .toLowerCase()
            .slice(0, 600);

          const haystack = `${attrs} ${labelText} ${contextText}`;
          let score = 0;

          const keywords = Array.isArray(hints) ? hints : [];
          keywords.forEach((word) => {
            const key = String(word || "").toLowerCase().trim();
            if (!key) return;

            if (attrs.includes(key)) score += 3;
            if (labelText.includes(key)) score += 2;
            if (contextText.includes(key)) score += 1;
          });

          return {
            el,
            index,
            score,
            attrs,
            labelText,
            haystack,
          };
        });

      if (!candidates.length) {
        return { filled: false, reason: "no_visible_inputs" };
      }

      let target = candidates
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)[0];

      if (!target) {
        target = candidates[0];
      }

      target.el.focus();
      target.el.value = "";
      target.el.dispatchEvent(new Event("input", { bubbles: true }));
      target.el.value = String(inputValue || "");
      target.el.dispatchEvent(new Event("input", { bubbles: true }));
      target.el.dispatchEvent(new Event("change", { bubbles: true }));

      return {
        filled: true,
        score: target.score,
        attrs: target.attrs.slice(0, 120),
        labelText: target.labelText.slice(0, 120),
        index: target.index,
      };
    },
    { value, keywordHints }
  );

  return Boolean(result?.filled);
}

async function fillFirstInput(page, selectors, value, keywordHints = []) {
  const frames = getFramesForSearch(page);

  for (const frame of frames) {
    for (const selector of selectors) {
      const locator = frame.locator(selector).first();
      const count = await locator.count();
      if (!count) continue;

      try {
        await locator.click({ timeout: 1500 });
        await locator.fill("");
        await locator.fill(value);
        return true;
      } catch {
        // Try next selector.
      }
    }
  }

  for (const frame of frames) {
    try {
      const filled = await fillByHeuristic(frame, value, keywordHints);
      if (filled) {
        return true;
      }
    } catch {
      // Try next frame.
    }
  }

  return false;
}

async function clickSearchTrigger(page, selectors) {
  const frames = getFramesForSearch(page);

  for (const frame of frames) {
    for (const selector of selectors) {
      const button = frame.locator(selector).first();
      if ((await button.count()) === 0) continue;

      try {
        await button.click({ timeout: 2500 });
        return true;
      } catch {
        // Continue trying alternative selectors.
      }
    }
  }

  for (const frame of frames) {
    try {
      const clicked = await frame.evaluate(() => {
        function isVisible(el) {
          if (!el) return false;
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.display !== "none" &&
            style.visibility !== "hidden"
          );
        }

        const candidates = Array.from(
          document.querySelectorAll("button, input[type='submit'], input[type='button'], [role='button']")
        ).filter(isVisible);

        const target = candidates.find((el) => {
          const text = `${el.textContent || ""} ${el.value || ""} ${el.getAttribute("aria-label") || ""}`
            .toLowerCase()
            .trim();
          return text.includes("search") || text.includes("find") || text.includes("submit") || text.includes("खोज");
        });

        if (!target) {
          return false;
        }

        target.click();
        return true;
      });

      if (clicked) return true;
    } catch {
      // Try next frame.
    }
  }

  return false;
}

async function collectInputHints(page) {
  const frames = getFramesForSearch(page);
  const hints = [];

  for (const frame of frames) {
    try {
      const frameHints = await frame.evaluate(() => {
        function isVisible(el) {
          if (!el) return false;
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.display !== "none" &&
            style.visibility !== "hidden"
          );
        }

        return Array.from(document.querySelectorAll("input, textarea"))
          .filter(isVisible)
          .slice(0, 8)
          .map((el) => {
            const type = String(el.getAttribute("type") || "text");
            const id = String(el.id || "");
            const name = String(el.name || "");
            const placeholder = String(el.placeholder || "");
            return `type=${type}, id=${id}, name=${name}, placeholder=${placeholder}`;
          });
      });

      if (Array.isArray(frameHints) && frameHints.length) {
        hints.push(...frameHints);
      }
    } catch {
      // Ignore frame read failures.
    }
  }

  return hints;
}

async function verifyViaPlaywright({ nmcNumber, fullName }) {
  const enabled = String(process.env.NMC_ENABLE_BROWSER_CHECK || "")
    .trim()
    .toLowerCase() === "true";

  if (!enabled) {
    return {
      attempted: false,
      available: false,
      source: "none",
      verified: false,
      reason:
        "Browser verification fallback is disabled. Set NMC_ENABLE_BROWSER_CHECK=true or configure NMC_VERIFY_API_URL.",
    };
  }

  let chromium = null;
  try {
    ({ chromium } = require("playwright"));
  } catch {
    return {
      attempted: true,
      available: false,
      source: "playwright",
      verified: false,
      reason: "Playwright is not installed on the backend server.",
    };
  }

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const searchUrl = String(process.env.NMC_SEARCH_URL || NMC_DEFAULT_SEARCH_URL).trim();

    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 25000,
    });

    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1200);

    const nmcSelectors = [
      "input[name='symbolNo']",
      "input[id='symbol'][name='symbolNo']",
      "input[placeholder*='nmc' i]",
      "input[name*='nmc' i]",
      "input[id*='nmc' i]",
      "input[aria-label*='nmc' i]",
    ];

    const nameSelectors = [
      "input[name='name']",
      "input[id='name']",
      "input[placeholder*='full name' i]",
      "input[name*='name' i]",
      "input[id*='name' i]",
      "input[aria-label*='name' i]",
    ];

    const searchButtonSelectors = [
      "button:has-text('Search')",
      "input[type='submit']",
      "button[type='submit']",
    ];

    const filledNmc = await fillFirstInput(page, nmcSelectors, nmcNumber, [
      "nmc",
      "registration",
      "reg",
      "license",
      "licence",
      "liscence",
      "number",
      "no",
    ]);
    if (!filledNmc) {
      const hints = await collectInputHints(page);
      return {
        attempted: true,
        available: true,
        source: "playwright",
        verified: false,
        reason: hints.length
          ? `Could not locate NMC number input field on search page. Visible inputs: ${hints
              .join(" | ")
              .slice(0, 350)}`
          : "Could not locate NMC number input field on search page.",
      };
    }

    if (fullName) {
      await fillFirstInput(page, nameSelectors, fullName, ["full name", "doctor", "name"]);
    }

    const clicked = await clickSearchTrigger(page, searchButtonSelectors);

    if (!clicked) {
      await page.keyboard.press("Enter");
    }

    await page.waitForTimeout(2500);
    const bodyText = await page.locator("body").innerText();

    if (hasNoRecordText(bodyText)) {
      return {
        attempted: true,
        available: true,
        source: "playwright",
        verified: false,
        reason: "No matching NMC record was found.",
      };
    }

    const hasNmc = containsNmcInText(bodyText, nmcNumber);
    const hasName = containsNameInText(bodyText, fullName);

    if (hasNmc) {
      return {
        attempted: true,
        available: true,
        source: "playwright",
        verified: true,
        reason: hasName ? "" : "NMC number matched. Name check was skipped due text mismatch.",
      };
    }

    return {
      attempted: true,
      available: true,
      source: "playwright",
      verified: false,
      reason: "Search page did not show the provided NMC number in results.",
    };
  } catch (err) {
    return {
      attempted: true,
      available: true,
      source: "playwright",
      verified: false,
      reason: err?.message || "Playwright check failed.",
    };
  } finally {
    await browser.close();
  }
}

async function verifyNmcNumber({ nmcNumber, fullName }) {
  const apiResult = await verifyViaConfiguredApi({ nmcNumber, fullName });
  if (apiResult.attempted) {
    return apiResult;
  }

  return verifyViaPlaywright({ nmcNumber, fullName });
}

function uploadDoctorLicenseImage(req, res, next) {
  upload.single("licenseImage")(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    if (err?.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "License photo is too large. Max size is 5MB" });
      return;
    }

    res.status(400).json({ error: err?.message || "Invalid license photo upload" });
  });
}

async function getDoctorLicenseStatus(req, res) {
  try {
    const user = await User.findById(req.userId).select("role");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (String(user.role || "") !== "doctor") {
      return res.status(403).json({ error: "Only doctor role can access license status" });
    }

    const doctor = await Doctor.findOne({ user: req.userId }).select(
      "liscenceImage isNmcVerified licenseVerificationStatus extractedNmcNumber verificationConfidence verificationSource verificationFailureReason verificationLastCheckedAt verifiedAt"
    );
    const verificationState = getDoctorVerificationState(doctor);

    return res.status(200).json(verificationState);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

async function updateDoctorLicense(req, res) {
  try {
    const user = await User.findById(req.userId).select("role");

    if (!user) {
      safeUnlink(req.file?.path);
      return res.status(404).json({ error: "User not found" });
    }

    if (String(user.role || "") !== "doctor") {
      safeUnlink(req.file?.path);
      return res.status(403).json({ error: "Only doctor role can upload a license" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "License photo is required" });
    }

    const currentDoctor = await Doctor.findOne({ user: req.userId }).select("liscenceImage");
    const previousFileName = String(currentDoctor?.liscenceImage || "").trim();

    const updatedDoctor = await Doctor.findOneAndUpdate(
      { user: req.userId },
      {
        $set: {
          liscenceImage: req.file.filename,
          isNmcVerified: false,
          licenseVerificationStatus: VERIFICATION_STATUS.PENDING,
          extractedNmcNumber: "",
          verificationConfidence: 0,
          verificationSource: "none",
          verificationFailureReason: "",
          verificationLastCheckedAt: null,
          verifiedAt: null,
        },
        $setOnInsert: {
          user: req.userId,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    if (previousFileName && previousFileName !== req.file.filename) {
      const previousFilePath = path.join(LICENSE_UPLOAD_DIR, previousFileName);
      safeUnlink(previousFilePath);
    }

    const verificationState = getDoctorVerificationState(updatedDoctor);

    return res.status(200).json({
      message: "License submitted. Run NMC verification to unlock doctor scan access.",
      ...verificationState,
    });
  } catch (err) {
    console.error(err);

    safeUnlink(req.file?.path);

    return res.status(500).json({ error: "Something went wrong" });
  }
}

async function verifyDoctorLicense(req, res) {
  try {
    const user = await User.findById(req.userId).select("role fullName");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (String(user.role || "") !== "doctor") {
      return res.status(403).json({ error: "Only doctor role can verify a license" });
    }

    const doctor = await Doctor.findOne({ user: req.userId }).select(
      "liscenceImage liscenceNumber"
    );

    const submittedFileName = String(doctor?.liscenceImage || "").trim();
    if (!submittedFileName) {
      return res.status(400).json({ error: "Upload a license photo before verification." });
    }

    const imagePath = path.join(LICENSE_UPLOAD_DIR, submittedFileName);
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        error: "License image is missing on server. Please re-upload your license.",
      });
    }

    const manualNmcNumber = normalizeNmcNumber(req.body?.manualNmcNumber);
    const manualFullName = String(req.body?.manualFullName || "").trim();
    // Do not auto-apply account name as search filter; NMC search can require both fields,
    // which causes false negatives when profile name format differs from registry name.
    const doctorFullName = manualFullName;

    if (manualNmcNumber && !isLikelyNmcNumber(manualNmcNumber)) {
      return res.status(400).json({
        error: "Manual NMC number format looks invalid. Please enter a numeric registration number.",
      });
    }

    let extractedNmcNumber = manualNmcNumber;
    let verificationConfidence = manualNmcNumber ? 0.99 : 0;
    let ocrText = "";
    let ocrError = "";

    if (!manualNmcNumber) {
      try {
        ocrText = await runLicenseOcr(imagePath);
        const parsed = parseNmcCandidatesFromText(ocrText);
        extractedNmcNumber = parsed.primaryCandidate;
        verificationConfidence = parsed.confidence;
      } catch (err) {
        ocrError = "Could not extract text from the license image.";
      }
    }

    const checkedAt = new Date();

    if (!extractedNmcNumber) {
      const update = {
        isNmcVerified: false,
        licenseVerificationStatus: VERIFICATION_STATUS.MANUAL_REVIEW,
        extractedNmcNumber: "",
        verificationConfidence,
        verificationSource: manualNmcNumber ? "manual_input" : "ocr",
        verificationFailureReason:
          ocrError ||
          "Could not detect a valid NMC number. Enter NMC number manually and retry.",
        verificationLastCheckedAt: checkedAt,
        verifiedAt: null,
      };

      const updatedDoctor = await Doctor.findOneAndUpdate(
        { user: req.userId },
        { $set: update },
        { returnDocument: "after", upsert: true }
      );

      return res.status(200).json({
        message: "Verification needs manual review. Please enter NMC number and verify again.",
        ...getDoctorVerificationState(updatedDoctor),
      });
    }

    const nmcCheck = await verifyNmcNumber({
      nmcNumber: extractedNmcNumber,
      fullName: doctorFullName,
    });

    let verificationStatus = VERIFICATION_STATUS.MANUAL_REVIEW;
    let failureReason = String(nmcCheck?.reason || "").trim();

    if (nmcCheck.verified) {
      verificationStatus = VERIFICATION_STATUS.VERIFIED;
      failureReason = "";
    } else if (nmcCheck.attempted && nmcCheck.available) {
      verificationStatus = VERIFICATION_STATUS.FAILED;
      if (!failureReason) {
        failureReason = "NMC verification did not find a matching doctor record.";
      }
    } else {
      verificationStatus = VERIFICATION_STATUS.MANUAL_REVIEW;
      if (!failureReason) {
        failureReason =
          "Automated NMC verification is unavailable. Please configure NMC API or browser fallback.";
      }
    }

    const updateDoc = {
      isNmcVerified: verificationStatus === VERIFICATION_STATUS.VERIFIED,
      licenseVerificationStatus: verificationStatus,
      extractedNmcNumber,
      verificationConfidence,
      verificationSource:
        nmcCheck?.source && nmcCheck.source !== "none"
          ? nmcCheck.source
          : manualNmcNumber
          ? "manual_input"
          : "ocr",
      verificationFailureReason: failureReason,
      verificationLastCheckedAt: checkedAt,
      verifiedAt: verificationStatus === VERIFICATION_STATUS.VERIFIED ? checkedAt : null,
    };

    if (/^\d+$/.test(extractedNmcNumber)) {
      updateDoc.liscenceNumber = Number(extractedNmcNumber);
    }

    const updatedDoctor = await Doctor.findOneAndUpdate(
      { user: req.userId },
      { $set: updateDoc, $setOnInsert: { user: req.userId } },
      { returnDocument: "after", upsert: true }
    );

    const verificationState = getDoctorVerificationState(updatedDoctor);

    const message =
      verificationStatus === VERIFICATION_STATUS.VERIFIED
        ? "NMC verification successful. Doctor account is now verified."
        : verificationStatus === VERIFICATION_STATUS.FAILED
        ? "NMC verification failed. Please re-check your license image or NMC number."
        : "Verification could not be completed automatically. Manual review is required.";

    return res.status(200).json({
      message,
      ...verificationState,
      ocrExtractedTextPreview: ocrText ? ocrText.slice(0, 220) : "",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

async function deleteDoctorLicense(req, res) {
  try {
    const user = await User.findById(req.userId).select("role");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (String(user.role || "") !== "doctor") {
      return res.status(403).json({ error: "Only doctor role can delete a license" });
    }

    const currentDoctor = await Doctor.findOne({ user: req.userId }).select("liscenceImage");
    const previousFileName = String(currentDoctor?.liscenceImage || "").trim();

    if (previousFileName) {
      const previousFilePath = path.join(LICENSE_UPLOAD_DIR, previousFileName);
      safeUnlink(previousFilePath);
    }

    const updatedDoctor = await Doctor.findOneAndUpdate(
      { user: req.userId },
      {
        $set: {
          liscenceImage: "",
          isNmcVerified: false,
          licenseVerificationStatus: VERIFICATION_STATUS.NOT_SUBMITTED,
          extractedNmcNumber: "",
          verificationConfidence: 0,
          verificationSource: "none",
          verificationFailureReason: "",
          verificationLastCheckedAt: null,
          verifiedAt: null,
        },
      },
      {
        returnDocument: "after",
      }
    );

    const verificationState = getDoctorVerificationState(updatedDoctor);

    return res.status(200).json({
      message: "License removed successfully. Please upload a new valid license to verify again.",
      ...verificationState,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

module.exports = {
  uploadDoctorLicenseImage,
  getDoctorLicenseStatus,
  updateDoctorLicense,
  verifyDoctorLicense,
  deleteDoctorLicense,
};