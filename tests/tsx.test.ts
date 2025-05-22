import { compile } from '../src/index'; // Assuming your compilation function is here
import { lines } from './utils';

describe('tsx', () => {
  //---------------------------------------------------------------
  it('should transpile TSX', () => {
    const muCode = `<p>Hello Mu!</p>`;

    const transpiledJs = compile(muCode);

    // Expected output using React's new JSX transform (_jsx function)
    expect(transpiledJs).toContain(lines(
      `mu.elt("p", null, "Hello Mu!");`
    ));
  });

  //---------------------------------------------------------------
  it('should transpile "func" returning JSX to Flow with JSX runtime', () => {
    const muCode = `
      func MyComponent() {
          return <p>Hello Mu!</p>;
      }
    `;
    const transpiledJs = compile(muCode);

    // Expected output using React's new JSX transform (_jsx function)
    expect(transpiledJs).toContain(lines(
      `/* MU_FUNC */ function MyComponent() {`,
      `    return mu.elt("p", null, "Hello Mu!");`,
      `}`));
  });

  //---------------------------------------------------------------
  it('should transpile JSX Fragments', () => {
    const muCode = `
      func MyFragmentComponent(): JSX.Element {
          return <><span>Part 1</span> <span>Part 2</span></>;
      }
    `;
    const transpiledJs = compile(muCode);

    expect(transpiledJs).toContain(lines(
      `/* MU_FUNC */ function MyFragmentComponent(): JSX.Element {`,
      `    return mu.fragment(mu.elt("span", null, "Part 1"), mu.elt("span", null, "Part 2"));`,
      `}`
    ));
  });
});
