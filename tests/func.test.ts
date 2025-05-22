import { compile } from '../src/index'; // Assuming your compilation function is here
import { lines } from './utils';

describe('Func', () => {
  //---------------------------------------------------------------
  it('should transpile "func" to return a Flow (e.g., Observable) in JS', () => {
    const muCode = `
      func multiplyByTwo(x: number): number {
          return x * 2;
      }
    `;
    const transpiledJs = compile(muCode);
    expect(transpiledJs).toContain(lines(
      `import { from } from "rxjs";`,
      `/* MU_FUNC */ function multiplyByTwo(x: number): number {`,
      `    return from([x * 2]);`,
      `}`
    ));
  });

  //---------------------------------------------------------------
  it('should transpile complex "func" return expressions to Flow', () => {
    const muCode = `
      func processNumbers(a: number, b: number): number {
          const sum = a + b;
          const result = sum * 2;
          return result - 5;
      }
    `;
    const transpiledJs = compile(muCode);
    expect(transpiledJs).toContain(lines(
      `import { from } from "rxjs";`,
      `/* MU_FUNC */ function processNumbers(a: number, b: number): number {`,
      `    const sum = a + b;`,
      `    const result = sum * 2;`,
      `    return from([result - 5]);`, // Ensure the final expression is wrapped
      `}`
    ));
  });

});

