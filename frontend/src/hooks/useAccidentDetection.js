import { useState, useEffect, useRef, useCallback } from "react";

const FREEFALL_THRESHOLD = 2.5;
const IMPACT_THRESHOLD = 22.0;
const FREEFALL_WINDOW_MS = 2500;
const INACTIVITY_TIMEOUT_MS = 9000;
const CANCEL_WINDOW_MS = 10000;
const POST_IMPACT_DEBOUNCE_MS = 2000;
const MOVEMENT_CANCEL_THRESHOLD = 13.0;

const resolvePostAlertRedirectPath = () => {
  try {
    const rawPatient = localStorage.getItem("patient");
    const parsedPatient = rawPatient ? JSON.parse(rawPatient) : null;
    const role = String(parsedPatient?.role || "patient").toLowerCase();

    if (role === "doctor") return "/doctor/dashboard";
    return "/user/dashboard?page=home";
  } catch {
    return "/user/dashboard?page=home";
  }
};

const useAccidentDetection = (isAuth) => {
  const [accidentDetected, setAccidentDetected] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [location, setLocation] = useState({ latitude: null, longitude: null });

  const freefallDetected = useRef(false);
  const freefallTimestamp = useRef(0);
  const impactDetected = useRef(false);
  const postImpactTimestamp = useRef(null);
  const inactivityTimerRef = useRef(null);
  const cancelTimerRef = useRef(null);
  const alertSentRef = useRef(false);
  const accidentDetectedRef = useRef(false);

  // Sync ref with state
  useEffect(() => {
    accidentDetectedRef.current = accidentDetected;
  }, [accidentDetected]);

  // Logic: Send Alert
  const sendEmergencyAlert = useCallback(async () => {
    if (alertSentRef.current) {
      console.log("⚠️ Alert already sent — ignoring duplicate");
      return;
    }

    console.log("📍 Getting location...");

    const sendEmailRequest = async (latitude = null, longitude = null) => {
      try {
        const response = await fetch("/api/auth/emergency/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ latitude, longitude }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.error || "Failed to send emergency alert");
        }

        console.log("✅ Emergency alert sent successfully!", data);
        return true;
      } catch (error) {
        console.log("❌ Failed to send emergency alert:", error.message);
        return false;
      }
    };

    const markSuccessAndRedirect = () => {
      alertSentRef.current = true;
      setAlertSent(true);

      const target = resolvePostAlertRedirectPath();
      setTimeout(() => {
        window.location.assign(target);
      }, 1200);
    };

    const markFailure = () => {
      alertSentRef.current = false;
      setAlertSent(false);
    };

    const attemptWithoutLocation = async () => {
      const sent = await sendEmailRequest();
      if (sent) markSuccessAndRedirect();
      else markFailure();
    };

    if (!navigator.geolocation || typeof navigator.geolocation.getCurrentPosition !== "function") {
      await attemptWithoutLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        console.log(`📍 Location found: ${latitude}, ${longitude}`);
        console.log("📧 Sending emergency email...");

        const sent = await sendEmailRequest(latitude, longitude);
        if (sent) markSuccessAndRedirect();
        else markFailure();
      },
      async (error) => {
        console.log("❌ Location access denied:", error.message);
        await attemptWithoutLocation();
      },
      { timeout: 7000, maximumAge: 10000, enableHighAccuracy: true }
    );
  }, []);

  // Logic: Handle Motion
  const handleMotion = useCallback((event) => {
    const { x, y, z } = event.accelerationIncludingGravity;
    if (x === null) return;
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    const now = Date.now();

    if (magnitude < FREEFALL_THRESHOLD && !impactDetected.current) {
      freefallDetected.current = true;
      freefallTimestamp.current = now;
      console.log("🪂 Freefall detected");
    } else if (
      freefallDetected.current &&
      magnitude > IMPACT_THRESHOLD &&
      now - freefallTimestamp.current < FREEFALL_WINDOW_MS
    ) {
      freefallDetected.current = false;
      impactDetected.current = true;
      postImpactTimestamp.current = now;
      console.log("💥 Impact detected! Starting inactivity timer...");

      inactivityTimerRef.current = setTimeout(() => {
        console.log("⚠️ Inactivity timeout! Accident confirmed!");
        accidentDetectedRef.current = true;
        setAccidentDetected(true);
      }, INACTIVITY_TIMEOUT_MS);
    } else if (
      freefallDetected.current &&
      now - freefallTimestamp.current > FREEFALL_WINDOW_MS
    ) {
      freefallDetected.current = false;
      console.log("✅ Freefall expired — no impact detected, resetting");
    } else if (
      impactDetected.current &&
      !accidentDetectedRef.current &&
      postImpactTimestamp.current &&
      now - postImpactTimestamp.current > POST_IMPACT_DEBOUNCE_MS &&
      magnitude > MOVEMENT_CANCEL_THRESHOLD
    ) {
      console.log("🏃 Movement detected after impact — false alarm, resetting!");
      clearTimeout(inactivityTimerRef.current);
      impactDetected.current = false;
      freefallDetected.current = false;
    }
  }, []); // no dependencies — uses only refs

  // Logic: Start Monitoring
  const startMonitoring = useCallback(async () => {
    if (typeof DeviceMotionEvent === "undefined") {
      console.log("❌ DeviceMotionEvent is not supported");
      return;
    }
    if (typeof DeviceMotionEvent.requestPermission === "function") {
      const permission = await DeviceMotionEvent.requestPermission();
      if (permission !== "granted") {
        console.log("❌ Permission denied");
        return;
      }
    }
    window.addEventListener("devicemotion", handleMotion);
    console.log("✅ Monitoring started — watching for accidents...");
  }, [handleMotion]);

  // Logic: Cancel Alert
  const cancelAlert = useCallback(() => {
    console.log("✅ Alert cancelled — monitoring continues...");
    clearTimeout(cancelTimerRef.current);
    clearTimeout(inactivityTimerRef.current);
    impactDetected.current = false;
    freefallDetected.current = false;
    alertSentRef.current = false;
    accidentDetectedRef.current = false;
    setAccidentDetected(false);
    setAlertSent(false);
    // No need to re-add listener — it was never removed
  }, []);

  // Effect: Cancel Window Timer
  useEffect(() => {
    if (!accidentDetected) return;
    console.log("🚨 Accident confirmed! You have 10 seconds to cancel...");

    cancelTimerRef.current = setTimeout(() => {
      console.log("⏰ Cancel window expired — sending emergency alert!");
      sendEmergencyAlert();
    }, CANCEL_WINDOW_MS);

    return () => clearTimeout(cancelTimerRef.current);
  }, [accidentDetected, sendEmergencyAlert]);

  // Effect: Auto-start on Auth
  useEffect(() => {
    if (isAuth) {
      startMonitoring();
    } else {
      window.removeEventListener("devicemotion", handleMotion);
      console.log("🛑 Monitoring stopped");
    }
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [isAuth, startMonitoring, handleMotion]);

  return { accidentDetected, alertSent, location, cancelAlert, sendEmergencyAlert };
};

export default useAccidentDetection;