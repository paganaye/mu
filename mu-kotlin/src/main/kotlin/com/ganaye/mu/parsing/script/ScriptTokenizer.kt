package com.ganaye.mu.parsing.script

import com.ganaye.mu.parsing.FileReader
import com.ganaye.mu.parsing.FileReader.Companion.EOF_CHAR
import com.ganaye.mu.parsing.IToken
import com.ganaye.mu.parsing.ITokenizer
import com.ganaye.mu.parsing.TokenPos

sealed class ScriptToken : IToken {
    open val operator: Operator? = null // this is a shortcut as it is used all over the place
    open val identifier: String? = null

    class Identifier(override val pos: TokenPos, override val identifier: String) : ScriptToken() {
        override fun toString() = identifier
    }

    class StringLiteral(override val pos: TokenPos, val value: String) : ScriptToken() {
        override fun toString() = JSON.stringify(value)
    }


    class Eof(override val pos: TokenPos) : ScriptToken() {
        override fun toString() = "<EOF>"
    }

    class OpToken(override val pos: TokenPos, override val operator: Operator) : ScriptToken() {

        override fun toString() = this.operator.toString()

    }

    class Number(override val pos: TokenPos, val value: Double) : ScriptToken() {
        override fun toString() = JSON.stringify(value)
    }

    class InvalidToken(override val pos: TokenPos, val value: String, val message: String) : ScriptToken() {
        override fun toString() = "InvalidToken ${value} ${message} "
    }
}

class ScriptTokenizer(val fileReader: FileReader) : ITokenizer<ScriptToken> {
    override fun nextToken(): ScriptToken {
        while (fileReader.curChar != EOF_CHAR) {
            if (fileReader.curChar == ' ' || fileReader.curChar == '\n' || fileReader.curChar == '\r' || fileReader.curChar == '\t') {
                // ignore white spaces
            } else if ((fileReader.curChar >= 'a' && fileReader.curChar <= 'z')
                || (fileReader.curChar >= 'A' && fileReader.curChar <= 'Z')
                || fileReader.curChar == '_'
                || fileReader.curChar == '$'
            ) {
                return parseIdentifier()
            } else if (fileReader.curChar >= '0' && fileReader.curChar <= '9') {
                return parseNumber()
            } else if (fileReader.curChar == '"' || fileReader.curChar == '\'') {
                return parseQuotedString()
            } else if (fileReader.curChar == '/' && fileReader.peekNextChar() == '*') {
                skipComment()
            } else if (fileReader.curChar == '/' && fileReader.peekNextChar() == '/') {
                skipSingleLineComment()
            } else {
                // everything else must be some sort of operator
                return parseOperator()
            }
            fileReader.nextChar()
        }
        return ScriptToken.Eof(fileReader.tokenPosFrom(fileReader.getPos()))
    }

    fun parseIdentifier(): ScriptToken {
        val start = fileReader.getPos()
        val identifier = StringBuilder()
        do {
            identifier.append(fileReader.curChar)
            fileReader.nextChar()
        } while ((fileReader.curChar >= 'a' && fileReader.curChar <= 'z')
            || (fileReader.curChar >= 'A' && fileReader.curChar <= 'Z')
            || (fileReader.curChar >= '0' && fileReader.curChar <= '9')
            || fileReader.curChar == '_' || fileReader.curChar == '$'
        )
        return ScriptToken.Identifier(fileReader.tokenPosFrom(start), identifier.toString())
    }

    fun parseNumber(): ScriptToken {
        val start = fileReader.getPos()
        val number = StringBuilder()
        do {
            number.append(fileReader.curChar)
            fileReader.nextChar()
        } while (fileReader.curChar >= '0' && fileReader.curChar <= '9')
        if (fileReader.curChar == '.') {
            val nextChar = fileReader.peekNextChar()
            if (nextChar >= '0' && nextChar <= '9') {
                do {
                    number.append(fileReader.curChar)
                    fileReader.nextChar()
                } while (fileReader.curChar >= '0' && fileReader.curChar <= '9')
            }
        }
        if (fileReader.curChar == 'e' || fileReader.curChar == 'E') {
            number.append(fileReader.curChar)
            fileReader.nextChar()
            if (fileReader.curChar == '+' || fileReader.curChar == '-') {
                number.append(fileReader.curChar)
                fileReader.nextChar()
            }
            while (fileReader.curChar >= '0' && fileReader.curChar <= '9') {
                number.append(fileReader.curChar)
                fileReader.nextChar()
            }
        }
        val stringValue = number.toString()
        val doubleValue = stringValue.toDoubleOrNull()
        if (doubleValue == null) {
            return ScriptToken.InvalidToken(fileReader.tokenPosFrom(start), stringValue, "This is not a valid number")
        }
        return ScriptToken.Number(fileReader.tokenPosFrom(start), doubleValue)
    }

    fun parseOperator(): ScriptToken {
        val start = fileReader.getPos()
        val currentOperator = StringBuilder()
        currentOperator.append(fileReader.curChar)
        fileReader.nextChar()
        var operator = Operator.operators.getOrDefault(currentOperator.toString(), null)
        if (operator == null) {
            return ScriptToken.InvalidToken(
                fileReader.tokenPosFrom(start),
                currentOperator.toString(),
                "Invalid operator"
            )
        }
        while (true) {
            currentOperator.append(fileReader.curChar)
            val nextOperator = Operator.operators.getOrDefault(currentOperator.toString(), null)
            if (nextOperator == null) break
            else {
                operator = nextOperator
                fileReader.nextChar()
            }
        }
        return ScriptToken.OpToken(fileReader.tokenPosFrom(start), operator!!)
    }

    fun skipComment() {
        fileReader.nextChar()
        fileReader.nextChar()
        while (fileReader.curChar != EOF_CHAR) {
            if (fileReader.curChar == '*' && fileReader.peekNextChar() == '/') {
                fileReader.nextChar()
                fileReader.nextChar()
                break;
            }
            fileReader.nextChar();
        }
    }

    fun skipSingleLineComment() {
        fileReader.nextChar()
        fileReader.nextChar()
        while (fileReader.curChar != EOF_CHAR) {
            if (fileReader.curChar == '\r' || fileReader.curChar == '\n') {
                break;
            }
            fileReader.nextChar();
        }
    }

    fun parseQuotedString(): ScriptToken {
        val start = fileReader.getPos()
        val quote = fileReader.curChar
        fileReader.nextChar()
        val content = java.lang.StringBuilder()
        while (fileReader.curChar != EOF_CHAR) {
            when (fileReader.curChar) {
                quote -> {
                    fileReader.nextChar()
                    return ScriptToken.StringLiteral(fileReader.tokenPosFrom(start), content.toString())
                }

                else -> {
                    content.append(fileReader.curChar)
                    fileReader.nextChar()
                }
            }
        }
        return ScriptToken.StringLiteral(fileReader.tokenPosFrom(start), content.toString())
    }

}
