package com.bobeauf.rsdeur

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale

class RsdEurWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        val pending = goAsync()
        Thread {
            try {
                val (rate, date) = fetchRate()
                appWidgetIds.forEach { id ->
                    render(context, appWidgetManager, id, rate, date, offline = false)
                }
            } catch (e: Exception) {
                appWidgetIds.forEach { id ->
                    render(context, appWidgetManager, id, 1.0 / 117.5, null, offline = true)
                }
            } finally {
                pending.finish()
            }
        }.start()
    }

    private fun fetchRate(): Pair<Double, String> {
        val conn = URL("https://api.frankfurter.app/latest?from=RSD&to=EUR")
            .openConnection() as HttpURLConnection
        conn.connectTimeout = 7_000
        conn.readTimeout = 7_000
        val body = conn.inputStream.bufferedReader().readText()
        conn.disconnect()
        val json = JSONObject(body)
        return json.getJSONObject("rates").getDouble("EUR") to json.getString("date")
    }

    private fun render(
        context: Context,
        manager: AppWidgetManager,
        id: Int,
        rate: Double,
        date: String?,
        offline: Boolean
    ) {
        val views = RemoteViews(context.packageName, R.layout.widget_layout)

        views.setTextViewText(R.id.tv_flags, "🇷🇸  ›  🇪🇺")
        views.setTextViewText(R.id.tv_rsd, "1 000 RSD")
        views.setTextViewText(R.id.tv_eur, String.format(Locale.US, "%.2f €", 1_000 * rate))
        views.setTextViewText(R.id.tv_rate, String.format(Locale.US, "1 RSD = %.5f €", rate))
        views.setTextViewText(
            R.id.tv_date,
            if (offline) "⚡ taux estimé" else "BCE · ${date.orEmpty()}"
        )

        val intent = Intent(context, RsdEurWidget::class.java).apply {
            action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, intArrayOf(id))
        }
        views.setOnClickPendingIntent(
            R.id.widget_root,
            PendingIntent.getBroadcast(
                context, id, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        )
        manager.updateAppWidget(id, views)
    }
}
