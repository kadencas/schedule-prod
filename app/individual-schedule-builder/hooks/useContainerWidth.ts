import { useState, useEffect, useRef } from "react";

export function useContainerWidth() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();

    window.addEventListener("resize", updateWidth);
    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  return { containerRef, width };
}
