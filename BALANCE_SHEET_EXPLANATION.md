# Lembaran Imbangan (Balance Sheet) - Penjelasan Mudah

## Apa itu Lembaran Imbangan?

Lembaran Imbangan adalah laporan kewangan yang menunjukkan **kedudukan kewangan perniagaan anda pada satu tarikh tertentu** (contoh: akhir bulan).

Ia menjawab soalan:
- **Apa yang anda miliki?** (Aset)
- **Apa yang anda hutang?** (Liabiliti)
- **Berapa nilai pemilikan anda?** (Ekuiti)

---

## Formula Asas (Mesti Seimbang!)

```
ASET = LIABILITI + EKUITI
```

**Ini MESTI sentiasa seimbang!** Jika tidak, ada ralat dalam pengiraan.

---

## Bahagian 1: ASET (Assets) - Apa Yang Anda Miliki

**Aset** adalah semua benda bernilai yang dimiliki oleh perniagaan anda.

### Aset Semasa (Current Assets) - Boleh ditukar kepada tunai dengan cepat:

1. **Tunai (Cash)**
   - Wang tunai yang ada dalam peti tunai
   - Diambil dari shift terakhir yang ditutup (closing cash)
   - Contoh: RM 500.00

2. **Akaun Belum Terima (Accounts Receivable)**
   - Wang yang pelanggan masih hutang kepada anda
   - Untuk perniagaan tunai (seperti warung), biasanya RM 0.00
   - Contoh: Jika anda jual secara kredit, ini adalah jumlah yang pelanggan belum bayar

3. **Inventori (Inventory)**
   - Nilai stok barang yang belum dijual
   - Contoh: Nilai bahan mentah yang ada di stor
   - **Nota**: Untuk sistem ini, inventori tidak dikira (kos tinggi untuk implementasi)

**Jumlah Aset Semasa** = Tunai + Akaun Belum Terima + Inventori

### Aset Bukan Semasa (Non-Current Assets) - Tidak mudah ditukar kepada tunai:

- **Peralatan (Equipment)**: Nilai peralatan seperti peti sejuk, mesin, dll
- **Harta (Property)**: Jika anda memiliki bangunan/tanah

**Jumlah Aset** = Aset Semasa + Aset Bukan Semasa

---

## Bahagian 2: LIABILITI (Liabilities) - Apa Yang Anda Hutang

**Liabiliti** adalah semua hutang yang perlu dibayar oleh perniagaan anda.

### Liabiliti Semasa (Current Liabilities) - Perlu dibayar dalam masa singkat:

1. **Akaun Belum Bayar (Accounts Payable)**
   - Wang yang anda hutang kepada pembekal
   - Contoh: Anda beli bahan mentah secara kredit, belum bayar lagi
   - **Nota**: Untuk sistem ini, biasanya RM 0.00 (jika semua bayar tunai)

2. **Pinjaman Jangka Pendek (Short-term Loans)**
   - Pinjaman yang perlu dibayar dalam tempoh pendek (< 1 tahun)

**Jumlah Liabiliti Semasa** = Akaun Belum Bayar + Pinjaman Jangka Pendek

### Liabiliti Bukan Semasa (Non-Current Liabilities) - Hutang jangka panjang:

- **Pinjaman Jangka Panjang**: Pinjaman bank yang perlu dibayar dalam tempoh panjang (> 1 tahun)

**Jumlah Liabiliti** = Liabiliti Semasa + Liabiliti Bukan Semasa

---

## Bahagian 3: EKUITI (Equity) - Nilai Pemilikan Anda

**Ekuiti** menunjukkan berapa banyak nilai yang anda miliki dalam perniagaan.

### Komponen Ekuiti:

1. **Modal Permulaan (Opening Capital)**
   - Wang yang anda laburkan pada mulanya untuk memulakan perniagaan
   - Diambil dari shift pertama yang dibuka (opening cash)
   - Contoh: RM 1,000.00 (modal awal anda)

