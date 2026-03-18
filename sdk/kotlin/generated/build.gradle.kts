plugins {
    kotlin("jvm") version "2.2.20"
    kotlin("plugin.serialization") version "2.2.20"
    application
    `maven-publish`
}

group = "com.pachca"
version = findProperty("version")?.toString()?.removePrefix("v")
    ?: error("Version not set. Pass -Pversion=<version> or set via JitPack.")

repositories {
    mavenCentral()
}

kotlin {
    sourceSets.all {
        languageSettings {
            optIn("kotlin.time.ExperimentalTime")
        }
    }
}

sourceSets {
    create("examples") {
        kotlin.srcDirs("../examples")
        compileClasspath += sourceSets.main.get().output + configurations.runtimeClasspath.get()
        runtimeClasspath += sourceSets.main.get().output + configurations.runtimeClasspath.get()
    }
}

tasks.register<JavaExec>("runExample") {
    classpath = sourceSets["examples"].runtimeClasspath
    mainClass.set(System.getProperty("example", "examples.echobot.MainKt"))
}

val ktorVersion = "3.2.3"

dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.9.0")
    implementation("io.ktor:ktor-client-core:$ktorVersion")
    implementation("io.ktor:ktor-client-cio:$ktorVersion")
    implementation("io.ktor:ktor-client-auth:$ktorVersion")
    implementation("io.ktor:ktor-client-content-negotiation:$ktorVersion")
    implementation("io.ktor:ktor-serialization-kotlinx-json:$ktorVersion")
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().configureEach {
    compilerOptions {
        freeCompilerArgs.add("-opt-in=kotlinx.serialization.ExperimentalSerializationApi")
    }
}

java {
    withSourcesJar()
}

publishing {
    publications {
        create<MavenPublication>("maven") {
            groupId = "com.pachca"
            artifactId = "pachca-sdk"
            from(components["java"])
        }
    }
}
