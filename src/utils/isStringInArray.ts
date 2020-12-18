const isStringInArray = (array: string[], element: string): boolean => {
  return array.some(stringElement => stringElement === element)
}

export default isStringInArray