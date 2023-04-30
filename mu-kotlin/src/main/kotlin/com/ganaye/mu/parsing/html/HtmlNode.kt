package com.ganaye.mu.parsing.html

import com.ganaye.mu.parsing.script.Expr
import com.ganaye.mu.parsing.script.JSON
import com.ganaye.mu.parsing.script.Statement
import io.ktor.util.*

class HTMLAndScriptBuilder {
    val htmlBuilder = StringBuilder()
    val jsBuilder = StringBuilder()
    fun appendHTML(s: String) {
        htmlBuilder.append(s)
    }

    fun appendJS(s: String) {
        jsBuilder.append(s)
    }

    public override fun toString(): String {
        return toHTML()
    }

    fun toHTML(): String {
        val html = htmlBuilder.toString();
        var js = jsBuilder.toString().trim();
        if (js.isNotEmpty()) {
            val indexOfHtmlEnd = html.lastIndexOf("</html>")
            if (indexOfHtmlEnd < 0) {
                return "$html\n<script>\n$js\n</script>\n"
            } else {
                return html.substring(
                    0,
                    indexOfHtmlEnd
                ) + "\n<script>\n$js\n</script>\n" + html.substring(indexOfHtmlEnd);
            }
        } else return html
    }

    fun toJS(): String {
        return TODO()
    }
}

sealed class HtmlNode {
    override fun toString(): String {
        val b = HTMLAndScriptBuilder()
        toHtml(b)
        return b.toString()
    }

    abstract fun toHtml(output: HTMLAndScriptBuilder)
    abstract fun toJS(output: StringBuilder, reactive: Boolean)

}

class HTMLFragment(children: Iterable<HtmlNode>) : HtmlNode() {
    val children = children.toList()
    override fun toHtml(output: HTMLAndScriptBuilder) {
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

    override fun toHtml(output: HTMLAndScriptBuilder) {
        output.appendHTML("<${tagName}")
        attributes.forEach {
            output.appendHTML(" ")
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
        if (selfClosing) output.appendHTML("/>") else output.appendHTML(">")
        children?.forEach { it.toHtml(output) }
        if (withClosingTag) output.appendHTML("</${tagName}>")
    }

    override fun toJS(output: StringBuilder, reactive: Boolean) {
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
        output.appendHTML("<script")
        if (attributes.size > 0) {
            output.appendHTML(" ")
            attributes.forEach {
                output.appendHTML(" ")
                it.toHtml(output)
            }
        }
        if (content.lines.size > 0) {
            output.appendHTML(">\n")
            content.toJS(output.htmlBuilder, true);
            output.appendHTML("\n")
        } else {
            output.appendHTML(">")
        }
        output.appendHTML("</script>")
    }

    override fun toJS(output: StringBuilder, reactive: Boolean) {
        TODO()
    }
}

class HTMLAttribute(val attributeName: String, val attributeValue: Expr?) : HtmlNode() {
    override fun toHtml(output: HTMLAndScriptBuilder) {

        output.appendHTML(attributeName)
        if (attributeValue != null) {
            output.appendHTML("=")
            if (attributeValue.isConst) {
                output.appendHTML(JSON.stringify(attributeValue.constValue))
            } else {
                output.htmlBuilder.append("\"")
                attributeValue.toJS(output.htmlBuilder, true);
                output.htmlBuilder.append("\"")
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
    val id = ++idCounter
    override fun toHtml(output: HTMLAndScriptBuilder) {
        output.appendHTML("""<span id="muElt${id}" />""")
        output.appendJS("mu.mount(muElt${id},");
        content.toJS(output.jsBuilder, true);
        output.appendJS(");\n")
    }

    override fun toJS(output: StringBuilder, reactive: Boolean) {
        output.append("[TODO script...]")
    }

    companion object {
        var idCounter = 0
    }
}

class HTMLText(val content: String) : HtmlNode() {
    override fun toHtml(output: HTMLAndScriptBuilder) {
        output.appendHTML(content)
    }

    override fun toJS(output: StringBuilder, reactive: Boolean) {
        output.append(JSON.stringify(content));
    }

}

class InvalidHTML(val message: String, val token: HTMLToken) : HtmlNode() {
    override fun toHtml(output: HTMLAndScriptBuilder) {
        output.appendHTML("Invalid: " + message + " " + token)
    }

    override fun toJS(output: StringBuilder, reactive: Boolean) {
        output.append("Invalid: " + JSON.stringify(message) + " " + token);
    }

}

