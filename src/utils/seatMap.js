export const generateSeatLabels = (totalSeats = 40) => {
  const seats = [];
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const seatCount = Number(totalSeats) || 40;

  for (let i = 0; i < seatCount; i++) {
    const rowIndex = Math.floor(i / 4);
    const rowLabel = letters[rowIndex] || `R${rowIndex + 1}`;
    const seatNumber = (i % 4) + 1;

    seats.push(`${rowLabel}${seatNumber}`);
  }

  return seats;
};