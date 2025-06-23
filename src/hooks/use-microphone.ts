import { useState, useRef, useCallback } from "react";

export type MicrophoneError = {
  type:
    | "not-supported"
    | "permission-denied"
    | "not-found"
    | "not-readable"
    | "overconstrained"
    | "unknown";
  message: string;
  canRetry: boolean;
};

export function useMicrophone() {
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(false);

  const checkMicrophoneAvailability = useCallback(async (): Promise<{
    isAvailable: boolean;
    error?: MicrophoneError;
  }> => {
    // Check if browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        isAvailable: false,
        error: {
          type: "not-supported",
          message:
            "Your browser does not support microphone access. Please update your browser or try a different one.",
          canRetry: false,
        },
      };
    }

    // Check permissions if Permissions API is available
    if ("permissions" in navigator) {
      try {
        setIsCheckingPermissions(true);
        const permissionStatus = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });

        if (permissionStatus.state === "denied") {
          return {
            isAvailable: false,
            error: {
              type: "permission-denied",
              message:
                "Microphone access has been denied. Please enable microphone permissions in your browser settings and refresh the page.",
              canRetry: true,
            },
          };
        }
      } catch (error) {
        // Permissions API might not support 'microphone' query in some browsers
        // Continue with getUserMedia test
        console.warn(
          "Permissions API check failed, falling back to getUserMedia test:",
          error
        );
      } finally {
        setIsCheckingPermissions(false);
      }
    }

    // Test actual access with a temporary stream
    try {
      const testStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      testStream.getTracks().forEach((track) => track.stop()); // Clean up immediately
      return { isAvailable: true };
    } catch (error) {
      const domError = error as DOMException;

      switch (domError.name) {
        case "NotAllowedError":
        case "PermissionDeniedError":
          return {
            isAvailable: false,
            error: {
              type: "permission-denied",
              message:
                'Microphone access was denied. Please click "Allow" when prompted or enable microphone permissions in your browser settings.',
              canRetry: true,
            },
          };
        case "NotFoundError":
        case "DevicesNotFoundError":
          return {
            isAvailable: false,
            error: {
              type: "not-found",
              message:
                "No microphone found. Please connect a microphone and try again.",
              canRetry: true,
            },
          };
        case "NotReadableError":
        case "TrackStartError":
          return {
            isAvailable: false,
            error: {
              type: "not-readable",
              message:
                "Microphone is already in use by another application. Please close other applications using the microphone and try again.",
              canRetry: true,
            },
          };
        case "OverconstrainedError":
        case "ConstraintNotSatisfiedError":
          return {
            isAvailable: false,
            error: {
              type: "overconstrained",
              message:
                "Microphone does not meet the required constraints. Please try with a different microphone.",
              canRetry: true,
            },
          };
        default:
          return {
            isAvailable: false,
            error: {
              type: "unknown",
              message: `Failed to access microphone: ${domError.message || "Unknown error"}. Please check your microphone settings and try again.`,
              canRetry: true,
            },
          };
      }
    }
  }, []);

  const startMicrophone = async (): Promise<MediaStream> => {
    // Check availability first
    const { isAvailable, error } = await checkMicrophoneAvailability();

    if (!isAvailable && error) {
      throw new Error(error.message);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStreamRef.current = stream;
      return stream;
    } catch (error) {
      // Re-throw with user-friendly message
      const domError = error as DOMException;
      switch (domError.name) {
        case "NotAllowedError":
        case "PermissionDeniedError":
          throw new Error(
            "Microphone access was denied. Please enable microphone permissions and try again."
          );
        case "NotFoundError":
        case "DevicesNotFoundError":
          throw new Error(
            "No microphone found. Please connect a microphone and try again."
          );
        case "NotReadableError":
        case "TrackStartError":
          throw new Error(
            "Microphone is already in use. Please close other applications using the microphone and try again."
          );
        default:
          throw new Error(
            `Failed to start microphone: ${domError.message || "Unknown error"}`
          );
      }
    }
  };

  const stopMicrophone = () => {
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach((track) => track.stop());
      microphoneStreamRef.current = null;
      setIsMuted(false); // Reset muted state when stopping
    }
  };

  const muteMicrophone = () => {
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current
        .getAudioTracks()
        .forEach((track) => (track.enabled = false));
      setIsMuted(true);
    }
  };

  const unmuteMicrophone = () => {
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current
        .getAudioTracks()
        .forEach((track) => (track.enabled = true));
      setIsMuted(false);
    }
  };

  return {
    startMicrophone,
    stopMicrophone,
    muteMicrophone,
    unmuteMicrophone,
    checkMicrophoneAvailability,
    isMuted,
    isCheckingPermissions,
    microphoneStream: microphoneStreamRef.current,
  };
}
