package com.dblockeok.contentsafety

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.tensorflow.lite.Interpreter
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel
import java.util.concurrent.Executors

/**
 * On-device explicit-content screening with Yahoo's open_nsfw model (TFLite).
 *
 * JS: `NativeModules.ContentSafety.scan(uri, kind, maxFrames)` resolves
 * `{ score, frames }` where `score` is the highest NSFW probability (0–1)
 * across the image or the sampled video frames.
 *
 * Preprocessing matches the original Caffe model: resize to 256×256,
 * centre-crop 224×224, BGR channel order, subtract the VGG mean.
 */
class ContentSafetyModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName() = NAME

  private val executor = Executors.newSingleThreadExecutor()
  private var interpreter: Interpreter? = null

  @ReactMethod
  fun scan(uri: String, kind: String, maxFrames: Double, promise: Promise) {
    executor.execute {
      try {
        val frames = if (kind == "video") videoFrames(uri, maxFrames.toInt().coerceIn(1, 12)) else listOfNotNull(decodeImage(uri))
        if (frames.isEmpty()) {
          promise.reject("E_DECODE", "Could not read this file to check it.")
          return@execute
        }
        var worst = 0f
        for (bmp in frames) {
          worst = maxOf(worst, classify(bmp))
          bmp.recycle()
        }
        promise.resolve(Arguments.createMap().apply {
          putDouble("score", worst.toDouble())
          putInt("frames", frames.size)
        })
      } catch (e: Throwable) {
        promise.reject("E_SCAN", e.message ?: "Content check failed", e)
      }
    }
  }

  override fun invalidate() {
    executor.shutdown()
    synchronized(this) {
      interpreter?.close()
      interpreter = null
    }
    super.invalidate()
  }

  // ---- Model -----------------------------------------------------------------

  @Synchronized
  private fun model(): Interpreter =
    interpreter ?: Interpreter(loadModel(), Interpreter.Options().setNumThreads(2)).also { interpreter = it }

  private fun loadModel(): ByteBuffer =
    try {
      reactContext.assets.openFd(MODEL).use { fd ->
        FileInputStream(fd.fileDescriptor).channel.use { ch ->
          ch.map(FileChannel.MapMode.READ_ONLY, fd.startOffset, fd.declaredLength) as MappedByteBuffer
        }
      }
    } catch (_: Exception) {
      // Asset was compressed: copy it into a direct buffer instead.
      val bytes = reactContext.assets.open(MODEL).use { it.readBytes() }
      ByteBuffer.allocateDirect(bytes.size).order(ByteOrder.nativeOrder()).apply { put(bytes); rewind() }
    }

  @Synchronized
  private fun classify(source: Bitmap): Float {
    val scaled = Bitmap.createScaledBitmap(source, RESIZE, RESIZE, true)
    val off = (RESIZE - INPUT) / 2
    val pixels = IntArray(INPUT * INPUT)
    scaled.getPixels(pixels, 0, INPUT, off, off, INPUT, INPUT)
    if (scaled != source) scaled.recycle()

    val input = ByteBuffer.allocateDirect(INPUT * INPUT * 3 * 4).order(ByteOrder.nativeOrder())
    for (c in pixels) {
      input.putFloat(Color.blue(c) - MEAN_B)
      input.putFloat(Color.green(c) - MEAN_G)
      input.putFloat(Color.red(c) - MEAN_R)
    }
    input.rewind()
    val output = Array(1) { FloatArray(2) }
    model().run(input, output)
    return output[0][1] // [sfw, nsfw]
  }

  // ---- Decoding --------------------------------------------------------------

  private fun decodeImage(uri: String): Bitmap? {
    val u = Uri.parse(uri)
    val resolver = reactContext.contentResolver
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    resolver.openInputStream(u)?.use { BitmapFactory.decodeStream(it, null, bounds) }
    if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null
    var sample = 1
    while (minOf(bounds.outWidth, bounds.outHeight) / (sample * 2) >= RESIZE) sample *= 2
    val opts = BitmapFactory.Options().apply {
      inSampleSize = sample
      inPreferredConfig = Bitmap.Config.ARGB_8888
    }
    return resolver.openInputStream(u)?.use { BitmapFactory.decodeStream(it, null, opts) }
  }

  private fun videoFrames(uri: String, count: Int): List<Bitmap> {
    val mmr = MediaMetadataRetriever()
    try {
      val u = Uri.parse(uri)
      if (u.scheme == "file") mmr.setDataSource(u.path) else mmr.setDataSource(reactContext, u)
      val durationMs = mmr.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull() ?: 0L
      val times = if (durationMs <= 0) listOf(0L) else (0 until count).map { i -> durationMs * 1000 * (2 * i + 1) / (2 * count) }
      return times.mapNotNull { us ->
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
          mmr.getScaledFrameAtTime(us, MediaMetadataRetriever.OPTION_CLOSEST_SYNC, RESIZE * 2, RESIZE * 2)
        } else {
          mmr.getFrameAtTime(us, MediaMetadataRetriever.OPTION_CLOSEST_SYNC)
        }
      }
    } finally {
      mmr.release()
    }
  }

  companion object {
    const val NAME = "ContentSafety"
    private const val MODEL = "open_nsfw.tflite"
    private const val RESIZE = 256
    private const val INPUT = 224
    private const val MEAN_B = 103.939f
    private const val MEAN_G = 116.779f
    private const val MEAN_R = 123.68f
  }
}
