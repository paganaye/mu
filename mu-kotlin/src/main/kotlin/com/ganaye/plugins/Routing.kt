package com.ganaye.plugins

import io.ktor.http.*
import io.ktor.server.routing.*
import io.ktor.server.response.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.routing.get
import java.io.File
import io.ktor.util.*
import java.awt.TrayIcon.MessageType


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
                        call.respondText(content.replace("{muUser}", "Pascal"), ContentType.Text.Html)
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
