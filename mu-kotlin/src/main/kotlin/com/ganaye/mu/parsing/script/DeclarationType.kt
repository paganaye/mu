package com.ganaye.mu.parsing.script

/*
sealed class ScriptToken : IToken {
    class Identifier(override val pos: TokenPos, val identifier: String) : ScriptToken()
    class StringLiteral(override val pos: TokenPos, val value: String) : ScriptToken()
    class Eof(override val pos: TokenPos) : ScriptToken()
    class Operator(override val pos: TokenPos, val operator: ScriptOperator) : ScriptToken()
    class Number(override val pos: TokenPos, val value: Double) : ScriptToken()
    class InvalidToken(override val pos: TokenPos, val value: String, val message: String) : ScriptToken()
}
* */
enum class DeclarationType(val keyword: String?) {
    Const("const"),
    Let("let"),
    Var("var"),
    NoDeclaration(null)
}