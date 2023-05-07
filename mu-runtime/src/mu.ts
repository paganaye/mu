export type ExprOrValue<T> = T | Expr<T>;

export type EltData = string | number | boolean | null | undefined | Error | MuNode | void;
export type EltChildren = (ExprOrValue<EltData> | undefined | void)[]

export type Attribute = string | number | boolean | null | undefined | ExprOrValue<Attribute>[] | { [key: string]: ExprOrValue<Attribute> } | Error | Function;
export type Attributes = Record<string, ExprOrValue<Attribute>> | null | undefined;

// more advanced type used to infer Func arguments
type ExprType<T> = T extends Expr<infer T> ? T : never
type ExprTypes<T> = { [K in keyof T]: ExprType<T[K]> };


export class Expr<T> {
    #value: T | undefined;
    #valueMightHaveChanged: boolean;
    #listeners?: Expr<T>[];
    #deepListeners?: Expr<T>[];
    #variableName: string;
    #parentExpr?: Expr<any>;
    static #variableNameCounters = new Map<string, number>()

    isConst = false;

    constructor(variableName?: string, parentExpr?: Expr<any>, initialValue?: any) {
        if (!variableName) {
            variableName = this.constructor.name;
            let counter = (Expr.#variableNameCounters.get(variableName) ?? 0) + 1;
            Expr.#variableNameCounters.set(variableName, counter);
            variableName += counter;
        }
        this.#variableName = variableName;
        if (parentExpr) this.#parentExpr = parentExpr;
        if (initialValue !== undefined) {
            this.#valueMightHaveChanged = false;
            this.value = initialValue;
        } else {
            this.#valueMightHaveChanged = true;
        }
    }

    listenTo(...dependencies: ExprOrValue<any>[]) {
        dependencies.forEach(d => {
            if (d instanceof Expr) d.addListener(this, false)
        })
    }


    addListener(listener: Expr<any>, immediate: Boolean) {
        let listeners = this.#listeners || (this.#listeners = []);
        listeners.push(listener);
        if (immediate) listener.onObservedValueChange(this);
    }

    onObservedValueChange(_value: Expr<any>) {
        this.invalidateValue()
    }

    removeListener(listener: Expr<T>) {
        if (!this.#listeners) return
        let idx = this.#listeners.indexOf(listener)
        if (idx >= 0) this.#listeners?.splice(idx, 1);
    }

    addDeepListener(deepListener: Expr<T>, init = false) {
        let deepListeners = this.#deepListeners || (this.#deepListeners = []);
        deepListeners.push(deepListener);
        if (init) deepListener.onMemberChanged(this.#variableName ?? "Expr", null);
    }

    onMemberChanged(arg0: string, arg1: null) {
        //throw new Error("Method not implemented.");
    }


    protected get previousValue(): T | undefined {
        return this.#value!;
    }

    public get value(): T {
        if (this.#valueMightHaveChanged) {
            this.calcValue();
            this.#valueMightHaveChanged = false;
        }
        return this.#value!;
    }

    set value(newValue: T) {
        let originalValue = this.#value;
        this.#valueMightHaveChanged = false;
        if (newValue === originalValue) return;

        if (this.onValueChanging(newValue, originalValue)) {
            this.#value = newValue;
            if (this.#listeners) {
                this.#listeners.forEach(listener => listener.onObservedValueChange(listener));
            }
            if (this.#parentExpr) {
                this.#parentExpr.onChildValueChanged(this.#variableName, newValue)
            }
        }
    }

    calcValue(): void {
        throw Error("Internal Error calcValue not defined for " + this.constructor.name)
    }

    invalidateValue(): boolean {
        if (this.#valueMightHaveChanged) return false;
        this.#valueMightHaveChanged = true;
        this.onValueInvalidated();
        return true;
    }

    onValueInvalidated() {
        this.calcValue()
    }

    protected onValueChanging(_newValue: T, _originalValue: T | undefined): boolean {
        return true;
    }

    protected onChildValueChanged(variableName: string, newValue: any) {
        this.#deepListeners?.forEach(deepListener => deepListener.onMemberChanged(variableName, newValue), null);
        if (this.#parentExpr) {
            this.#parentExpr.onChildValueChanged(variableName, newValue)
        }
    }

}


export type MuNode = MuNodeBase<HTMLElement | Comment | Text>;

abstract class MuNodeBase<T> extends Expr<T> {
    readonly #exprListeners: Expr<any>[] = [];
    isConst = true;

    onNewExprListener(newExprListener: Expr<any>) {
        this.#exprListeners.push(newExprListener);
    }

    clear() {
        this.#exprListeners.forEach(l => {
            l.removeListener(l);
        });
        this.#exprListeners.length = 0;
    }

    static fromEltData(data: EltData): MuNode {
        if (typeof data == "object") {
            if (data == null) data = "null";
            else if (data instanceof MuNodeBase) {
                return data;
            } else if (data instanceof HTMLElement) {
                return new MuRootElt(data, undefined);
            } else if (data instanceof Error) {
                return elt("div", null,)
            }
        }
        return new MuText(data);
    }
}

class MuElt<THTMLElement extends HTMLElement> extends MuNodeBase<THTMLElement> {
    mounted = false;
    #children: MuNode[];
    protected domElt?: THTMLElement;

    constructor(readonly tag: string, readonly attributes?: Attributes, ...children: EltChildren) {
        super();
        this.#children = [];
        children.forEach((child: ExprOrValue<EltData>) => {
            let data: EltData;
            let newNode: MuNode;
            if (child instanceof MuNodeBase) {
                newNode = child;
            } else if (isConstValue(child, v => data = v)) {
                newNode = new MuText(data);
            }
            else {
                newNode = new DynamicNode(child);
            }
            this.#children.push(newNode)
        });
    }



    private applyAttributes(domElt: THTMLElement) { // attrs?: Attributes) {
        if (!this.attributes) return;
        for (let name in this.attributes) {
            let value: ExprOrValue<Attribute> = this.attributes[name];
            if (typeof value === 'object' && name === "style") {
                value = this.toCss(value as any);
                if (value) domElt.setAttribute("style", String(value))
                else domElt.removeAttribute("style")
            }
            else if (name.startsWith('on') && typeof value === "function") {
                (domElt as any)[name] = value;
            }
            else domElt.setAttribute(name, value as any);
        }
    }

    toCss(obj: object): string {
        while (obj instanceof Expr) obj = obj.value;
        let result: string[] = [];
        for (let name in obj) {
            let value: ExprOrValue<string> = (obj as any)[name];
            if (value) result.push(name + ":" + String(value));
            else result.push(name);
        }
        return result.join(";");
    }

    calcValue(): void {
        if (!this.domElt) this.domElt = document.createElement(this.tag) as THTMLElement;
        this.applyAttributes(this.domElt as any)
        this.#children.forEach(childNode => {
            let childValue = childNode.value;
            this.domElt!.append(childValue)
        });
        super.value = this.domElt;
    }

}

