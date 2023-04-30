package com.ganaye.mu.parsing.html

import com.ganaye.mu.parsing.*
import com.ganaye.mu.parsing.script.Expr
import com.ganaye.mu.parsing.script.Operator
import com.ganaye.mu.parsing.script.Statement
import io.ktor.util.*


class HTMLParser(context: Context) :
    BaseParser<HTMLToken, HtmlNode>(context, context.htmlTokenizer) {

    fun parseAll(): HtmlNode {
        val children = parseFragments()
        return HTMLFragment(children)
    }

    fun parseOne(): HtmlNode {
        val curToken = this.curToken
        if (curToken is HTMLToken.StartTag) {
            return parseHTMLElementOrScript(curToken.tagName)
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
        val priority: Int
        if (this.fileReader.curChar == '{') {
            this.fileReader.nextChar()
            expectClosingCurlyBracket = true
            priority = Operator.close_curly_brackets.priority
        } else {
            expectClosingCurlyBracket = false
            // we don't want to parse / because <a ref=""/>
            priority = Operator.div.priority
        }
        // we're switching parser here
        val result = context.exprParser.parseAttributeExpr(priority)
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
                    children.add(parseHTMLElementOrScript(curToken.tagName))
                }

                is HTMLToken.StartExpr -> {
                    children.add(HTMLExpr(context.exprParser.parseHTMLExpr()))
                    this.nextToken()
                }

                else -> {
                    children.add(HTMLText(curToken.toString()))
                    this.tokenizer.clearToken()
                }
            }
        }
        return children
    }

    private fun parseHTMLElementOrScript(tagName: String): HtmlNode {
        val lTagName = tagName.toLowerCasePreservingASCIIRules()
        nextToken()

        val attributes = parseAttributes()
        var curToken = this.curToken
        var children: List<HtmlNode>? = null
        when (curToken) {
            is HTMLToken.TagContent -> {
                if (curToken.empty || HTMLElement.selfClosingTags.contains(lTagName)) {
                    tokenizer.clearToken()
                } else {
                    tokenizer.clearToken()
                    if (lTagName == "script") {
                        return HTMLScriptElement(attributes, parseScriptContent());
                    } else {
                        children = parseFragments()
                        curToken = this.curToken
                        if (curToken is HTMLToken.ClosingTag && curToken.tagName.toLowerCasePreservingASCIIRules() == lTagName) {
                            tokenizer.clearToken()
                            // we don't nexToken() just yet because we might be the last item pof the HTMLParser
                        }
                    }
                }
                return HTMLElement(tagName, attributes, children)
            }

            else -> throw UnexpectedToken(curToken, "in tag ${tagName}. Expecting </${tagName}> or />")
        }
    }

    fun parseScriptContent(): Statement.ScriptBlock {
        tokenizer.clearToken()
        val result = this.context.scriptParser.parseScript()
        return result
    }


}