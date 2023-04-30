package com.ganaye.mu.parsing.html

import com.ganaye.mu.parsing.*
import com.ganaye.mu.parsing.FileReader.Companion.EOF_CHAR
import com.ganaye.mu.parsing.script.isVariableStartingChar

sealed class HTMLToken : IToken {


    class Text(override val pos: TokenPos, val text: String) : HTMLToken() {
        override fun toString(): String = text
    }

    class Spaces(override val pos: TokenPos, val spaces: String) : HTMLToken() {
        override fun toString(): String = spaces
    }

    class StartExpr(override val pos: TokenPos) : HTMLToken() {
        override fun toString(): String = "{"
    }

    class StartTag(override val pos: TokenPos, val tagName: String) : HTMLToken() {
        override fun toString(): String = "<$tagName"
    }

    class Identifier(override val pos: TokenPos, val identifier: String) : HTMLToken() {
        override fun toString(): String = identifier
    }

    class EqualOp(override val pos: TokenPos) : HTMLToken() {
        override fun toString(): String = "="
    }


    class TagContent(override val pos: TokenPos, val empty: Boolean) : HTMLToken() {
        override fun toString(): String = if (empty) "/>" else ">"
    }

    class ClosingTag(override val pos: TokenPos, val tagName: String) : HTMLToken() {

        override fun toString(): String = "</$tagName>"
    }

    class HTMLComment(override val pos: TokenPos, val content: String) : HTMLToken() {
        override fun toString(): String = "<!-- $content -->"

    }

    class Eof(override val pos: TokenPos) : HTMLToken() {
        override fun toString(): String = "EOF"
    }

    class HTMLFragment(override val pos: TokenPos, val content: String) : HTMLToken() {
        override fun toString(): String = content
    }
}

class HTMLTokenizer(val fileReader: FileReader) : ITokenizer<HTMLToken> {
    //    class Identifier(override val pos: TokenPos, val identifier: String) : ScriptToken()
//    class String(override val pos: TokenPos, val value: String) : ScriptToken()
//    class Eof(override val pos: TokenPos) : ScriptToken()
//    class Operator(override val pos: TokenPos, val operator: ScriptOperator) : ScriptToken()
    var inTag = false

    override fun nextToken(): HTMLToken {
        if (inTag) {
            val startPos = fileReader.getPos()
            when (fileReader.curChar) {
                EOF_CHAR -> {
                    return HTMLToken.Eof(fileReader.tokenPosFrom(fileReader.getPos()))
                }

                ' ', '\t', '\n', '\r' -> {
                    return HTMLToken.Spaces(fileReader.tokenPosFrom(startPos), getSpaces())
                }

                '/' -> {
                    if (fileReader.peekChar() == '>') {
                        fileReader.nextChar(); fileReader.nextChar()
                        this.inTag = false
                        return HTMLToken.TagContent(fileReader.tokenPosFrom(startPos), true)
                    } else return parseInTagFragment(startPos)
                }

                '>' -> {
                    fileReader.nextChar()
                    this.inTag = false
                    return HTMLToken.TagContent(fileReader.tokenPosFrom(startPos), false)
                }

                '=' -> {
                    fileReader.nextChar()
                    return HTMLToken.EqualOp(fileReader.tokenPosFrom(startPos))
                }

                else -> {
                    val identifier = getIdentifier()
                    return if (identifier.length > 0) HTMLToken.Identifier(
                        fileReader.tokenPosFrom(startPos),
                        identifier
                    )
                    else parseInTagFragment(startPos)
                }
            }
        } else {
            return parseText()
        }
    }

    private fun getSpaces(): String {
        val spaces = StringBuilder()
        while (fileReader.curChar == ' ' || fileReader.curChar == '\t' || fileReader.curChar == '\n' || fileReader.curChar == '\r') {
            spaces.append(fileReader.curChar)
            fileReader.nextChar()
        }
        return spaces.toString()
    }

