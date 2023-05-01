package com.ganaye.mu.parsing.script

enum class OperatorType {
    Prefix, Postfix, Binary, Lambda, Ternary, N_Ary, Func, Other,
}

enum class Operator(
    val chars: String?,
    val type: OperatorType,
    val priority: Int = -1,
    val uCalc: ((Any?) -> Any?)? = null,
    val bCalc: ((Any?, Any?) -> Any?)? = null,
    val nCalc: ((List<Any?>) -> Any?)? = null,
    val assign: Boolean = false
) {
    // @formatter:off
    // https://www.w3schools.com/js/js_precedence.asp
    open_parenthesis    ("(",          OperatorType.Other,  18                                ), //  (          Expression Grouping (100 + 50) * 3
    close_parenthesis   (")",          OperatorType.Other,  0                                 ), //  )
    dot                 (".",          OperatorType.Binary, 17                                ), //  .          Member Of person.name
    square_bracket      ("[",          OperatorType.Other,  17                                ), //  []         Member Of person["name"]
    close_square_bracket("]",          OperatorType.Other,  17                                 ), //  )
    optional_chaining   ("?.",         OperatorType.Other,  17                                ), //  ?.         Optional Chaining ES2020 x ?. y
    function_call       (null,         OperatorType.Func,   17                                ), //  ()         Function Call myFunction()
    new_with_args       ("new",        OperatorType.Other,  17                                ), //  new        new with Arguments new Date("June 5,2022")
    new_without_args    (null,         OperatorType.Other,  16                                ), //  new        without Arguments new Date()
    postfix_inc         ("++",         OperatorType.Postfix,15, assign = true                 ), //  ++         Postfix Increment i++
    postfix_dec         ("--",         OperatorType.Postfix,15, assign = true                 ), //  --         Postfix Decrement i--
    prefix_dec          ("++",         OperatorType.Prefix, 14, assign = true                 ), //  ++         Prefix Increment ++i
    prefix_inc          ("--",         OperatorType.Prefix, 14, assign = true                 ), //  --         Prefix Decrement --i
    logical_not         ("!",          OperatorType.Prefix, 14                                ), //  !          Logical NOT !(x==y)
    bitwize_not         ("~",          OperatorType.Prefix, 14                                ), //  ~          Bitwise NOT ~x
    unary_plus          ("+",          OperatorType.Prefix, 14                                ), //  +          Unary Plus +x
    unary_minus         ("-",          OperatorType.Prefix, 14                                ), //  -          Unary Minus -x
    typeof_op           ("typeof",     OperatorType.Other,  14                                ), //  typeof     Data Type typeof x
    void_op             ("void",       OperatorType.Other,  14                                ), //  void       Evaluate Void void(0)
    delete_op           ("delete",     OperatorType.Other,  14                                ), //  delete     Property Delete delete myCar.color
    exp                 ("**",         OperatorType.Binary, 13, bCalc = OpMethods.exp         ), //  **         Exponentiation ES2016 10 ** 2
    mul                 ("*",          OperatorType.Binary, 12, bCalc = OpMethods.mul         ), //  *          Multiplication 10 * 5
    div                 ("/",          OperatorType.Binary, 12, bCalc = OpMethods.div         ), //  /          Division 10 / 5
    modulo              ("%",          OperatorType.Binary, 12, bCalc = OpMethods.mod         ), //  %          Division Remainder 10 % 5
    sub                 ("-",          OperatorType.Binary, 11, bCalc = OpMethods.sub         ), //  -          Subtraction 10 - 5
    plus                ("+",          OperatorType.Binary, 11, bCalc = OpMethods.plusOrConcat), //  +          Addition 10 + 5
    shl                 ("<<",         OperatorType.Binary, 10, bCalc = OpMethods.shl         ), //  <<         Shift Left x << 2
    shr                 (">>",         OperatorType.Binary, 10, bCalc = OpMethods.shr         ), //  >>         Shift Right (signed) x >> 2
    ushr                (">>>",        OperatorType.Binary, 10, bCalc = OpMethods.ushr        ), //  >>>         Shift Right (unsigned) x >>> 2
    in_op               ("in",         OperatorType.Binary, 9,  bCalc = OpMethods.isIn        ), //  in         Property in Object "PI" in Math
    instanceof_op       ("instanceof", OperatorType.Binary, 9,  bCalc = OpMethods.isInstanceOf), //  instanceof Instance of Object x instanceof Array
    lt                  ("<",          OperatorType.Binary, 9                                 ), //  <          Less than x < y
    le                  ("<=",         OperatorType.Binary, 9                                 ), //  <=         Less than or equal x <= y
    gt                  (">",          OperatorType.Binary, 9                                 ), //  >          Greater than x > y
    ge                  (">=",         OperatorType.Binary, 9                                 ), //  >=         Greater than or equal x >= Array
    equalequal          ("==",         OperatorType.Binary, 8                                 ), //  ==         Equal x == y
    equalequalequal     ("===",        OperatorType.Binary, 8                                 ), //  ===        Strict equal x === y
    notequal            ("!=",         OperatorType.Binary, 8                                 ), //  !=         Unequal x != y
    notequalequal       ("!==",        OperatorType.Binary, 8                                 ), //  !==        Strict unequal x !== y
    bitwise_and         ("&",          OperatorType.Binary, 7                                 ), //  &          Bitwise AND x & y
    bitwise_xor         ("^",          OperatorType.Binary, 6                                 ), //  ^          Bitwise XOR x ^ y
    bitwize_or          ("|",          OperatorType.Binary, 5                                 ), //  |          Bitwise OR x | y
    logical_and         ("&&",         OperatorType.Binary, 4                                 ), //  &&         Logical AND x && y
    logical_or          ("||",         OperatorType.Binary, 3                                 ), //  ||         Logical OR x || y
    null_coalescing     ("??",         OperatorType.Binary, 3                                 ), //  ??         Nullish Coalescing ES2020 x ?? y
    ternary_cond        ("?",          OperatorType.Ternary,2                                 ), //  ? :        Conditional (ternary) Condition ? "yes" : "no"
    simple_assign       ("=",          OperatorType.Binary, 2, assign = true                  ), //  =          Simple Assignment x = y
    colon_assign        (":",          OperatorType.Binary, 2, assign = true                  ), //  :          Colon Assignment x: 5
    plus_assign         ("+=",         OperatorType.Binary, 2, assign = true                  ), //  +=         Addition Assignment x += y
    minus_assign        ("-=",         OperatorType.Binary, 2, assign = true                  ), //  -=         Subtraction Assignment x -= y
    multiply_assign     ("*=",         OperatorType.Binary, 2, assign = true                  ), //  *=         Multiplication Assignment x *= y
    exponent_assign     ("**=",        OperatorType.Binary, 2, assign = true                  ), //  **=        Exponentiation Assignment x **= y
    divide_assign       ("/=",         OperatorType.Binary, 2, assign = true                  ), //  /=         Division Assignment x /= y
    modulo_assign       ("%=",         OperatorType.Binary, 2, assign = true                  ), //  %=         Remainder Assignment x %= y
    shl_assign          ("<<=",        OperatorType.Binary, 2, assign = true                  ), //  <<=        Left Shift Assignment x <<= y
    shr_assign          (">>=",        OperatorType.Binary, 2, assign = true                  ), //  >>=        Right Shift Assignment x >>= y
    ushr_assign         (">>>=",       OperatorType.Binary, 2, assign = true                  ), //  >>>=       Unsigned Right Shift x >>>= y
    bitwise_and_assign  ("&=",         OperatorType.Binary, 2, assign = true                  ), //  &=         Bitwise AND Assignment x &= y
    bitwise_or_assign   ("|=",         OperatorType.Binary, 2, assign = true                  ), //  |=         Bitwise OR Assignment x |= y
    bitwise_xor_assign  ("^=",         OperatorType.Binary, 2, assign = true                  ), //  ^=         Bitwise XOR Assignment x ^= y
    logical_and_assign  ("&&=",        OperatorType.Binary, 2, assign = true                  ), //  &&=        Logical AND Assignment x &= y
    logical_or_assign   ("||=",        OperatorType.Binary, 2, assign = true                  ), //  ||=        Logical OR Assignment x ||= y
    lambda              ("=>",         OperatorType.Lambda, 2                                 ), //  =>         Arrow x => y
    yield_op            ("yield",      OperatorType.Other,  2                                 ), //  yield      Pause / Resume yield x
    yield_star          ("yield*",     OperatorType.Other,  2                                 ), //  yield*     Delegate yield* x
    spread_op           ("...",        OperatorType.Other,  2                                 ), //  ...        Spread ... x
    comma               (",",          OperatorType.N_Ary,  2, nCalc = { a -> a[a.size-1] }   ), //  ,          Comma x , y
    semi_colon          (";",          OperatorType.Other,  1                                 ), //  ;          see (*1)
    open_curly_brackets ("{",          OperatorType.Other,  1                                 ), //  {
    close_curly_brackets("}",          OperatorType.Other,  1                                 ), //  }
    end_script_tag      (null,         OperatorType.Other,  1                                 ); // </script>
    // @formatter:on       
    /*
    *1 : Comma has more
         If you run for(let i=0;i<2;i++)  console.log("a"),console.log("b");console.log("c")
         it outputs: a b a b c
         We can see that the for block runs the first 2 logs but not the third.
         So comma has more priority than semicolons
    * */

    fun calcUnaryConst(constA: Any?): Any? {
        if (uCalc != null) {
            return uCalc.invoke(constA)
        } else {
            throw InternalError("Operator ${this} has no binary const calculation defined")
        }

    }

    fun calcBinaryConst(constA: Any?, constB: Any?): Any? {
        if (bCalc != null) {
            return bCalc.invoke(constA, constB)
        } else {
            throw InternalError("Operator ${this} has no binary const calculation defined")
        }
    }

    fun calcNAryConst(args: List<Any?>): Any? {
        if (nCalc != null) {
            return nCalc.invoke(args)
        } else {
            throw InternalError("Operator ${this} has no N-ary const calculation defined")
        }
    }

    companion object {
        val unaryPrefixOperators: Map<String, Operator>
        val operators: Map<String, Operator>
        val priorityZero = 0
        val priorityMax = 19

        init {
            val unaryPrefixOperators = mutableMapOf<String, Operator>()
            val operators = mutableMapOf<String, Operator>()
            values().forEach { op -> // safe
                val key = op.chars
                if (key != null) {
                    val collection = when (op.type) {
                        OperatorType.Prefix -> unaryPrefixOperators
                        else -> operators
                    }
                    if (collection.containsKey(key)) {
                        throw Exception("Operator $key ${op.type} is declared twice")
                    }
                    collection[key] = op
                }
            }
            this.unaryPrefixOperators = unaryPrefixOperators.toMap()
            this.operators = operators.toMap()
        }
    }
}

