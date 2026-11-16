package com.dblockeok.sms

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.google.android.gms.common.api.CommonStatusCodes
import com.google.android.gms.common.api.Status

/**
 * Reads ONE incoming SMS after the user taps "Allow" (Google SMS User Consent API).
 * No READ_SMS permission, no app hash in the message. Listens for up to 5 minutes
 * after start(). The message text is emitted to JS as "SmsConsentMessage"; JS
 * extracts the code. Nothing is stored here.
 */
class SmsConsentModule(private val ctx: ReactApplicationContext) :
  ReactContextBaseJavaModule(ctx), ActivityEventListener {

  private var receiver: BroadcastReceiver? = null

  init {
    ctx.addActivityEventListener(this)
  }

  override fun getName() = NAME

  @ReactMethod
  fun start(promise: Promise) {
    try {
      val activity = ctx.currentActivity ?: return promise.resolve(false)
      SmsRetriever.getClient(activity).startSmsUserConsent(null)
      if (receiver == null) {
        val r = object : BroadcastReceiver() {
          @Suppress("DEPRECATION")
          override fun onReceive(context: Context, intent: Intent) {
            if (intent.action != SmsRetriever.SMS_RETRIEVED_ACTION) return
            val extras = intent.extras ?: return
            val status = getStatus(extras.get(SmsRetriever.EXTRA_STATUS)) ?: return
            if (status.statusCode != CommonStatusCodes.SUCCESS) return
            val consent = getConsentIntent(extras.get(SmsRetriever.EXTRA_CONSENT_INTENT)) ?: return
            // Only launch the consent screen if it belongs to Google Play services.
            val target = consent.resolveActivity(context.packageManager)
            if (target == null || target.packageName != "com.google.android.gms") return
            ctx.currentActivity?.startActivityForResult(consent, REQUEST_CODE)
          }
        }
        ContextCompat.registerReceiver(
          ctx,
          r,
          IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION),
          SmsRetriever.SEND_PERMISSION,
          null,
          ContextCompat.RECEIVER_EXPORTED,
        )
        receiver = r
      }
      promise.resolve(true)
    } catch (e: Exception) {
      // e.g. Google Play services missing — the user can still type the code.
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun stop() {
    receiver?.let {
      try {
        ctx.unregisterReceiver(it)
      } catch (_: Exception) {
      }
    }
    receiver = null
  }

  // Required by NativeEventEmitter on the JS side.
  @ReactMethod fun addListener(eventName: String) {}
  @ReactMethod fun removeListeners(count: Double) {}

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode != REQUEST_CODE) return
    val message = if (resultCode == Activity.RESULT_OK) data?.getStringExtra(SmsRetriever.EXTRA_SMS_MESSAGE) else null
    if (message != null) {
      ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(EVENT, message)
    }
  }

  override fun onNewIntent(intent: Intent) {}

  override fun invalidate() {
    stop()
    ctx.removeActivityEventListener(this)
    super.invalidate()
  }

  private fun getStatus(v: Any?): Status? = v as? Status

  private fun getConsentIntent(v: Any?): Intent? = v as? Intent

  companion object {
    const val NAME = "SmsConsent"
    const val EVENT = "SmsConsentMessage"
    private const val REQUEST_CODE = 0x5C0D
  }
}
