package com.ganaye.mu.parsing.html

import com.ganaye.mu.emit.HTMLBuilder
import com.ganaye.mu.emit.JSBuilder
import com.ganaye.mu.parsing.script.Expr
import com.ganaye.mu.parsing.script.JSON
import com.ganaye.mu.parsing.script.Statement
import io.ktor.util.*

class HTMLAndScriptBuilder {
    val htmlBuilder = HTMLBuilder()
    val jsBuilder = JSBuilder()

    public override fun toString(): String {
        return toHTML()
    }

    fun toHTML(): String {
        val html = htmlBuilder.toString();
        var js = jsBuilder.toString().trim();
        if (js.isNotEmpty()) {
            val indexOfHtmlEnd = html.lastIndexOf("</html>")
            val textToInsert = "\n<script>\n$js\n</script>\n"
            if (indexOfHtmlEnd < 0) {
                return html + textToInsert
            } else {
                return (html.substring(0, indexOfHtmlEnd)
                        + textToInsert
                        + html.substring(indexOfHtmlEnd))
            }
        } else return html
    }
}

sealed class HtmlNode {
    override fun toString(): String {
        val b = HTMLAndScriptBuilder()
        toHtml(b)
        return b.toString()
    }

    abstract fun toHtml(output: HTMLAndScriptBuilder)
    abstract fun toJS(output: JSBuilder, reactive: Boolean)

}

class HTMLFragment(children: Iterable<HtmlNode>) : HtmlNode() {
    val children = children.toList()
    override fun toHtml(output: HTMLAndScriptBuilder) {
        children.forEach {
            it.toHtml(output)
        }
    }

    override fun toJS(output: JSBuilder, reactive: Boolean) {
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
    val tagType: TagType

    enum class TagType {
        DocTypeDeclaration,
        AlwaysSelfClose,
        NeverSelfClose,
        Normal
    }

    init {
        lTagName = tagName.toLowerCasePreservingASCIIRules()
        tagType = if (selfClosingTags.contains(lTagName)) TagType.AlwaysSelfClose
        else if (lTagName.startsWith('!')) TagType.DocTypeDeclaration
        else if (lTagName == "script" || lTagName == "title") TagType.NeverSelfClose
        else TagType.Normal
    }

    override fun toHtml(output: HTMLAndScriptBuilder) {
        output.htmlBuilder.startTag(tagName)
        attributes.forEach {
            output.htmlBuilder.append(" ")
            it.toHtml(output)
        }
        val withClosingTag: Boolean
        val selfClosing: Boolean
        when (tagType) {
            TagType.DocTypeDeclaration -> {
                selfClosing = false
                withClosingTag = false
            }

            else -> {
                if (tagType == TagType.NeverSelfClose || (children != null && children.isNotEmpty())) {
                    selfClosing = false
                    withClosingTag = true
                } else {
                    selfClosing = true
                    withClosingTag = false
                }
            }
        }
        if (selfClosing) {
            output.htmlBuilder.selfClose(tagType == TagType.DocTypeDeclaration)
        } else {
            output.htmlBuilder.enterTag()
        }
        children?.forEach { it.toHtml(output) }
        if (withClosingTag) {
            output.htmlBuilder.closeTag(tagName)
        }
    }

    override fun toJS(output: JSBuilder, reactive: Boolean) {
        //if (reactive) {
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
        //} else TODO() // toHtml(output)
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

class HTMLScriptElement
constructor(attributes: Iterable<HTMLAttribute>, val content: Statement.ScriptBlock) :
    HtmlNode() {
    val attributes = attributes.toList()


    override fun toHtml(output: HTMLAndScriptBuilder) {
        output.htmlBuilder.startTag("script")
        if (attributes.size > 0) {
            output.htmlBuilder.append(" ")
            attributes.forEach {
                output.htmlBuilder.append(" ")
                it.toHtml(output)
            }
        }
        if (content.lines.size > 0) {
            output.htmlBuilder.enterTag()
            val jsBuilder = JSBuilder()
            content.toJS(jsBuilder, true);
            output.htmlBuilder.appendRaw("\n" + jsBuilder.toString())
        } else {
            output.htmlBuilder.enterTag()
        }

        output.htmlBuilder.closeTag("script")

    }

    override fun toJS(output: JSBuilder, reactive: Boolean) {
        TODO()
    }
}

class HTMLAttribute(val attributeName: String, val attributeValue: Expr?) : HtmlNode() {
    override fun toHtml(output: HTMLAndScriptBuilder) {

        output.htmlBuilder.append(attributeName)
        if (attributeValue != null) {
            output.htmlBuilder.append("=")
            if (attributeValue.isConst) {
                output.htmlBuilder.append(JSON.stringify(attributeValue.constValue))
            } else {
                output.htmlBuilder.append("\"")
                val jsBuilder = JSBuilder()
                attributeValue.toJS(jsBuilder, true);
                output.htmlBuilder.append(jsBuilder.asSingleString())
                output.htmlBuilder.append("\"")
            }
        }
    }

    override fun toJS(output: JSBuilder, reactive: Boolean) {
        if (attributeValue == null) output.append(attributeName)
        else {
            output.append("$attributeName : ")
            attributeValue.toJS(output, reactive)
        }
    }
}

class HTMLExpr(val content: Expr) : HtmlNode() {
    val id = ++idCounter
    override fun toHtml(output: HTMLAndScriptBuilder) {
        output.htmlBuilder.startTag("span")
        output.htmlBuilder.append(""" id="muElt${id}"""")
        output.htmlBuilder.enterTag()
        output.htmlBuilder.append("…")
        output.htmlBuilder.closeTag("span")
        output.jsBuilder.append("mu.mount(muElt${id},")
        content.toJS(output.jsBuilder, true);
        output.jsBuilder.appendLine(");")
    }

    override fun toJS(output: JSBuilder, reactive: Boolean) {
        output.append("[TODO script...]")
    }

    companion object {
        var idCounter = 0
    }
}

class HTMLText(val content: String) : HtmlNode() {
    override fun toHtml(output: HTMLAndScriptBuilder) {
        output.htmlBuilder.append(content)
    }

    override fun toJS(output: JSBuilder, reactive: Boolean) {
        output.append(JSON.stringify(content));
    }

}

class InvalidHTML(val message: String, val token: HTMLToken) : HtmlNode() {
    override fun toHtml(output: HTMLAndScriptBuilder) {
        output.htmlBuilder.append("Invalid: " + message + " " + token)
    }

    override fun toJS(output: JSBuilder, reactive: Boolean) {
        output.append("Invalid: " + JSON.stringify(message) + " " + token);
    }

}

