package com.ganaye.mu

import com.ganaye.mu.emit.JSBuilder
import com.ganaye.mu.parsing.Context
import com.ganaye.mu.parsing.SourceFile
import com.ganaye.mu.parsing.html.HTMLAndScriptBuilder
import com.ganaye.mu.parsing.html.HtmlNode.Companion.NodeIdCounter
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class HTMLParserTest {
    fun testHTML(source: String, expected: String) {
        NodeIdCounter = 0
        val context = Context(SourceFile("/test", source))
        val ast = context.htmlParser.parseAll()
        val output = HTMLAndScriptBuilder()
        ast.toHtml(output)
        val actual = output.toString()
        assertEquals(expected.trim(), actual.trim())
    }

    fun testJS(source: String, expected: String) {
        val context = Context(SourceFile("/test", source))
        val ast = context.htmlParser.parseAll()
        val output = JSBuilder()
        ast.toJS(output, true)
        val actual = output.toString()
        assertEquals(expected, actual)
    }

    @Test
    fun parseSimpleHTML() {
        val source = "<h1>Hello world</h1>"
        val expected = "<h1>Hello world</h1>"
        testHTML(source, expected)
    }

    @Test
    fun parseSimpleElement() {
        val source = "<p>Hello</p>"
        val expected = """mu.elt("p",null,"Hello")"""
        testJS(source, expected)
    }

    @Test
    fun parseSimpleExpr() {
        val source = "Hello {userName}"
        val expected = """Hello <span id="muElt1">…</span>
<script>
mu.mount(userName,muElt1);
</script>
"""
        testHTML(source, expected)
    }

    @Test
    fun selfClosingTag() {
        val source = """<img>hi""".trimIndent()
        val expected = """<img/>hi""".trimIndent()
        testHTML(source, expected)
    }

    @Test
    fun parseHTMLLink() {
        val source = """<a href="ganaye.com">My site</h1>""".trimIndent()
        val expected = """<a href="ganaye.com">My site</a>""".trimIndent()
        testHTML(source, expected)
    }

    @Test
    fun parseMoreComplexExpression() {
        val source = """<a href=("ganaye" + ".com")>My site</h1>""".trimIndent()
        val expected = """<a href="ganaye.com">My site</a>""".trimIndent()
        testHTML(source, expected)
    }

    @Test
    fun parseButtonClick() {
        val source = """<button click={handleClick}>""".trimIndent()
        val expected = """<button click="handleClick"/>""".trimIndent()
        testHTML(source, expected)
    }

    @Test
    fun longerHTML_but_wrong() {
        val source = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Untitled Document</title>
</head>
<body>
<script src="mu.js"></script>
<h1>HTML says hello {muUser}</h1>
<button onclick={count=count+1}>
    Clicked {count} {count == 1 ? 'time' : 'times'}
</button>
<script lang="mu">
let muUser = "Pascal";
let count = 0;
</script>
</body>
</html>""".trimIndent()

        val expected = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8"/>
    <title>Untitled Document</title>
</head>
<body>
<script  src="mu.js"></script>
<h1>HTML says hello <span id="muElt1">…</span></h1>
<button onclick="mu.assign(count,mu.plus(count,1.0))">
    Clicked <span id="muElt2">…</span> <span id="muElt3">…</span>
</button>
<script  lang="mu">
let muUser=new Var("Pascal");
let count=new Var(0.0);
</script>
</body>

<script>
mu.mount(muUser,muElt1);
mu.mount(count,muElt2);
mu.mount(mu.ternary_cond(mu.equalequal(count,1.0),"time","times"),muElt3);
</script>
</html>""".trimIndent()
        testHTML(source, expected)
    }


    @Test
    fun small_HTML() {
        val source = """
<script src="mu.js"></script>
<h1>Hello {user}</h1>
<script>
user = "Pascal"
</script>""".trimIndent()

        val expectedHTML = """
<script  src="mu.js"></script>
<h1>Hello <span id="muElt1">…</span></h1>
<script>
mu.assign(user,"Pascal");
</script>
<script>
mu.mount(user,muElt1);
</script>
""".trimIndent()
        testHTML(source, expectedHTML)
    }

    @Test
    fun smaller_HTML() {
        val source = "Hello {user}"
        val expectedHTML = """Hello <span id="muElt1">…</span>
<script>
mu.mount(user,muElt1);
</script>
""".trimIndent()
        testHTML(source, expectedHTML)
    }

    @Test
    fun openScriptTag() {
        val src = "<script src=\"A\"></script>"
        val exp = "<script  src=\"A\"></script>"
        testHTML(src, exp)
    }

    @Test
    fun emptyScriptTag() {
        val src = "<script src=\"A\"/>"
        val exp = "<script src=\"A\"></script>"
        testHTML(src, exp)
    }

    @Test
    fun buttonOnClick() {
        val src = "<button onclick={count=count+1}>"
        val exp = "<button onclick=\"mu.assign(count,mu.plus(count,1.0))\"/>"
        testHTML(src, exp)
    }

    @Test
    fun script_tag() {
        val source = "<script>let a=1</script>"
        val expectedHTML = """
<script>
let a=new Var(1.0);
</script>
""".trimIndent()
        testHTML(source, expectedHTML)
    }

    @Test
    fun ifAttribute() {
        val src = "<p if={x}>hi</p>"
        val exp = """
<span id="muElt1">…</span>
<script>
mu.mountIf(x,renderElt1,muElt1)
function renderElt1(it) {
  return mu.elt("p",null,"hi");
}
</script>
"""
        testHTML(src, exp)
    }

    @Test
    fun ifInIf() {
        val src = "<p if={x}>x<span if={y}>= {y}</span></p>"
        val exp = """
<span id="muElt2">…</span>
<script>
mu.mountIf(x,renderElt2,muElt2)
function renderElt2(it) {
  return mu.elt("p",null,"x",mu.elt("span",null,"= ",mu.mount(y,muElt3);
  ));
}
</script>"""
        testHTML(src, exp)
    }

    @Test
    fun ifElseIfAttribute() {
        val src = """
            |<p if={x}>X</p>
            |<p elseif={y}>Y</p>
            |<p else={z}>Z</p>
        """.trimMargin()
        val exp = """
<span id="muElt1">…</span>
<span id="muElt2">…</span>
<span id="muElt3">…</span>
<script>
mu.mountIf(x,renderElt1,muElt1)
function renderElt1(it) {
  return mu.elt("p",null,"X");
}
function renderElt2(it) {
  return mu.elt("p",null,"Y");
}
function renderElt3(it) {
  return mu.elt("p",null,"Z");
}
</script>
"""
        testHTML(src, exp)
    }



}