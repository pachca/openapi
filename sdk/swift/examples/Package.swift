// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "PachcaExamples",
    platforms: [.macOS(.v13)],
    dependencies: [
        .package(path: ".."),
    ],
    targets: [
        .executableTarget(
            name: "EchoBot",
            dependencies: [
                .product(name: "PachcaSDK", package: "swift"),
            ],
            path: "Sources/EchoBot"
        ),
        .executableTarget(
            name: "Upload",
            dependencies: [
                .product(name: "PachcaSDK", package: "swift"),
            ],
            path: "Sources/Upload"
        ),
        .executableTarget(
            name: "Stub",
            dependencies: [
                .product(name: "PachcaSDK", package: "swift"),
            ],
            path: "Sources/Stub"
        ),
        .executableTarget(
            name: "HttpClient",
            dependencies: [
                .product(name: "PachcaSDK", package: "swift"),
            ],
            path: "Sources/HttpClient"
        ),
    ]
)
