function countdownTo2026() {
  const now = new Date();
  const targetDate = new Date('2026-01-01T00:00:00');

  const diff = targetDate.getTime() - now.getTime(); // Difference in milliseconds

  let days = Math.floor(diff / (1000 * 60 * 60 * 24));
  let hours = Math.floor(diff / (1000 * 60 * 60)); // Integrate days into hours
  let minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  let seconds = Math.floor((diff % (1000 * 60)) / 1000);

  // Ensure two digits for display
  days = String(days).padStart(3, '0'); // Days can be more than 99, so 3 digits
  hours = String(hours).padStart(2, '0');
  minutes = String(minutes).padStart(2, '0');
  seconds = String(seconds).padStart(2, '0');

  const daysElement = document.getElementById('days');
  const hoursElement = document.getElementById('hours');
  const minutesElement = document.getElementById('minutes');
  const secondsElement = document.getElementById('seconds');

  if (daysElement) {
    daysElement.textContent = days;
  }
  if (hoursElement) {
    hoursElement.textContent = hours;
  }
  if (minutesElement) {
    minutesElement.textContent = minutes;
  }
  if (secondsElement) {
    secondsElement.textContent = seconds;
  }
  document.getElementById('countdown-display').textContent = `${hours}:${minutes}:${seconds}`;

  if (diff <= 0) {
    document.getElementById('countdown-message').textContent = "2026年おめでとうございます";
    clearInterval(countdownInterval);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const countdownInterval = setInterval(countdownTo2026, 1000);
  countdownTo2026(); // Initial call to display immediately
});
