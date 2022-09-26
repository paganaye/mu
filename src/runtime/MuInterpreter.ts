import { Tokenizer } from '../parser/Tokenizer';
import { Token } from '../parser/Tokens';
import { MuError, MuEvalError, MuParserError, MuTokenizerError, parseDatetimeOrNull } from "../parser/Utils";
import { Interpreter } from './Interpreter';

export const muGlobals = {

    Mu(): string {
        return `Mu v1.0.0`;
    },
    dateTime: (str: number | string | any = null) => parseDatetimeOrNull(str) || new Date(),
    range: function* fn(startOrStop: number, stop?: number, step = 1) {
        let start;
        [start, stop] = (stop === undefined) ? [0, startOrStop] : [startOrStop, stop];
        if (step > 0) while (start < stop) yield start, start += step;
        else if (step < 0) while (start > stop) yield start, start += step;
        else throw new RangeError('range() step argument invalid');
    },
    print: (...args: any[]) => {
        console.log(...args); return args.length > 0 ? args[0] : null;
    },
    isNull: (v: any, defValue: any = null): boolean | any => defValue === null ? v === null : v || defValue,
    isDate: (d: any): boolean => d instanceof Date,
    isFunction: (v: any): boolean => typeof v === "function",
    isString: (v: any): boolean => typeof v === "string",
    deleteProperty: (obj: any, propName: string): boolean => delete obj[propName],
    Math,
    Object,
    Array,
    JSON,
    printExecutionContext: () => { }, // will be overriden at runtime
    getExecutionContext: () => { },// will be overriden at runtime
    MuError,
    MuTokenizerError,
    MuParserError,
    MuEvalError,
    Error,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError,
    URIError
};

export class MuInterpreter extends Interpreter {
    constructor() {
        super(muGlobals);
    }


}

export function Mu(): MuInterpreter {
    return new MuInterpreter();
}
let spaces = " ".repeat(100)
function pad(s: string, length: number): string {
    let l = s.length;
    if (l < length) s = s + spaces.substring(0, length - l);
    return s;
}
function trim(s: string, length: number): string {
    s = s.trim();
    let l = s.length;
    if (l < length) s = s + spaces.substring(0, length - l);
    if (l > length) s = s.substring(0, length - 3) + "...";
    return s;
}
function padLeft(s: string, length: number): string {
    let l = s.length;
    if (l < length) s = spaces.substring(0, length - l) + s;
    return s;
}

export function formatToken(t: Token): string {
    return "Line" + padLeft(t.startLine.toString(), 5)
        + "  Column" + padLeft(t.startColumn.toString(), 5)
        + "  " + pad(t.tokenType, 12)
        + " " + trim((t.literalValue || t.operatorSymbol || t.identifier || t.comment || "").toString(), 40);
}

export const getAllTokens = Tokenizer.getAllTokens