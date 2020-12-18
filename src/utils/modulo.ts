const modulo = (dividend: number, divisor: number): number => {
  return ((dividend % divisor) + divisor) % divisor
}

export default modulo