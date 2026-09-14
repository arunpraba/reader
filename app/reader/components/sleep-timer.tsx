"use client";

import { usePlayback } from "../../playback/playback-context";

const OPTIONS = [0, 15, 30, 45, 60];

function formatRemaining(ms: number) {
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function SleepTimer() {
  const { sleepMinutes, sleepRemainingMs, setSleepMinutes } = usePlayback();

  return (
    <div className="settings-section sleep-timer">
      <h3>Sleep timer</h3>
      <p>Listening stops when the timer ends. Your place is kept.</p>
      <label>
        <span>Stop after</span>
        <select
          value={sleepMinutes}
          onChange={(event) => setSleepMinutes(Number(event.target.value))}
        >
          {OPTIONS.map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes === 0 ? "Off" : `${minutes} minutes`}
            </option>
          ))}
        </select>
      </label>
      {sleepRemainingMs != null ? (
        <small>Stops in {formatRemaining(sleepRemainingMs)}</small>
      ) : null}
    </div>
  );
}
