// src/compiler/utils.ts
import ts, { JsxTagNameExpression, JsxAttributes, NodeArray, JsxChild, Visitor, TransformationContext } from 'typescript';

export function isMuFunc(node: ts.Node) {
    const sourceFile = node.getSourceFile();
    if (!sourceFile) return false; // Safety check
    const leadingComments = ts.getLeadingCommentRanges(sourceFile.getFullText(), node.pos);
    return leadingComments?.some(comment =>
        sourceFile.text.substring(comment.pos, comment.end).includes('MU_FUNC')
    );
}

export function isMuProc(node: ts.Node) {
    const sourceFile = node.getSourceFile();
    if (!sourceFile) return false; // Safety check
    const leadingComments = ts.getLeadingCommentRanges(sourceFile.getFullText(), node.pos);
    return leadingComments?.some(comment =>
        sourceFile.text.substring(comment.pos, comment.end).includes('MU_PROC')
    );
}


export function createMuEltCall(
    factory: ts.NodeFactory,
    tagName: JsxTagNameExpression | ts.Identifier | ts.PropertyAccessExpression,
    attributes: JsxAttributes | null,
    children: NodeArray<JsxChild> | undefined, // children can be undefined for self-closing elements
    currentVisitor: Visitor,
    currentContext: TransformationContext
): ts.CallExpression {
    const childrenExpressions: ts.Expression[] = [];
    if (children) {
        children.forEach(child => {
            const transformedChild = ts.visitNode(child, currentVisitor); // Recursively visit children

            if (transformedChild) {
                // JsxText nodes become StringLiteral, JsxExpressions become their inner expression
                if (ts.isStringLiteral(transformedChild) || ts.isExpression(transformedChild)) {
                    childrenExpressions.push(transformedChild);
                }
            }
        });
    }

    // --- NEW LOGIC FOR FRAGMENTS ---
    // Check if the tagName is our special Fragment identifier (mu.Fragment)
    // This check is important because ts.isJsxFragment() is handled in the visitor,
    // and it calls createMuEltCall with `mu.Fragment` as tagName.
    if (ts.isPropertyAccessExpression(tagName) &&
        ts.isIdentifier(tagName.expression) && tagName.expression.text === "mu" &&
        tagName.name.text === "Fragment") {
        // If it's a fragment, return a call to `mu.fragment` with children as arguments
        return factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier("mu"), factory.createIdentifier("fragment")),
            undefined, // Type arguments
            childrenExpressions // Children are passed directly as arguments
        );
    }

    // --- Existing logic for regular elements ---
    let tagExpression: ts.Expression;
    if (ts.isIdentifier(tagName)) {
        // If it's a component (e.g., <MyComponent/>), pass the identifier directly
        // Otherwise, if it's a standard HTML tag (e.g., <p>), pass its name as a string literal
        if (tagName.text.charAt(0) === tagName.text.charAt(0).toUpperCase()) { // Heuristic for component names
            tagExpression = tagName; // Pass identifier for components
        } else {
            tagExpression = factory.createStringLiteral(tagName.text); // Pass string literal for HTML tags
        }
    } else if (ts.isPropertyAccessExpression(tagName)) {
        tagExpression = tagName; // e.g., MyComponent.SubComponent
    } else {
        // Fallback for other complex tag names (e.g., namespace tags like <svg:path>)
        tagExpression = factory.createStringLiteral(tagName.getText());
    }

    const props: ts.PropertyAssignment[] = [];
    const spreadProps: ts.SpreadAssignment[] = [];

    if (attributes) {
        attributes.properties.forEach(prop => {
            if (ts.isJsxAttribute(prop)) {
                const name = prop.name.getText();
                let initializer: ts.Expression | undefined;
                if (prop.initializer) {
                    if (ts.isStringLiteral(prop.initializer)) {
                        initializer = prop.initializer;
                    } else if (ts.isJsxExpression(prop.initializer) && prop.initializer.expression) {
                        initializer = ts.visitNode(prop.initializer.expression, currentVisitor) as ts.Expression;
                    }
                }
                if (initializer) {
                    props.push(factory.createPropertyAssignment(name, initializer));
                }
            } else if (ts.isJsxSpreadAttribute(prop)) {
                const spreadExpression = ts.visitNode(prop.expression, currentVisitor) as ts.Expression;
                spreadProps.push(factory.createSpreadAssignment(spreadExpression));
            }
        });
    }

    let propsObject: ts.Expression;
    if (spreadProps.length > 0 || props.length > 0) {
        const properties: (ts.PropertyAssignment | ts.SpreadAssignment)[] = [...props, ...spreadProps];
        propsObject = factory.createObjectLiteralExpression(properties, true);
    } else {
        propsObject = factory.createNull();
    }

    return factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier("mu"), factory.createIdentifier("elt")),
        undefined, // Type arguments
        [tagExpression, propsObject, ...childrenExpressions]
    );
}

export function throwIfDiagnosticsNotEmpty(functionDiagnostics: ts.DiagnosticWithLocation[]) {
    if (!functionDiagnostics || functionDiagnostics.length == 0) return;
    let first = functionDiagnostics[0];
    throw new Error(typeof first.messageText === 'string' ? first.messageText : first.messageText.messageText);
}
