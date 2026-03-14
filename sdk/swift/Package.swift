// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "PachcaSDK",
    platforms: [.macOS(.v13), .iOS(.v16)],
    products: [
        .library(name: "PachcaSDK", targets: ["PachcaSDK"])
    ],
    targets: [
        .target(
            name: "PachcaSDK",
            path: ".",
            exclude: [
                "node_modules",
                "examples",
                "package.json",
                "README.md",
                "Package.resolved",
            ],
            sources: ["generated/Sources/Pachca/GeneratedSources"]
        )
    ]
)
