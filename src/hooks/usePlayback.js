import { useCallback, useEffect, useRef, useState } from "react";

export function usePlayback({ length = 0, initialSpeed = 400, onFinish }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);

  const rafRef = useRef(null);
  const lastTickRef = useRef(0);
  const speedRef = useRef(speed);
  const lengthRef = useRef(length);
  const indexRef = useRef(0);
  const onFinishRef = useRef(onFinish);

  speedRef.current = speed;
  lengthRef.current = length;
  onFinishRef.current = onFinish;

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (indexRef.current > Math.max(0, length - 1)) {
      indexRef.current = Math.max(0, length - 1);
      setIndex(indexRef.current);
    }
  }, [length]);

  const loop = useCallback(
    (now) => {
      if (indexRef.current >= lengthRef.current - 1) {
        stopLoop();
        setPlaying(false);
        if (onFinishRef.current) onFinishRef.current();
        return;
      }
      if (now - lastTickRef.current >= speedRef.current) {
        lastTickRef.current = now;
        indexRef.current += 1;
        setIndex(indexRef.current);
      }
      rafRef.current = requestAnimationFrame(loop);
    },
    [stopLoop]
  );

  const pause = useCallback(() => {
    stopLoop();
    setPlaying(false);
  }, [stopLoop]);

  const play = useCallback(() => {
    if (lengthRef.current === 0) return;
    if (indexRef.current >= lengthRef.current - 1) {
      indexRef.current = 0;
      setIndex(0);
    }
    setPlaying(true);
    lastTickRef.current = performance.now();
    stopLoop();
    rafRef.current = requestAnimationFrame(loop);
  }, [loop, stopLoop]);

  const goTo = useCallback(
    (n) => {
      pause();
      const clamped = Math.max(0, Math.min(Math.max(0, lengthRef.current - 1), n));
      indexRef.current = clamped;
      setIndex(clamped);
    },
    [pause]
  );

  const next = useCallback(() => goTo(indexRef.current + 1), [goTo]);
  const prev = useCallback(() => goTo(indexRef.current - 1), [goTo]);
  const reset = useCallback(() => goTo(0), [goTo]);

  const jumpToEnd = useCallback(() => goTo(lengthRef.current - 1), [goTo]);

  useEffect(() => stopLoop, [stopLoop]);

  return { index, setStep: goTo, playing, play, pause, toggle: playing ? pause : play, next, prev, reset, goToEnd: jumpToEnd, speed, setSpeed };
}