    private fun parseText(): HTMLToken {
        val text = StringBuilder()
        val from = fileReader.getPos()
        while (fileReader.curChar != EOF_CHAR) {
            if (fileReader.curChar == '{') {
                if (text.length > 0) return HTMLToken.Text(fileReader.tokenPosFrom(from), text.toString())
                else {
                    fileReader.nextChar();
                    return HTMLToken.StartExpr(fileReader.tokenPosFrom(from))
                }
            } else if (fileReader.curChar == '<') {
                return if (text.length > 0) HTMLToken.Text(fileReader.tokenPosFrom(from), text.toString())
                else parseElementOrPseudoElement()
            } else {
                text.append(fileReader.curChar)
                fileReader.nextChar()
            }
        }
        return if (text.length > 0) HTMLToken.Text(fileReader.tokenPosFrom(from), text.toString())
        else HTMLToken.Eof(fileReader.tokenPosFrom(fileReader.getPos()))
    }


    private fun parseComment(startPos: FilePos): HTMLToken.HTMLComment {

        if (fileReader.curChar == '-') fileReader.nextChar()
        if (fileReader.curChar == '-') fileReader.nextChar()
        val content = StringBuilder()
        var commentEnded = false
        while (fileReader.curChar != EOF_CHAR) {
            if (fileReader.curChar == '-') {
                fileReader.nextChar()
                if (fileReader.curChar == '-') {
                    fileReader.nextChar()
                    commentEnded = true
                } else {
                    content.append("-")
                }
            } else if (fileReader.curChar == '>' && commentEnded) {
                fileReader.nextChar()
                return HTMLToken.HTMLComment(fileReader.tokenPosFrom(startPos), content.toString())
            } else {
                content.append(fileReader.curChar)
            }
        }
        return HTMLToken.HTMLComment(fileReader.tokenPosFrom(startPos), content.toString())
    }

    private fun parseInTagFragment(startPos: FilePos): HTMLToken.HTMLFragment {

        val content = StringBuilder()
        while (true) {
            when (fileReader.curChar) {
                ' ', '>', EOF_CHAR -> return HTMLToken.HTMLFragment(
                    fileReader.tokenPosFrom(startPos),
                    content.toString()
                )

                else -> {
                    content.append(fileReader.curChar)
                    fileReader.nextChar()
                }
            }
        }
    }

    private fun parseElementOrPseudoElement(): HTMLToken {
        var from = fileReader.getPos()
        var isClosingTag = false
        if (fileReader.curChar !== '<') throw InternalError("Elements start with the character '<'")
        fileReader.nextChar()
        if (fileReader.curChar == '/') {
            isClosingTag = true
            fileReader.nextChar()
        }
        val tagName: String
        if (fileReader.curChar == '!') {
            fileReader.nextChar()
            if (fileReader.curChar == '-') return parseComment(from)
            else tagName = "!" + getIdentifier()
        } else {
            tagName = getIdentifier()
        }
        if (isClosingTag) {
            getSpaces()
            if (fileReader.curChar == '>') {
                fileReader.nextChar() // lovely
            } else {
                // we're missing a closing tag here
            }
            return HTMLToken.ClosingTag(fileReader.tokenPosFrom(from), tagName)
        } else {
            this.inTag = true
            return HTMLToken.StartTag(fileReader.tokenPosFrom(from), tagName)
        }
    }

    private fun getIdentifier(): String {
        val tagName = StringBuilder()
        while (true) {
            val c = fileReader.curChar
            if (c.isTagChar()) {
                tagName.append(c)
                fileReader.nextChar()
            } else break
        }
        return tagName.toString()
    }


}

fun Char.isTagStartingChar(): Boolean {
    return (this >= 'a' && this <= 'z')
            || (this >= 'A' && this <= 'Z')
            || this == '_' || this == '-'
}

fun Char.isTagChar(): Boolean {
    return (this >= 'a' && this <= 'z')
            || (this >= 'A' && this <= 'Z')
            || (this >= '0' && this <= '9')
            || this == '_' || this == '-'
}
