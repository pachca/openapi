// swift-tools-version: 5.9
import PackageDescription

// Runtime checks of the SDK against canned responses:
//   swift run --package-path sdk/swift/tests OpenEnums
let package = Package(
    name: "PachcaTests",
    platforms: [.macOS(.v13)],
    dependencies: [
        .package(path: ".."),
    ],
    targets: [
        .executableTarget(
            name: "OpenEnums",
            dependencies: [
                .product(name: "PachcaSDK", package: "swift"),
            ],
            path: "Sources/OpenEnums"
        ),
    ]
)