class MuInput extends MuElt<HTMLInputElement> {
    constructor(readonly src: Expr<string>, readonly attributes?: Attributes, ...children: EltChildren) {
        super("input", attributes, ...children)
    }

    override calcValue(): void {
        super.calcValue()
        if (this.domElt) this.domElt.value = this.src.value;
    }
}

class MuRootElt extends MuNodeBase<HTMLElement> {
    constructor(readonly rootElt: HTMLElement, readonly content?: MuNode) {
        super(rootElt.tagName);
    }

    override calcValue(): void {
        this.rootElt.innerHTML = "";
        if (this.content) {
            let contentValue = this.content.value;
            this.rootElt.append(contentValue)
        }
    }
}

class DynamicNode extends MuNodeBase<HTMLElement | Comment | Text> {

    constructor(readonly source: ExprOrValue<EltData>) {
        super();
        this.listenTo(source);
    }

    onExprChanged(listener: Expr<any>) {
        if (this.invalidateValue()) {
            console.log("DynamicNode invalidated", { this: this, listener });
        }
    }

    onValueInvalidated() {
        setTimeout(() => this.value) // we'll wait the next tick for now.
    }

    calcValue(): void {
        let sourceValue: ExprOrValue<EltData> = this.source;
        while (sourceValue instanceof Expr) sourceValue = sourceValue.value as ExprOrValue<EltData>;

        //    let value = this.source.value;
        switch (typeof sourceValue) {
            case "undefined":
            case "boolean":
            case "number":
            case "string":
                sourceValue = String(sourceValue);
                if (this.previousValue instanceof Text) this.previousValue.nodeValue = sourceValue;
                else this.value = document.createTextNode(sourceValue);
                break;
            default:
                if (sourceValue instanceof Node) {
                    if (this.previousValue) {
                        this.previousValue.parentElement?.replaceChild(sourceValue as any, this.previousValue);
                    } else {
                        this.value = sourceValue as any;
                    }
                    return;
                }
                if (sourceValue === null) sourceValue = "null";
                else sourceValue = JSON.stringify(sourceValue);
                // we're going to show some text then
                if (this.previousValue instanceof Text) this.previousValue.nodeValue = sourceValue;
                else this.value = document.createTextNode(sourceValue);
                break;
        }
    }
}

