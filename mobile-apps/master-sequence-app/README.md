# 📱 Master Sequence - Android App

Aplicación móvil Android de Master Sequence creada con Capacitor.

## 🚀 Estado Actual

✅ Proyecto Capacitor inicializado
✅ Código de Master Sequence copiado
✅ Dependencias compartidas (js, css, assets) incluidas
✅ Rutas ajustadas para móvil
✅ API configurada para apuntar a producción (Vercel)
✅ Plataforma Android agregada
✅ **Android Studio instalado y configurado**
✅ **Variables de entorno configuradas (ANDROID_HOME, JAVA_HOME)**
✅ **gradle.properties configurado (AndroidX + Jetifier)**
✅ **App compilando y ejecutándose exitosamente en emulador**

**🎉 LA APP ESTÁ FUNCIONAL Y LISTA PARA PUBLICACIÓN**

## 📋 Estrategia de Desarrollo

**Estado:** App móvil **pausada** hasta perfeccionar versión web.

**Razón:** Es más eficiente iterar y pulir Master Sequence en la web primero:
- Desarrollo más rápido (edit → refresh)
- Testing más fácil
- Feedback de usuarios inmediato
- Cuando la web esté perfecta → publicar en Play Store será trivial

**Pendiente para publicación:**
- [ ] Perfeccionar versión web de Master Sequence
- [ ] Crear iconos personalizados (1024x1024)
- [ ] Crear splash screens
- [ ] Optimizar para móvil (CSS, botones táctiles)
- [ ] Pagar Google Play Developer Account ($25 USD)
- [ ] Generar keystore y AAB firmado
- [ ] Completar Google Play Console
- [ ] Publicar en Play Store

## 📋 Cómo Retomar el Desarrollo Móvil

Cuando estés listo para publicar:

### 1. Instalar Android Studio

1. Descargar de: https://developer.android.com/studio
2. Instalar con configuración "Standard"
3. Esperar que descargue Android SDK (~2-3 GB)
4. Configurar variables de entorno (ver guía completa en `/docs/MASTER_SEQUENCE_ANDROID_APP.md`)

### 2. Ejecutar en Emulador

```bash
# Sincronizar archivos web con Android
npx cap sync android

# Abrir en Android Studio
npx cap open android

# O ejecutar directamente
npx cap run android
```

### 3. Generar APK de Prueba

```bash
cd android
./gradlew assembleDebug

# El APK estará en:
# android/app/build/outputs/apk/debug/app-debug.apk
```

Puedes instalar este APK en tu teléfono para probarlo antes de pagar Google Play Developer.

## 📁 Estructura del Proyecto

```
master-sequence-app/
├── www/                    # Código web del juego
│   ├── index.html         # HTML principal
│   ├── game.js            # Lógica del juego
│   ├── styles.css         # Estilos
│   ├── js/                # Scripts compartidos (leaderboard)
│   ├── css/               # Estilos compartidos
│   └── assets/            # Imágenes, fuentes, etc
├── android/               # Proyecto Android nativo (generado)
├── capacitor.config.json  # Configuración de Capacitor
├── package.json           # Dependencias Node.js
└── README.md             # Este archivo
```

## 🔧 Configuración

### API Backend

La app está configurada para usar el backend de producción en Vercel:
- **URL:** `https://chessarcade.vercel.app/api/scores`
- **Detección:** Automática vía `Capacitor` object
- **Archivo:** `www/js/leaderboard-api.js:43`

### Identificación de la App

- **App Name:** Master Sequence
- **App ID:** `ar.com.chessarcade.mastersequence`
- **Version:** 1.0.0

## 📖 Documentación Completa

Ver la guía completa paso a paso en:
**`/docs/MASTER_SEQUENCE_ANDROID_APP.md`**

Incluye:
- Instalación de Android Studio
- Configuración del entorno
- Creación de iconos y assets
- Generación de APK/AAB firmado
- Publicación en Google Play Store
- Costos y tiempos estimados

## ⚠️ Requisitos

- **Node.js:** v18+ ✅ (instalado: v22.21.1)
- **npm:** v9+ ✅ (instalado: v10.9.4)
- **Android Studio:** ✅ Instalado y configurado
- **ANDROID_HOME:** ✅ Configurado
- **JAVA_HOME:** ✅ Configurado
- **Espacio en disco:** ~20 GB ✅

## 🎯 Próximo Milestone

**Perfeccionar Master Sequence en la web** → Luego publicar versión móvil en Google Play Store.

Cuando retomes el desarrollo móvil:
```bash
# Actualizar código web en la app
npx cap sync android

# Abrir en Android Studio
npx cap open android

# Ejecutar en emulador
# Click en Play ▶️ en Android Studio
```

---

**Creado:** 2025-11-14
**Última actualización:** 2025-11-15
**Estado:** ✅ App funcional - Pausada hasta perfeccionar versión web
**Branch:** `claude/android-app-master-sequence-011CV2NZwWwME4ac4jRR8AJZ`
