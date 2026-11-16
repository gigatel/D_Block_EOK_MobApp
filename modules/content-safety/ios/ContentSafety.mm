// On-device explicit-content screening with Yahoo's open_nsfw model (TFLite).
// JS: NativeModules.ContentSafety.scan(uri, kind, maxFrames) → { score, frames }.
// Preprocessing matches the original model: resize 256×256, centre-crop 224×224,
// BGR order, subtract the VGG mean. Output tensor is [sfw, nsfw].

#import <React/RCTBridgeModule.h>
#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>
#import <TFLTensorFlowLite.h>

static const int kResize = 256;
static const int kInput = 224;

@interface ContentSafety : NSObject <RCTBridgeModule>
@end

@implementation ContentSafety {
  TFLInterpreter *_interpreter;
  dispatch_queue_t _queue;
}

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup { return NO; }

- (instancetype)init
{
  if ((self = [super init])) {
    _queue = dispatch_queue_create("com.dblockeok.contentsafety", DISPATCH_QUEUE_SERIAL);
  }
  return self;
}

- (dispatch_queue_t)methodQueue { return _queue; }

- (TFLInterpreter *)interpreter:(NSError **)error
{
  if (_interpreter) return _interpreter;
  NSBundle *bundle = [NSBundle bundleForClass:[self class]];
  NSString *path = [bundle pathForResource:@"open_nsfw" ofType:@"tflite"];
  if (!path) {
    NSURL *res = [bundle URLForResource:@"ContentSafety" withExtension:@"bundle"];
    path = res ? [[NSBundle bundleWithURL:res] pathForResource:@"open_nsfw" ofType:@"tflite"] : nil;
  }
  if (!path) {
    if (error) *error = [NSError errorWithDomain:@"ContentSafety" code:1 userInfo:@{NSLocalizedDescriptionKey: @"Safety model missing from the app bundle."}];
    return nil;
  }
  TFLInterpreterOptions *options = [[TFLInterpreterOptions alloc] init];
  options.numberOfThreads = 2;
  TFLInterpreter *interp = [[TFLInterpreter alloc] initWithModelPath:path options:options error:error];
  if (!interp || ![interp allocateTensorsWithError:error]) return nil;
  _interpreter = interp;
  return interp;
}

/** NSFW probability for one image, or -1 on failure. */
- (float)classify:(CGImageRef)image error:(NSError **)error
{
  TFLInterpreter *interp = [self interpreter:error];
  if (!interp) return -1;

  const size_t bpr = kResize * 4;
  NSMutableData *rgba = [NSMutableData dataWithLength:kResize * bpr];
  CGColorSpaceRef cs = CGColorSpaceCreateDeviceRGB();
  CGContextRef ctx = CGBitmapContextCreate(rgba.mutableBytes, kResize, kResize, 8, bpr, cs,
                                           (CGBitmapInfo)kCGImageAlphaNoneSkipLast | (CGBitmapInfo)kCGBitmapByteOrder32Big);
  CGColorSpaceRelease(cs);
  if (!ctx) return -1;
  CGContextSetInterpolationQuality(ctx, kCGInterpolationHigh);
  CGContextDrawImage(ctx, CGRectMake(0, 0, kResize, kResize), image);
  CGContextRelease(ctx);

  const uint8_t *px = (const uint8_t *)rgba.bytes;
  const int off = (kResize - kInput) / 2;
  NSMutableData *input = [NSMutableData dataWithLength:kInput * kInput * 3 * sizeof(float)];
  float *f = (float *)input.mutableBytes;
  for (int y = 0; y < kInput; y++) {
    const uint8_t *row = px + (y + off) * bpr + off * 4;
    for (int x = 0; x < kInput; x++, row += 4) {
      *f++ = row[2] - 103.939f; // B
      *f++ = row[1] - 116.779f; // G
      *f++ = row[0] - 123.68f;  // R
    }
  }

  TFLTensor *in = [interp inputTensorAtIndex:0 error:error];
  if (!in || ![in copyData:input error:error] || ![interp invokeWithError:error]) return -1;
  TFLTensor *out = [interp outputTensorAtIndex:0 error:error];
  NSData *result = [out dataWithError:error];
  if (result.length < 2 * sizeof(float)) return -1;
  return ((const float *)result.bytes)[1];
}

- (NSURL *)urlFrom:(NSString *)uri
{
  NSURL *url = [NSURL URLWithString:uri];
  return url.scheme ? url : [NSURL fileURLWithPath:uri];
}

RCT_EXPORT_METHOD(scan:(NSString *)uri
                  kind:(NSString *)kind
                  maxFrames:(double)maxFrames
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  NSURL *url = [self urlFrom:uri];
  NSMutableArray *frames = [NSMutableArray array]; // CGImageRef bridged

  if ([kind isEqualToString:@"video"]) {
    AVURLAsset *asset = [AVURLAsset URLAssetWithURL:url options:nil];
    AVAssetImageGenerator *gen = [AVAssetImageGenerator assetImageGeneratorWithAsset:asset];
    gen.appliesPreferredTrackTransform = YES;
    gen.maximumSize = CGSizeMake(kResize * 2, kResize * 2);
    int count = MAX(1, MIN(12, (int)maxFrames));
    Float64 duration = CMTimeGetSeconds(asset.duration);
    for (int i = 0; i < count; i++) {
      Float64 t = duration > 0 ? duration * (2 * i + 1) / (2.0 * count) : 0;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
      CGImageRef img = [gen copyCGImageAtTime:CMTimeMakeWithSeconds(t, 600) actualTime:NULL error:NULL];
#pragma clang diagnostic pop
      if (img) {
        [frames addObject:(__bridge id)img];
        CGImageRelease(img);
      }
      if (duration <= 0) break;
    }
  } else {
    NSData *bytes = [NSData dataWithContentsOfURL:url];
    UIImage *image = bytes ? [UIImage imageWithData:bytes] : nil;
    if (image.CGImage) [frames addObject:(__bridge id)image.CGImage];
  }

  if (frames.count == 0) {
    reject(@"E_DECODE", @"Could not read this file to check it.", nil);
    return;
  }

  float worst = 0;
  for (id frame in frames) {
    NSError *error = nil;
    float score = [self classify:(__bridge CGImageRef)frame error:&error];
    if (score < 0) {
      reject(@"E_SCAN", error.localizedDescription ?: @"Content check failed", error);
      return;
    }
    worst = MAX(worst, score);
  }
  resolve(@{@"score": @(worst), @"frames": @(frames.count)});
}

@end