export class MuText extends MuNodeBase<Text> {
    isConst: boolean = true

    constructor(text: any) {
        super();
        this.value = document.createTextNode(String(text));
    }

    calcValue(): void { }
}

export class MuComment extends MuNodeBase<Comment> {
    isConst: boolean = true

    constructor(text: string) {
        super();
        this.value = document.createComment(text);
    }
}

function isConstValue<T>(source: T | ExprOrValue<T>, action: (constValue: T) => void): boolean {
    for (let i = 0; i < 25; i++) {
        if (source instanceof Expr) {
            if (source.isConst) source = source.value;
            else return false;
        } else if (source instanceof Promise) {
            return false;
        } else if (typeof source === 'function') {
            console.error("I don't think we use this. Do we?");
            source = (source as any)()
        } else {
            // otherwise we are constant
            action(source);
            return true;
        }
    }
    return false;
}


interface RepeatOptions {
    containerTag: string;
    containerAttrs?: Attributes;
}

const defaultRepeatOptions: RepeatOptions = {
    containerTag: "div",
}

export function iif(cond: Expr<boolean>, thenValue: Expr<number>, elseValue: Expr<number>): Expr<number> {
    let res = new Func([cond, thenValue, elseValue], (c, t, f) => c ? t : f)
    return res;
}

export function each<T>(items: T[],
    content: (item: T, idx: number) => MuElt<any> | void,
    repeatOptions: RepeatOptions = defaultRepeatOptions): MuElt<any> {
    let array = items.map((item, idx) => {
        let result = content(item, idx);
        return result ?? new MuComment("each-#" + idx);
    });
    return elt(repeatOptions.containerTag, null, ...array);
}

export function repeat(count: number,
    content: (idx: number) => MuElt<any> | void,
    repeatOptions: RepeatOptions = defaultRepeatOptions): MuElt<any> {
    let array = Array.from({ length: count }, (_, idx) => {
        let result = content(idx);
        return result ?? new MuComment("repeat-#" + idx);
    });
    return elt(repeatOptions.containerTag, null, ...array);
}

export class Var<T> extends Expr<T> {
    static objectVars = new WeakMap<object, Var<object>>()

    static get<T>(initialValue: any, createNew: () => Var<T>): Var<T> {
        let res: Var<T> | undefined;
        if (typeof initialValue === 'object' && initialValue != null) {
            res = Var.objectVars.get(initialValue) as Var<T> | undefined;
            if (!res) {
                res = createNew()
                Var.objectVars.set(initialValue, res as any);
            }
        } else {
            res = createNew()
        }
        return res
    }

    public constructor(readonly initialValue: T, variableName?: string, parent?: Var<any>) {
        super(variableName, parent, initialValue);
        if (isObjectOrArray(initialValue)) {
            Var.objectVars.set(initialValue as object, this as Var<object>);
        }
    }

