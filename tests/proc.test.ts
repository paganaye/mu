import { compile } from '../src/index'; // Assuming your compilation function is here
import { lines } from './utils';

describe('Proc', () => {
  //---------------------------------------------------------------
  it('should transpile "proc" to be an async function in JS with implicit await', () => {
    const muCode = `
      proc fetchData(url: string): string { 
          const response = fetch(url);
          const data = response.json();
          return data.message;
      }
    `;
    const transpiledJs = compile(muCode);
    expect(transpiledJs).toContain(lines(
      '/* MU_PROC */ async function fetchData(url: string): string {',
      '    const response = await fetch(url);',
      '    const data = await response.json();',
      '    return data.message;',
      '}'));
  });

// Proc > should transpile "proc" to be an async function in JS with implicit await
// -----
// Error: expect(received).toContain(expected) // indexOf

// Expected substring: "/* MU_PROC */ async function fetchData(url: string): string {
//     const response = await fetch(url);
//     const data = await response.json();
//     return data.message;
// }"
// Received string:    "/* MU_PROC */ async function fetchData(url: string): string {
//     const response = await fetch(url);
//     const data = response.json();
//     return data.message;
// }


  //---------------------------------------------------------------
  it('should apply implicit await to expression statements in "proc"', () => {
    const muCode = `
      proc doSomethingThenLog(): void {
          doSomethingAsync(); // This should be awaited
          console.log("Done");
      }
    `;
    const transpiledJs = compile(muCode);
    expect(transpiledJs).toContain(lines(
      '/* MU_PROC */ async function doSomethingThenLog(): void {',
      '    doSomethingAsync(); // This should be awaited',
      '    console.log("Done");',
      '}'
    ));
  });


});

