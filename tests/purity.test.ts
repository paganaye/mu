import { compile } from '../src/index'; // Assuming your compilation function is here
import { lines } from './utils';

describe('Purity', () => {
  //---------------------------------------------------------------
  it('should reject the "function" keyword', () => {
    const code = `
      function oldStyleFunction() {
        console.log("This should not be allowed.");
      }
    `;
    expect(() => compile(code)).toThrow(/The 'function' keyword is not allowed. Use 'func' or 'proc' instead./i);
  });

  //---------------------------------------------------------------
  it('should reject impure operations within a "func" declaration', () => {
    const muCode = `
      let globalCounter = 0; // Impure state

      func incrementAndLog(x: number): number {
          globalCounter = x + 1; // Side effect: modifying global state
          console.log("Incrementing:", x); // Side effect: I/O operation
          return x + 1;
      }
    `;
    expect(() => compile(muCode)).toThrow("Impure operation (modifying non-local state 'globalCounter') not allowed in 'func' declarations.");
  });

  //---------------------------------------------------------------
  it('should reject impure operations modifying global state within a "func" declaration', () => {
    const muCode = `
      let globalCounter = 0; // A global, mutable variable in MuCode

      func incrementGlobal(value: number): number {
          globalCounter = globalCounter + value; // Impure operation: modifying global state
          return globalCounter;
      }
    `;
    expect(() => compile(muCode)).toThrow(/Impure operation \(modifying non-local state 'globalCounter'\) not allowed in 'func' declarations\./i);
  });

  //---------------------------------------------------------------
  it('should reject modification of a non-local variable within a "func"', () => {
    const muCode = `
      let count = 0; // This variable is non-local to 'increment'

      func increment(): number {
          count = count + 1; // Impure: modifying a non-local variable
          return count;
      }
    `;
    expect(() => compile(muCode)).toThrow(/Impure operation \(modifying non-local state 'count'\) not allowed in 'func' declarations\./i);
  });

  //---------------------------------------------------------------
  it('should allow pure operations within a "func" declaration', () => {
    const muCode = `
      func calculate(x: number, y: number): number {
          const temp = x * y;
          return temp + x;
      }
    `;
    expect(() => compile(muCode)).not.toThrow();
  });

  //---------------------------------------------------------------
  it('should reject calling a proc from a "func"', () => {
    const muCode = `
      proc greet(name: string) {
        console.log("hi " + name);
      }

      func isLoggedIn(name: string) {          
          greet(name);
          return true;
      }
    `;
    expect(() => compile(muCode)).toThrow("Impure operation: 'func' cannot call 'proc' as 'proc' may have side effects.");
  });
});

