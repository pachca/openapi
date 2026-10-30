// swift-tools-version: 5.9
import PackageDescription

// SwiftPM installs the package from the repository root, so this manifest points
// at the generated sources inside sdk/swift. sdk/swift/Package.swift is the same
// package for the examples and tests there; CI builds both.
let package = Package(
    name: "PachcaSDK",
    platforms: [.macOS(.v13), .iOS(.v16)],
    products: [
        .library(name: "PachcaSDK", targets: ["PachcaSDK"])
    ],
    targets: [
        .target(
            name: "PachcaSDK",
            path: "sdk/swift/generated/Sources/Pachca/GeneratedSources"
        )
    ]
)