2. **Pendapatan Tertahan (Retained Earnings)**
   - **Ini adalah keuntungan terkumpul sejak perniagaan bermula**
   - Bukan hanya keuntungan bulan ini, tetapi SEMUA keuntungan dari mula sampai sekarang
   - Dikira sebagai: (Jumlah Jualan Semua Masa) - (Jumlah Perbelanjaan Semua Masa)
   - Contoh: Jika anda jual RM 10,000 dan belanja RM 7,000 sejak mula, pendapatan tertahan = RM 3,000

**Jumlah Ekuiti** = Modal Permulaan + Pendapatan Tertahan

---

## Contoh Lembaran Imbangan (Sederhana)

```
LEMBARAN IMBANGAN
As of 31 Disember 2024

═══════════════════════════════════════════════════

ASET (ASSETS)
─────────────────────────────────────────────────
Aset Semasa (Current Assets)
  Tunai                          RM  500.00
  Akaun Belum Terima             RM    0.00
  Inventori                      RM    0.00
  ───────────────────────────────────────────────
  Jumlah Aset Semasa             RM  500.00

Aset Bukan Semasa
  Peralatan                      RM    0.00
  ───────────────────────────────────────────────
  Jumlah Aset Bukan Semasa       RM    0.00
─────────────────────────────────────────────────
JUMLAH ASET                      RM  500.00

═══════════════════════════════════════════════════

LIABILITI & EKUITI
─────────────────────────────────────────────────
Liabiliti Semasa (Current Liabilities)
  Akaun Belum Bayar              RM    0.00
  Pinjaman Jangka Pendek         RM    0.00
  ───────────────────────────────────────────────
  Jumlah Liabiliti Semasa        RM    0.00

Liabiliti Bukan Semasa
  Pinjaman Jangka Panjang        RM    0.00
  ───────────────────────────────────────────────
  Jumlah Liabiliti Bukan Semasa RM    0.00
─────────────────────────────────────────────────
JUMLAH LIABILITI                 RM    0.00

Ekuiti (Equity)
  Modal Permulaan                RM 1,000.00
  Pendapatan Tertahan           RM -500.00  (rugi terkumpul)
  ───────────────────────────────────────────────
  Jumlah Ekuiti                  RM  500.00
─────────────────────────────────────────────────
JUMLAH LIABILITI & EKUITI        RM  500.00

═══════════════════════════════════════════════════

✅ LEMBARAN IMBANGAN SEIMBANG
   (Assets RM 500 = Liabilities RM 0 + Equity RM 500)
```

---

## Perbezaan: Balance Sheet vs Income Statement

### Lembaran Imbangan (Balance Sheet)
- **Masa**: Snapshot pada satu tarikh tertentu (contoh: akhir bulan)
- **Skop**: Semua aset, liabiliti, dan ekuiti (kumulatif)
- **Tujuan**: Tunjukkan kedudukan kewangan pada masa itu
- **Contoh**: "Pada 31 Dis, saya ada RM 500 tunai, modal RM 1,000, keuntungan terkumpul RM -500"

### Penyata Pendapatan (Income Statement)
- **Masa**: Tempoh tertentu (contoh: bulan Disember)
- **Skop**: Jualan dan perbelanjaan untuk tempoh tersebut sahaja
- **Tujuan**: Tunjukkan untung/rugi untuk tempoh tersebut
- **Contoh**: "Bulan Disember, saya jual RM 2,000, belanja RM 1,500, untung RM 500"

**Perbezaan Utama**:
- **Balance Sheet** = "Berapa banyak saya ada SEKARANG?" (kumulatif)
- **Income Statement** = "Berapa banyak saya untung bulan INI?" (tempoh tertentu)

---

## Bagaimana Sistem Mengira Setiap Item

### 1. Tunai (Cash)
```
Tunai = Closing Cash dari shift terakhir yang ditutup
ATAU
Tunai = Expected Cash dari shift aktif (jika belum ada shift ditutup)
```

**Contoh**: Shift terakhir ditutup dengan closing cash RM 500 → Tunai = RM 500

