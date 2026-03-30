import { useState, useEffect, useRef } from "react";

const AccidentAlertModal = ({
  accidentDetected,
  alertSent,
  cancelAlert,
  sendAlert,
}) => {
  // 1. Initial state is always 10. 
  // Because we will use a 'key' in the parent, this resets naturally.
  const [countdown, setCountdown] = useState(10);
  const intervalRef = useRef(null);

  // Inject pulse animation once
  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = `
      @keyframes pulse {
        0%   { transform: scale(1); opacity: 0.8; }
        100% { transform: scale(2.2); opacity: 0; }
      }
    `;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);



  // Countdown interval
  useEffect(() => {
    if (!accidentDetected || alertSent) return;

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          sendAlert();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [accidentDetected, alertSent, sendAlert]);

  if (!accidentDetected) return null;

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  // Use a fallback to avoid division by zero if needed, 
  // though here countdown starts at 10.
  const offset = circumference * (countdown / 10);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.pulseWrapper}>
          <div style={styles.pulseRing} />
          <div style={styles.pulseCore}>🚨</div>
        </div>

        <h1 style={styles.title}>Accident Detected!</h1>
        <p style={styles.subtitle}>
          Are you okay? Emergency alert will be sent automatically.
        </p>

        {!alertSent && (
          <div style={styles.countdownWrapper}>
            <svg width="120" height="120" style={styles.svg}>
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#ffffff30"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#ff4444"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div style={styles.countdownNumber}>{countdown}</div>
          </div>
        )}

        {alertSent && (
          <div style={styles.alertSentBox}>
            <p style={styles.alertSentText}>📧 Emergency alert sent!</p>
            <p style={styles.alertSentSub}>Help is on the way.</p>
          </div>
        )}

        {!alertSent && (
          <button style={styles.cancelButton} onClick={cancelAlert}>
            I'm Okay — Cancel Alert
          </button>
        )}
      </div>
    </div>
  );
};

// ... styles object remains the same ...
const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  modal: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "24px",
    padding: "40px 32px",
    borderRadius: "24px",
    backgroundColor: "#1a1a1a",
    border: "2px solid #ff4444",
    maxWidth: "360px",
    width: "90%",
    boxShadow: "0 0 60px #ff444455",
  },
  pulseWrapper: {
    position: "relative",
    width: "80px",
    height: "80px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "#ff444433",
    animation: "pulse 1.5s ease-out infinite",
  },
  pulseCore: {
    fontSize: "36px",
    zIndex: 1,
  },
  title: {
    color: "#ff4444",
    fontSize: "24px",
    fontWeight: "700",
    margin: 0,
  },
  subtitle: {
    color: "#aaaaaa",
    fontSize: "14px",
    textAlign: "center",
  },
  countdownWrapper: {
    position: "relative",
    width: "120px",
    height: "120px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  countdownNumber: {
    fontSize: "42px",
    fontWeight: "800",
    color: "#ffffff",
  },
  cancelButton: {
    backgroundColor: "#ffffff",
    color: "#000",
    border: "none",
    borderRadius: "12px",
    padding: "14px 28px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    width: "100%",
  },
  alertSentBox: {
    textAlign: "center",
  },
  alertSentText: {
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: "600",
  },
  alertSentSub: {
    color: "#aaaaaa",
    fontSize: "14px",
    marginTop: "8px",
  },
};

export default AccidentAlertModal;