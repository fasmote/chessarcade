// ============================================
// CONFIGURACIÓN - CRIPTOCABALLO
// ============================================
// INSTRUCCIONES:
// 1. Copia este archivo a /.private/criptocaballo-config.js
// 2. Completa las credenciales reales
// 3. El archivo .private/ NO se sube a GitHub

const CRYPTO_CONFIG = {
    supabase: {
        url: "TU_SUPABASE_URL_AQUI",  // Ej: https://xxxxx.supabase.co
        anonKey: "TU_SUPABASE_ANON_KEY_AQUI"  // Ej: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    },
    admin: {
        password: "cambiar-este-password-123"  // Cambia esto por tu password seguro
    }
};

// Para desarrollo local, puedes cargar desde aquí
if (typeof window !== 'undefined') {
    window.CRYPTO_CONFIG = CRYPTO_CONFIG;
}