object OpMethods {
    val isIn: (a: Any?, b: Any?) -> Any = { a, b ->
        throw NotImplementedError()
    }

    val isInstanceOf: (a: Any?, b: Any?) -> Any = { a, b ->
        throw NotImplementedError()
    }

    val plusOrConcat: (a: Any?, b: Any?) -> Any? = { a, b ->
        if (a is Double && b is Double) (a + b)
        else (if (a == null) "null" else (a.toString() + (if (b == null) "null" else b.toString())))
    }

    // @formatter:off
    val exp : (a: Any?, b:Any?) -> Any? = { a, b -> if (a is Double && b is Double) Math.pow(a, b) else Double.NaN }
    val mul : (a: Any?, b:Any?) -> Any? = { a, b -> if (a is Double && b is Double) a * b else Double.NaN }
    val div : (a: Any?, b:Any?) -> Any? = { a, b -> if (a is Double && b is Double) a / b else Double.NaN }
    val mod : (a: Any?, b:Any?) -> Any? = { a, b -> if (a is Double && b is Double) a % b else Double.NaN }
    val sub : (a: Any?, b:Any?) -> Any? = { a, b -> if (a is Double && b is Double) a - b else Double.NaN }
    val shl : (a: Any?, b:Any?) -> Any? = { a, b -> if (a is Double && b is Double) (a.toInt() shl b.toInt()).toDouble() else Double.NaN }
    val shr : (a: Any?, b:Any?) -> Any? = { a, b -> if (a is Double && b is Double) (a.toInt() shr b.toInt()).toDouble() else Double.NaN }
    val ushr: (a: Any?, b:Any?) -> Any? = { a, b -> if (a is Double && b is Double) (a.toInt() ushr b.toInt()).toDouble() else Double.NaN }
    // @formatter:on

}
