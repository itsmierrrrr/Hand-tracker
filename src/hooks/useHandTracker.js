import { useEffect, useState } from "react";
import { createHandDetector } from "../services/handDetector";

export default function useHandTracker() {
  const [detector, setDetector] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadModel() {
      try {
        const model = await createHandDetector();
        if (isMounted) {
          setDetector(model);
          setIsLoading(false);
          console.log("✅ Hand Detector Model Loaded Successfully");
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          setIsLoading(false);
          console.error("❌ Failed to load Hand Detector Model:", err);
        }
      }
    }

    loadModel();

    return () => {
      isMounted = false;
    };
  }, []);

  return { detector, isLoading, error };
}