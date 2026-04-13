import { useEffect, useState, useImperativeHandle, forwardRef } from "react";

const Timer = forwardRef(({ initialSeconds = 900 }, ref) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useImperativeHandle(ref, () => ({
    getTimeLeft: () => secondsLeft,
  }));

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <span className="timer-inline">
      {minutes}:{seconds}
    </span>
  );
});

Timer.displayName = "Timer";

export default Timer;
