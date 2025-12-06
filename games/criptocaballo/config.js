// ============================================
// CONFIGURACIÓN - CRIPTOCABALLO (PRODUCCIÓN)
// ============================================
// Este archivo SÍ se sube a GitHub para deployment en Vercel
// Las credenciales de Supabase Anon Key son seguras de compartir públicamente
// Última actualización: 2025-12-06

const CRYPTO_CONFIG = {
    supabase: {
        url: "https://eyuuujpwvgmpajrjhnah.supabase.co",
        anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5dXV1anB3dmdtcGFqcmpobmFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNzExMDQsImV4cCI6MjA3Nzk0NzEwNH0.fwhYo71ptf_thgmK7q_eSRZLUh4LqQq47uiLf8jykmM"
    },
    admin: {
        password: "C_michigaN_77889900"  // Password para acceso de admin
    }
};

// Exportar para uso en los HTML
if (typeof window !== 'undefined') {
    window.CRYPTO_CONFIG = CRYPTO_CONFIG;
}
