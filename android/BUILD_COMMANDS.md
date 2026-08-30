# Karvin release builds

```bash
cd android

# ساخت کلید انتشار واقعی (فقط یک‌بار؛ فایل را خارج از repository نگه دارید)
keytool -genkeypair -v -keystore "$HOME/.karvin/karvin-release.jks" \
  -alias karvin-release -keyalg RSA -keysize 4096 -validity 10000

# مقادیر امن را در ~/.gradle/gradle.properties یا CI Secret قرار دهید:
# KARVIN_RELEASE_STORE_FILE=/absolute/path/karvin-release.jks
# KARVIN_RELEASE_STORE_PASSWORD=...
# KARVIN_RELEASE_KEY_ALIAS=karvin-release
# KARVIN_RELEASE_KEY_PASSWORD=...
# MAPS_API_KEY=...

./gradlew :app:clean :app:bundleRelease
./gradlew :app:assembleRelease

# خروجی‌ها
# app/build/outputs/bundle/release/app-release.aab
# app/build/outputs/apk/release/app-release.apk
```

> کلید release را commit نکنید. برای انتشار Google Play، AAB را استفاده کنید.
