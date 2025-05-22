package com.ganaye.plugins

import com.ganaye.mu.parsing.Context
import com.ganaye.mu.parsing.SourceFile
import com.ganaye.mu.parsing.html.HTMLAndScriptBuilder
import com.ganaye.mu.parsing.html.HtmlNode.Companion.NodeIdCounter
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.util.*
import java.io.File


fun Application.configureRouting() {
    routing {
        get("{...}") {
            // I don't know KTOR, this part is just a hack for now
            var path = call.request.path().decodeURLPart()
            try {
                if (path.length == 0 || path == "/") path = "index.html"
                val file = File("public", path)
                if (file.exists() && file.isFile) {
                    val ext = file.extension.toUpperCasePreservingASCIIRules();
                    if (ext == "HTML") {
                        val content = file.readText(Charsets.UTF_8)

                        call.respondText(processHTML(path, content), ContentType.Text.Html)
                    } else if (ext == "JS" || ext == "MU") {
                        val content = file.readText(Charsets.UTF_8)
                        call.respondText(content.replace("{muUser}", "Pascal"), ContentType.Text.JavaScript)
                    } else call.respondFile(file)
                } else call.respondText("The file " + file.path + " does not exist.")
            } catch (e: Exception) {
                call.respondText("Error: " + e.message)
            }
        }
    }
}

fun processHTML(path: String, source: String): String {
    try {
        NodeIdCounter = 0
        val context = Context(SourceFile(path, source))
        val ast = context.htmlParser.parseAll()
        val output = HTMLAndScriptBuilder() //= StringBuilder()
        ast.toHtml(output)
        return output.toString()
    } catch (e: Exception) {
        return "<p>Error " + e.message + "</p>"
    }
}