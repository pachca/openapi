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
            name: "PachcaExamples",
            dependencies: [
                .product(name: "PachcaSDK", package: "PachcaSDK"),
            ],
            path: "Sources"
        )
    ]
)
