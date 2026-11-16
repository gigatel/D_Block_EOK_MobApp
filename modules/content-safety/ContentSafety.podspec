require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "ContentSafety"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://dblockeok.com"
  s.license      = { :type => "UNLICENSED" }
  s.authors      = "D Block EOK RWA"
  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :path => "." }

  s.source_files = "ios/**/*.{h,m,mm}"
  s.resource_bundles = { "ContentSafety" => ["assets/open_nsfw.tflite"] }
  s.frameworks   = "AVFoundation", "UIKit"

  s.dependency "React-Core"
  s.dependency "TensorFlowLiteObjC", "2.17.0"
end