    protected override onValueChanging(newValue: T, originalValue: T | undefined): boolean {
        if (isObjectOrArray(originalValue)) {
            console.log("We're modifying an object or array var")
        }
        if (isObjectOrArray(newValue)) {
            console.log("We're modifying a var to an object or array")
        }
        return super.onValueChanging(newValue, originalValue);
    }

    public getMemberVar<U>(memberName: string | number): Var<U> {
        let thisValue = this.value as any;
        if (typeof thisValue !== 'object') throw Error("Cannot get member of " + typeof thisValue);
        let memberValue = thisValue[memberName];
        let memberNameString = typeof memberName === "number" ? `[${memberName}]` : memberName;
        let result: Var<U>
        if (memberValue === undefined) memberValue = null;
        if (this instanceof Var<U>) {
            result = Var.get(memberValue, () => new MemberVar(this as any, memberNameString, memberValue)) as Var<U>
        } else throw Error("Cannot get variable members from something that is not a Var");
        return result;
    }

}

class MemberVar<T> extends Var<T> {
    // member variables need to change the r
    public constructor(parent: Var<any>, readonly variableName: string, readonly initialValue: T) {
        super(initialValue, variableName, parent);
    }

    protected override onValueChanging(newValue: T, originalValue: T | undefined): boolean {
        //TODO this.#parentExpr.value[this.variableName] = newValue;
        return super.onValueChanging(newValue, originalValue);

    }
}

export class Func<TExprs extends Expr<unknown>[], TResult> extends Expr<TResult> {

    constructor(readonly args: [...TExprs], readonly lambda: (...args: ExprTypes<TExprs>) => TResult) {
        super(undefined, undefined, undefined);

        this.listenTo(...args);
    }

    override calcValue(): void {
        let argsValues = this.args.map(m => m.value);
        super.value = this.lambda(...(argsValues as any));
    }
}

export function mount(app: MuNode, recipient?: HTMLElement | string) {
    let recipientHtmlElement: HTMLElement | null;
    if (typeof recipient === 'string') {
        recipientHtmlElement = document.getElementById(recipient);
        if (recipientHtmlElement == null) {
            console.error("Error in mount command. There is no element with id '" + recipient + "'");
        }
    } else recipientHtmlElement = document.body;
    if (recipientHtmlElement) {
        let rootElt = new MuRootElt(recipientHtmlElement, app);
        setTimeout(() => rootElt.value);
    }

}

interface CompiledCss {
    content: string;
    styleElt: HTMLStyleElement;
}

let globalCss: Record<string, CompiledCss> = {};


export function css(selectors: string | string[], attr: Attribute) {
    function applyCss(selector: string, attr: any) {
        let newContent = String(attr);
        let current = globalCss[selector];
        if (newContent) {
            if (!current) {
                current = {
                    content: newContent,
                    styleElt: document.createElement("style")
                }
                document.head.appendChild(current.styleElt);
                globalCss[selector] = current;
            }
            current.styleElt.innerHTML = selector + " {\n  " + newContent + "\n}";
        } else if (current) {
            current.styleElt.remove();
            delete globalCss[selector];
        }
    }
    let selector: string = Array.isArray(selectors) ? selectors.join(', ') : selectors;
    while (attr instanceof Expr) attr = attr.value;
    applyCss(selector, attr)
}


function isObjectOrArray(o: any) {
    return typeof o === 'object' && o !== null;
}

export function booleanInput(variable: Var<boolean>, attrs?: Attributes): MuInput {
    let inputElt = new MuInput(new Func([variable], (a) => String(a)), { ...attrs, type: "checkbox" });
    let domElt = inputElt.value;
    domElt.oninput = () => {
        variable.value = domElt.checked;
    }
    return inputElt;
}

export function elt(tag: string, attributes: Attributes, ...children: EltChildren) {
    return new MuElt<HTMLElement>(tag, attributes, ...children);
}

export function div(attributes: Attributes, ...children: EltChildren) {
    return new MuElt<HTMLDivElement>("div", attributes, ...children);
}

export function p(attributes: Attributes, ...children: EltChildren) {
    return new MuElt<HTMLDivElement>("p", attributes, ...children);
}

