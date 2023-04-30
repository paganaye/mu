package com.ganaye.mu.parsing.html

import com.ganaye.mu.parsing.script.Expr
import com.ganaye.mu.parsing.script.JSON
import io.ktor.util.*

sealed class HtmlNode {
    override fun toString(): String {
        val sb = StringBuilder()
        toHtml(sb)
        return sb.toString()
    }

    abstract fun toHtml(output: StringBuilder)
    abstract fun toJS(output: StringBuilder, reactive: Boolean)

}

class HTMLFragment(children: Iterable<HtmlNode>) : HtmlNode() {
    val children = children.toList()
    override fun toHtml(output: StringBuilder) {
        children.forEach {
            it.toHtml(output)
        }
    }

    override fun toJS(output: StringBuilder, reactive: Boolean) {
        children.forEach {
            it.toJS(output, reactive)
        }
    }

}


class HTMLElement
constructor(val tagName: String, attributes: Iterable<HTMLAttribute>, children: Iterable<HtmlNode>?) :
    HtmlNode() {
    val children = children?.toList()
    val attributes = attributes.toList()
    val lTagName: String;
    val closingTag: ClosingTag

    enum class ClosingTag {
        OpenOnly,
        SelfClosingOnly,
        AlwaysClose,
        Normal
    }

    init {
        lTagName = tagName.toLowerCasePreservingASCIIRules()
        closingTag = if (selfClosingTags.contains(lTagName)) ClosingTag.SelfClosingOnly
        else if (lTagName.startsWith('!')) ClosingTag.OpenOnly
        else if (lTagName == "script" || lTagName == "title") ClosingTag.AlwaysClose
        else ClosingTag.Normal
    }

    override fun toHtml(output: StringBuilder) {
        output.append("<${tagName}")
        attributes.forEach {
            output.append(" ")
            it.toHtml(output)
        }
        val withClosingTag: Boolean
        val selfClosing: Boolean
        when (closingTag) {
            ClosingTag.OpenOnly -> {
                selfClosing = false
                withClosingTag = false
            }

            else -> {
                if (closingTag == ClosingTag.AlwaysClose || (children != null && children.isNotEmpty())) {
                    selfClosing = false
                    withClosingTag = true
                } else {
                    selfClosing = true
                    withClosingTag = false
                }
            }
        }
        if (selfClosing) output.append("/>") else output.append(">")
        children?.forEach { it.toHtml(output) }
        if (withClosingTag) output.append("</${tagName}>")
    }

    override fun toJS(output: StringBuilder, reactive: Boolean) {
        if (reactive) {
            output.append("mu.elt(\"$tagName\"")
            if (attributes.size > 0) {
                attributes.forEach {
                    var first = true
                    output.append(",{")
                    children?.forEach {
                        if (first) first = false
                        else output.append(",")
                        it.toJS(output, reactive)
                    }
                    output.append("}")
                }
            } else output.append(",null")
            if (children != null && children.size > 0) {
                children.forEach {
                    output.append(",")
                    it.toJS(output, reactive)
                }
            }
            output.append(")")
        } else toHtml(output)
    }

    companion object {
        val selfClosingTags = setOf(
            "area",
            "base",
            "br",
            "col",
            "embed",
            "hr",
            "img",
            "input",
            "link",
            "meta",
            "param",
            "source",
            "track",
            "wbr"
        )
    }

}

class HTMLAttribute(val attributeName: String, val attributeValue: Expr?) : HtmlNode() {
    override fun toHtml(output: StringBuilder) {

        output.append(attributeName)
        if (attributeValue != null) {
            output.append("=")
            if (attributeValue.isConst) {
                output.append(JSON.stringify(attributeValue.constValue))
            } else {
                attributeValue.toJS(output, true)
            }
        }
    }

    override fun toJS(output: StringBuilder, reactive: Boolean) {
        if (attributeValue == null) output.append(attributeName)
        else {
            output.append("$attributeName : ")
            attributeValue.toJS(output, reactive)
        }
    }
}

class HTMLExpr(val content: Expr) : HtmlNode() {
    override fun toHtml(output: StringBuilder) {
        output.append("[TODO script...]")
    }

    override fun toJS(output: StringBuilder, reactive: Boolean) {
        output.append("[TODO script...]")
    }

}

class HTMLText(val content: String) : HtmlNode() {
    override fun toHtml(output: StringBuilder) {
        output.append(content)
    }

    override fun toJS(output: StringBuilder, reactive: Boolean) {
        output.append(JSON.stringify(content));
    }

}

class InvalidHTML(val message: String, val token: HTMLToken) : HtmlNode() {
    override fun toHtml(output: StringBuilder) {
        output.append("Invalid: " + message + " " + token)
    }

    override fun toJS(output: StringBuilder, reactive: Boolean) {
        output.append("Invalid: " + JSON.stringify(message) + " " + token);
    }

}

