"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = compile;
// src/compiler/compile.ts
const typescript_1 = __importDefault(require("typescript"));
const muTransformer_1 = require("./muTransformer"); // Assuming muTransformer is in a separate file
/**
 * Compiles Mu code into JavaScript.
 * This version performs a semantic transformation for 'func' (pure, Flow-returning)
 * and 'proc' (async, implicit await) keywords.
 * @param code The Mu source code string.
 * @returns The transpiled JavaScript code string.
 */
function compile(code) {
    const preprocessedCode = code
        .replace(/^(\s*)func\s+(\w+)\s*(\([^)]*\))\s*(:\s*[\w<>\[\]]+\s*)?\{/gm, '$1/* MU_FUNC */ function $2 $3 $4 {')
        .replace(/^(\s*)proc\s+(\w+)\s*(\([^)]*\))\s*(:\s*[\w<>\[\]]+\s*)?\{/gm, '$1/* MU_PROC */ function $2 $3 $4 {');
    // Create a dummy file path for the TypeScript program
    const fileName = 'temp.ts';
    const compilerOptions = {
        target: typescript_1.default.ScriptTarget.ESNext,
        module: typescript_1.default.ModuleKind.CommonJS,
        // Ensure `lib` is included for global types like `Date`, `console`, `fetch` etc.
        lib: ["lib.esnext.d.ts", "lib.dom.d.ts"]
    };
    // Create a custom compiler host to provide the source file content
    const compilerHost = typescript_1.default.createCompilerHost(compilerOptions);
    const originalGetSourceFile = compilerHost.getSourceFile; // Store original for other files if needed
    compilerHost.getSourceFile = (name, languageVersion) => {
        if (name === fileName) {
            // Provide our preprocessed code as the source file
            return typescript_1.default.createSourceFile(name, preprocessedCode, languageVersion, true);
        }
        // Fallback to original host for other files (e.g., lib.d.ts)
        return originalGetSourceFile(name, languageVersion);
    };
    // Create a TypeScript Program to get access to the TypeChecker
    const program = typescript_1.default.createProgram([fileName], compilerOptions, compilerHost);
    // Get the source file from the program
    const sourceFile = program.getSourceFile(fileName);
    if (!sourceFile) {
        throw new Error("Failed to create source file for compilation.");
    }
    const diagnostics = [];
    // Initial check for disallowed 'function' keyword
    function checkForDisallowedFunction(node) {
        if (typescript_1.default.isFunctionDeclaration(node)) {
            const leadingComments = typescript_1.default.getLeadingCommentRanges(sourceFile.getFullText(), node.pos);
            const isMuFuncOrProc = leadingComments?.some(comment => sourceFile.text.substring(comment.pos, comment.end).includes('MU_FUNC') ||
                sourceFile.text.substring(comment.pos, comment.end).includes('MU_PROC'));
            if (!isMuFuncOrProc) {
                diagnostics.push({
                    file: sourceFile,
                    start: node.getStart(),
                    length: node.getWidth(),
                    category: typescript_1.default.DiagnosticCategory.Error,
                    code: 1001,
                    messageText: "The 'function' keyword is not allowed. Use 'func' or 'proc' instead."
                });
            }
        }
        typescript_1.default.forEachChild(node, checkForDisallowedFunction);
    }
    checkForDisallowedFunction(sourceFile);
    if (diagnostics.length > 0) {
        // No need for `as any` here, `DiagnosticWithLocation` has `messageText`
        throw new Error(diagnostics[0].messageText);
    }
    // Get the TypeChecker instance from the program
    const typeChecker = program.getTypeChecker();
    // Step 3: Apply custom AST transformations
    // The context for the transformer is created implicitly by ts.transform
    const transformationResult = typescript_1.default.transform(sourceFile, [(0, muTransformer_1.muTransformer)(typeChecker, { factory: typescript_1.default.factory, ...program.getCompilerOptions() })], compilerOptions // Pass compiler options to ts.transform
    );
    const transformedSourceFile = transformationResult.transformed[0];
    const printer = typescript_1.default.createPrinter({
        newLine: typescript_1.default.NewLineKind.LineFeed,
        removeComments: false
    });
    const result = printer.printFile(transformedSourceFile);
    transformationResult.dispose();
    return result;
}
