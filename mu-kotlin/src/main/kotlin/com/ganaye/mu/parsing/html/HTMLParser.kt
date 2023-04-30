package com.ganaye.mu.parsing.html

import com.ganaye.mu.parsing.*
import com.ganaye.mu.parsing.script.Expr
import com.ganaye.mu.parsing.script.Operator
import io.ktor.util.*
import kotlin.math.cbrt


class HTMLParser(context: Context) :
    BaseParser<HTMLToken, HtmlNode>(context, context.htmlTokenizer) {

    fun parseAll(): HtmlNode {
        val children = parseFragments()
        return HTMLFragment(children)
    }

    fun parseOne(): HtmlNode {
        val curToken = this.curToken
        if (curToken is HTMLToken.StartTag) {
            return parseHTMLElement(curToken.tagName)
        } else return InvalidHTML("Internal Error, Expecting HTML Element", curToken)
    }

    fun parseAttributes(): List<HTMLAttribute> {
        var attributes = mutableListOf<HTMLAttribute>()
        while (true) {
            var curToken = this.curToken
            when (curToken) {
                is HTMLToken.Eof -> break
                is HTMLToken.TagContent -> {
                    break
                }

                is HTMLToken.Identifier -> {
                    val attributeName = curToken.identifier
                    var attributeValue: Expr? = null
                    curToken = this.nextToken()
                    if (curToken is HTMLToken.EqualOp) {
                        attributeValue = evalExprFromHTML()
                    }
                    attributes.add(HTMLAttribute(attributeName, attributeValue))
                }

                is HTMLToken.Spaces -> {
                    nextToken()
                }

                else -> {
                    throw UnexpectedToken(curToken, "in attributes")
                }
            }
        }
        return attributes
    }

    private fun evalExprFromHTML(): Expr {
        // we don't parse the next token here as we expect non-HTML content
        this.fileReader.skipSpacesAndNewLines()
        val expectClosingCurlyBracket: Boolean
        if (this.fileReader.curChar == '{') {
            this.fileReader.nextChar()
            expectClosingCurlyBracket = true
        } else expectClosingCurlyBracket = false

        // we're switching parser here
        val result = context.exprParser.parseAttributeExpr()
        // and back
        this.fileReader.rewind(context.exprParser.curToken.pos)
        if (expectClosingCurlyBracket) {
            if (this.fileReader.curChar == '}') this.fileReader.nextChar()
            else throw ParserException("Expecting character '}'", fileReader.getPos())
        }
        this.nextToken()
        return result
    }

    fun parseFragments(): List<HtmlNode> {
        var children = mutableListOf<HtmlNode>()
        while (true) {
            var curToken = this.curToken
            when (curToken) {
                is HTMLToken.Eof,
                is HTMLToken.ClosingTag -> break

                is HTMLToken.StartTag -> {
                    children.add(parseHTMLElement(curToken.tagName))
                }

                is HTMLToken.StartExpr -> {
                    children.add(HTMLExpr(context.exprParser.parseHTMLExpr()))
                    this.nextToken()
                }

                else -> {
                    children.add(HTMLText(curToken.toString()))
                    this.nextToken()
                }
            }
        }
        return children
    }

    private fun parseHTMLElement(tagName: String): HtmlNode {
        val lTagName = tagName.toLowerCasePreservingASCIIRules()
        nextToken()

        val attributes = parseAttributes()
        var curToken = this.curToken
        var children: List<HtmlNode>? = null
        when (curToken) {
            is HTMLToken.TagContent -> {
                if (curToken.empty || HTMLElement.selfClosingTags.contains(lTagName) ) {
                    tokenizer.consumeToken()
                } else {
                    tokenizer.consumeToken()
                    children = parseFragments()
                    curToken = this.curToken
                    if (curToken is HTMLToken.ClosingTag && curToken.tagName.toLowerCasePreservingASCIIRules() == lTagName) {
                        tokenizer.consumeToken()
                        // we don't nexToken() just yet because we might be the last item pof the HTMLParser
                    }
                }
            }

            else -> throw UnexpectedToken(curToken, "in tag ${tagName}. Expecting </${tagName}> or />")
        }
        return HTMLElement(tagName, attributes, children)
    }
}


