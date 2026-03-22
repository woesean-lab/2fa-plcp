# 2FA PLCP

React + Vite ile hazirlanmis, URL'deki `?2fa=` parametresinden TOTP kodu ureten uygulama.

## Lokal calistirma

```bash
npm install
npm run dev
```

Ornek:

```text
http://localhost:5173/?2fa=5VJG3DHWNSPS4WTJ
```

## EasyPanel deploy

Bu repo, EasyPanel'de `App` servisi olarak deploy edilmeye hazir.

### Neden hazir?

- Repo icinde `Dockerfile` var.
- Build sonrasi statik dosyalar Nginx ile servis ediliyor.
- Container ic portu `80`.
- `nginx.conf` icinde `try_files` tanimli oldugu icin SPA davranisi korunuyor.

### EasyPanel ayarlari

1. Projeyi GitHub'a push edin.
2. EasyPanel'de yeni bir `App` service olusturun.
3. Source olarak GitHub repository secin.
4. Tercihen builder olarak `Dockerfile` kullanin.
5. Domain ekleyin.
6. `Dockerfile` builder kullaniyorsaniz `Proxy Port` degerini `80` yapin.
7. Nixpacks builder kullaniyorsaniz uygulama `PORT` degiskeninden dinler.
8. Deploy edin.

### Notlar

- Bu proje icin environment variable gerekmiyor.
- Nixpacks kullanilacaksa `package.json` icindeki `engines.node` nedeniyle Node 22 secilir.
- Query parametreleri aynen calisir:

```text
https://alanadiniz.com/?2fa=5VJG3DHWNSPS4WTJ
```