### 2. Modal Permulaan (Opening Capital)
```
Modal Permulaan = Opening Cash dari shift pertama yang dibuka
```

**Contoh**: Shift pertama dibuka dengan opening cash RM 1,000 → Modal Permulaan = RM 1,000

### 3. Pendapatan Tertahan (Retained Earnings)
```
Pendapatan Tertahan = (Jumlah Jualan SEMUA MASA) - (Jumlah Perbelanjaan SEMUA MASA)
```

**Contoh**: 
- Jualan semua masa: RM 10,000
- Perbelanjaan semua masa: RM 7,000
- Pendapatan Tertahan = RM 10,000 - RM 7,000 = RM 3,000

**PENTING**: Ini bukan keuntungan bulan ini sahaja, tetapi keuntungan terkumpul sejak mula!

### 4. Ekuiti (Equity)
```
Ekuiti = Modal Permulaan + Pendapatan Tertahan
```

**Contoh**: 
- Modal Permulaan: RM 1,000
- Pendapatan Tertahan: RM 3,000
- Ekuiti = RM 1,000 + RM 3,000 = RM 4,000

---

## Mengapa Lembaran Imbangan Mesti Seimbang?

Formula asas:
```
ASET = LIABILITI + EKUITI
```

**Mengapa?** Kerana semua aset anda datang dari dua sumber:
1. **Wang yang anda pinjam** (Liabiliti)
2. **Wang yang anda laburkan + keuntungan** (Ekuiti)

**Contoh**:
- Anda ada RM 500 tunai (Aset)
- Anda tidak hutang apa-apa (Liabiliti = RM 0)
- Anda laburkan RM 1,000 dan untung RM -500 (Ekuiti = RM 500)
- **RM 500 = RM 0 + RM 500** ✅ Seimbang!

Jika tidak seimbang, ada ralat dalam pengiraan atau data hilang.

---

## Soalan Lazim (FAQ)

### Q1: Mengapa Pendapatan Tertahan negatif?
**A**: Ini bermakna perniagaan anda mengalami kerugian terkumpul. Contoh: Modal RM 1,000, tetapi jualan RM 500, perbelanjaan RM 1,200 → Pendapatan Tertahan = RM 500 - RM 1,200 = -RM 700 (rugi).

### Q2: Mengapa Tunai tidak sama dengan Jualan Bulan Ini?
**A**: Tunai adalah baki tunai sebenar dalam peti (dari shift). Jualan bulan ini mungkin termasuk jualan kad/e-wallet yang tidak masuk ke peti tunai. Juga, tunai mungkin digunakan untuk belanja.

### Q3: Bolehkah saya tambah inventori?
**A**: Ya, tetapi memerlukan sistem untuk mengira nilai stok. Untuk sekarang, inventori = RM 0 (tidak dikira).

### Q4: Bagaimana jika saya ada pinjaman?
**A**: Pinjaman akan muncul di bawah Liabiliti. Contoh: Pinjaman RM 5,000 → Liabiliti Semasa = RM 5,000.

### Q5: Mengapa Ekuiti tidak sama dengan Tunai?
**A**: Ekuiti = Modal + Keuntungan Terkumpul. Tunai mungkin sudah digunakan untuk belanja atau pelaburan. Ekuiti menunjukkan nilai pemilikan, bukan tunai yang ada.

---

## Kesimpulan

Lembaran Imbangan membantu anda:
1. ✅ Tahu berapa banyak aset yang anda miliki
2. ✅ Tahu berapa banyak hutang yang perlu dibayar
3. ✅ Tahu nilai pemilikan anda dalam perniagaan
4. ✅ Pastikan pengiraan kewangan betul (mesti seimbang!)

**Ingat**: 
- **Aset** = Apa yang anda miliki
- **Liabiliti** = Apa yang anda hutang
- **Ekuiti** = Nilai pemilikan anda
- **Mesti seimbang**: Aset = Liabiliti + Ekuiti

---

*Dokumen ini dibuat untuk membantu micro entrepreneur memahami lembaran imbangan dengan mudah.*
