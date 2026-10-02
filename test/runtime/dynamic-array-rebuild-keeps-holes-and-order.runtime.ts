// Reading a boxed Array as a typed one rebuilds it element by element
// (`unboxDynamicArray`). The rebuild appends in order and keeps holes as holes:
// a dense source gives a dense array, a sparse one keeps its gaps.
//! expect: 3 3 3
//! expect: 3 1 5
//! expect: 0 0

const dense: any = JSON.parse('[1, 2, 3]')
const sparse: any[] = []
sparse[2] = 5
const empty: any = JSON.parse('[]')

function viewAsNumbers(value: any): string {
  const numbers = value as number[]
  return numbers.length + ' ' + Object.keys(numbers).length + ' ' + numbers[numbers.length - 1]
}

console.log(viewAsNumbers(dense))
console.log(viewAsNumbers(sparse))
console.log((empty as number[]).length, Object.keys(empty as number[]).length)
