# SIBIMO Admin

Dashboard administrasi **SIBIMO (Sistem Informasi Kelurahan Bimomartani)** yang dibangun menggunakan **Vue.js**.

Repository ini menyediakan antarmuka bagi administrator dan perangkat kelurahan untuk mengelola konten website, memproses layanan surat warga, serta mengelola data master melalui REST API yang disediakan oleh **SIBIMO Backend**.

---

## Tentang Proyek

SIBIMO Admin merupakan aplikasi internal yang digunakan oleh administrator dan perangkat Kelurahan Bimomartani.

Melalui aplikasi ini, petugas dapat mengelola seluruh data yang berkaitan dengan pelayanan administrasi dan website kelurahan tanpa harus berinteraksi langsung dengan database.

Repository ini hanya berisi **Frontend Dashboard** dan seluruh data diperoleh melalui REST API dari repository **SIBIMO Backend**.

---

## Arsitektur Sistem

```text
                     +----------------------+
                     |    SIBIMO Backend    |
                     |   Laravel REST API   |
                     +----------+-----------+
                                ▲
                                │
                        REST API │
                                │
                     +----------+-----------+
                     |     SIBIMO Admin     |
                     |        Vue.js        |
                     |                      |
                     | Dashboard Admin      |
                     | CMS                  |
                     | Layanan Surat        |
                     | Master Data          |
                     +----------------------+
```

---

## Repository Ekosistem

| Repository        | Deskripsi                                        |
| ----------------- | ------------------------------------------------ |
| **sibimo**        | Backend REST API menggunakan Laravel             |
| **sibimo-admin**  | Dashboard administrasi berbasis Vue.js           |
| **sibimo-public** | Website publik dan layanan surat berbasis Vue.js |

---

## Tech Stack

### Frontend

* Vue 3
* JavaScript
* Vite
* PrimeVue
* Tailwind CSS
* Vue Router
* Pinia
* Axios

### Development

* Node.js
* npm
* ESLint
* Git

---

## Integrasi

Aplikasi ini berkomunikasi dengan **SIBIMO Backend** menggunakan REST API.

Seluruh proses autentikasi, manajemen data, dan layanan surat dilakukan melalui API sehingga dashboard hanya berfokus pada penyajian antarmuka pengguna.

---

## License

Copyright © Dejico ID.
