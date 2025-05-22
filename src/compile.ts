// src/compiler/compile.ts
import ts from 'typescript';
import { MuTransformer } from './muTransformer'; // Assuming muTransformer is in a separate file

/**
 * Compiles Mu code into JavaScript.
 * This version performs a semantic transformation for 'func' (pure, Flow-returning)
 * and 'proc' (async, implicit await) keywords.
 * @param code The Mu source code string.
 * @returns The transpiled JavaScript code string.
 */
export function compile(code: string): string {
  const preprocessedCode = code
    .replace(/^(\s*)func\s+(\w+)\s*(\([^)]*\))\s*(:\s*[\w.<>\[\]]+\s*)?\{/gm, '$1/* MU_FUNC */ function $2 $3 $4 {')
    .replace(/^(\s*)proc\s+(\w+)\s*(\([^)]*\))\s*(:\s*[\w.<>\[\]]+\s*)?\{/gm, '$1/* MU_PROC */ function $2 $3 $4 {');

  const fileName = 'temp.ts';
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.CommonJS,
    lib: ["lib.esnext.d.ts", "lib.dom.d.ts"]
  };

  const compilerHost = ts.createCompilerHost(compilerOptions);
  const originalGetSourceFile = compilerHost.getSourceFile;
  compilerHost.getSourceFile = (name, languageVersion) => {
    if (name === fileName) {
      return ts.createSourceFile(name, preprocessedCode, languageVersion, true, ts.ScriptKind.TSX);
    }
    return originalGetSourceFile(name, languageVersion);
  };

  const program = ts.createProgram([fileName], compilerOptions, compilerHost);
  const sourceFile = program.getSourceFile(fileName)!;

  if (!sourceFile) {
    throw new Error("Failed to create source file for compilation.");
  }

  const diagnostics: ts.DiagnosticWithLocation[] = [];

  function checkForDisallowedFunction(node: ts.Node) {
    if (ts.isFunctionDeclaration(node)) {
      const leadingComments = ts.getLeadingCommentRanges(sourceFile.getFullText(), node.pos);
      const isMuFuncOrProc = leadingComments?.some(comment =>
        sourceFile.text.substring(comment.pos, comment.end).includes('MU_FUNC') ||
        sourceFile.text.substring(comment.pos, comment.end).includes('MU_PROC')
      );

      if (!isMuFuncOrProc) {
        diagnostics.push({
          file: sourceFile,
          start: node.getStart(),
          length: node.getWidth(),
          category: ts.DiagnosticCategory.Error,
          code: 1001,
          messageText: "The 'function' keyword is not allowed. Use 'func' or 'proc' instead."
        });
      }
    }
    ts.forEachChild(node, checkForDisallowedFunction);
  }
  checkForDisallowedFunction(sourceFile);

  if (diagnostics.length > 0) {
    let diag0 = diagnostics[0];
    throw new Error(typeof diag0.messageText === 'string' ? diag0.messageText : diag0.messageText.messageText);
  }

  const typeChecker = program.getTypeChecker();

  // Step 3: Apply custom AST transformations
  // Create the transformation context object

  const transformers: ts.TransformerFactory<ts.SourceFile>[] = [];

  const transformerFactory: ts.TransformerFactory<ts.SourceFile> = (context: ts.TransformationContext) => {
    let muTransformer = new MuTransformer(typeChecker, context);
    return (f) => muTransformer.transformSourceFile(f);
  }

  transformers.push(transformerFactory);

  const transformationResult = ts.transform(
    sourceFile,
    transformers, // Pass the array of TransformerFactory
    compilerOptions
  );

  const transformedSourceFile = transformationResult.transformed[0];

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false
  });
  const result = printer.printFile(transformedSourceFile);

  transformationResult.dispose();

  return result;
}