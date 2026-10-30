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
    // Runtime checks of the SDK against canned responses, kept beside the examples
    // so they never reach the published library.
    create("tests") {
        kotlin.srcDirs("../tests")
        compileClasspath += sourceSets.main.get().output + configurations.runtimeClasspath.get()
        runtimeClasspath += sourceSets.main.get().output + configurations.runtimeClasspath.get()
    }
}

tasks.register<JavaExec>("runExample") {
    classpath = sourceSets["examples"].runtimeClasspath
    mainClass.set(System.getProperty("example", "examples.echobot.MainKt"))
}

tasks.register<JavaExec>("runRetryTests") {
    classpath = sourceSets["tests"].runtimeClasspath
    mainClass.set("tests.retries.Retries")
}

tasks.register<JavaExec>("runErrorBodyTests") {
    classpath = sourceSets["tests"].runtimeClasspath
    mainClass.set("tests.errorbodies.ErrorBodies")
}

tasks.register<JavaExec>("runTests") {
    classpath = sourceSets["tests"].runtimeClasspath
    mainClass.set("tests.OpenEnums")
    dependsOn("runRetryTests", "runErrorBodyTests")
}

val ktorVersion = "3.2.3"

dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.9.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.10.2")
    implementation("io.ktor:ktor-client-core:$ktorVersion")
    implementation("io.ktor:ktor-client-cio:$ktorVersion")
    implementation("io.ktor:ktor-client-auth:$ktorVersion")
    implementation("io.ktor:ktor-client-content-negotiation:$ktorVersion")
    implementation("io.ktor:ktor-serialization-kotlinx-json:$ktorVersion")
}

// The library runs on Java 11+, though JitPack builds it with JDK 17 (jitpack.yml):
// -Xjdk-release also refuses JDK APIs newer than 11.
tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().configureEach {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_11)
        freeCompilerArgs.addAll("-opt-in=kotlinx.serialization.ExperimentalSerializationApi", "-Xjdk-release=11")
    }
}

java {
    sourceCompatibility = JavaVersion.VERSION_11
    targetCompatibility = JavaVersion.VERSION_11
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
