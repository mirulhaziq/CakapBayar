# Voice to Database Flow - Complete Explanation

## 🎤 How Voice Data Flows Through CakapBayar

This document explains the complete journey from voice recording to database storage.

---

## 📊 Complete Data Flow Diagram

```
1. USER SPEAKS
   ↓
2. MediaRecorder captures audio (WebM format)
   ↓
3. Audio chunks stored in memory (audioChunksRef)
   ↓
4. On stop: Chunks combined into Blob
   ↓
5. Blob sent to /api/transcribe (FormData)
   ↓
6. OpenAI Whisper converts audio → text
   ↓
7. Text sent to /api/parse-order (JSON)
   ↓
8. Claude AI parses text → structured order
   ↓
9. Order stored in React state (orderItems)
   ↓
10. User clicks "Confirm"
    ↓
11. Order sent to PaymentScreen
    ↓
12. User completes payment
    ↓
13. PaymentScreen calls Convex mutation
    ↓
14. Order saved to Convex database (transactions table)
```

---

## 🔍 Detailed Step-by-Step Breakdown

### **STEP 1: Voice Capture (Browser)**
**Location:** `components/OrderingScreen.jsx` - `startRecording()`

```javascript
// User clicks microphone button
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'audio/webm'  // WebM audio format
});
```

**What happens:**
- Browser requests microphone permission
- Creates MediaStream from microphone
- MediaRecorder captures audio in real-time
- Audio is encoded as WebM format (compressed audio)

**Data format:** Raw audio stream → WebM encoded chunks

---

### **STEP 2: Audio Chunk Collection**
**Location:** `components/OrderingScreen.jsx` - `ondataavailable` event

```javascript
mediaRecorder.ondataavailable = (event) => {
  if (event.data.size > 0) {
    audioChunksRef.current.push(event.data);  // Store chunks in array
  }
};
```

**What happens:**
- MediaRecorder periodically fires `ondataavailable` events
- Each event contains a chunk of audio data (Blob)
- Chunks are stored in `audioChunksRef.current` array
- This happens continuously while recording

**Data format:** Array of Blob objects (WebM audio chunks)

---

### **STEP 3: Stop Recording & Create Blob**
**Location:** `components/OrderingScreen.jsx` - `onstop` event

```javascript
mediaRecorder.onstop = async () => {
  const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
  await processAudio(audioBlob);
};
```

**What happens:**
- User clicks stop button
- MediaRecorder stops and fires `onstop` event
- All audio chunks are combined into a single Blob
- Blob represents the complete audio recording

**Data format:** Single Blob object containing complete WebM audio file

**Size example:** ~50-200 KB for 5-10 seconds of speech

---

### **STEP 4: Send to Transcription API**
**Location:** `components/OrderingScreen.jsx` - `processAudio()`

```javascript
const formData = new FormData();
formData.append('file', audioBlob, 'audio.webm');

const transcribeResponse = await fetch('/api/transcribe', {
  method: 'POST',
  body: formData,  // Multipart form data
});
```

**What happens:**
- Blob is wrapped in FormData (for file upload)
- Sent via HTTP POST to `/api/transcribe`
- This is a Next.js API route (server-side)

**Data format:** HTTP multipart/form-data request

---

### **STEP 5: Server Receives & Processes**
**Location:** `app/api/transcribe/route.js`

```javascript
const formData = await request.formData();
const audioFile = formData.get('file');
const file = new File([audioFile], 'audio.webm', { type: 'audio/webm' });
```

**What happens:**
- Server extracts file from FormData
- Converts to File object
- File is ready to send to OpenAI

**Data format:** File object (WebM audio)

---

### **STEP 6: OpenAI Whisper Transcription**
**Location:** `app/api/transcribe/route.js`

```javascript
const transcription = await openai.audio.transcriptions.create({
  file: file,
  model: 'whisper-1',
  language: 'ms',  // Malay language
  response_format: 'json',
});
```

**What happens:**
- OpenAI Whisper AI model receives audio file
- Model converts audio → text using speech recognition
- Returns JSON with transcribed text
- Supports Malay and English (code-switching)

**Data format:** JSON response: `{ text: "saya nak dua teh tarik" }`

**Example output:** 
- Input: Audio saying "saya nak dua teh tarik"
- Output: `{ text: "saya nak dua teh tarik" }`

---

### **STEP 7: Send Transcript to Order Parser**
**Location:** `components/OrderingScreen.jsx` - `processAudio()`

```javascript
const parseResponse = await fetch('/api/parse-order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    transcript: text,  // "saya nak dua teh tarik"
    menuItems: menuItems,  // Array from Convex
  }),
});
```

**What happens:**
- Transcribed text sent to `/api/parse-order`
- Also sends menu items from Convex (for matching)
- This is JSON data, not a file

**Data format:** JSON request body

---

### **STEP 8: Claude AI Parses Order**
**Location:** `app/api/parse-order/route.js`

```javascript
const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  messages: [{
    role: 'user',
    content: `You are a Malaysian food stall order processing AI...
    CUSTOMER SAID: "${transcript}"
    Extract order items...`
  }]
});
```

**What happens:**
- Claude AI receives transcript and menu items
- Uses natural language understanding to extract:
  - Item names (fuzzy matching with aliases)
  - Quantities (handles Malay numbers: satu, dua, etc.)
  - Prices (from menu)
- Returns structured JSON order

**Data format:** JSON response

**Example:**
- Input: `"saya nak dua teh tarik"`
- Output: 
```json
{
  "items": [
    { "name": "Teh Tarik", "quantity": 2, "price": 2.50 }
  ],
  "total": 5.00
}
```

---

### **STEP 9: Store in React State (Temporary)**
**Location:** `components/OrderingScreen.jsx` - `processAudio()`

```javascript
setOrderItems(prev => [...prev, ...parsedOrder.items]);
setTotal(prev => prev + newTotal);
```

**What happens:**
- Parsed order items stored in React component state
- Items displayed in UI
- **NOT YET IN DATABASE** - just in browser memory
- User can add more items or confirm

**Data format:** React state (JavaScript objects in memory)

**Example state:**
```javascript
orderItems: [
  { name: "Teh Tarik", quantity: 2, price: 2.50 }
]
total: 5.00
```

---

### **STEP 10: User Confirms Order**
**Location:** `components/OrderingScreen.jsx` - Confirm button

```javascript
onConfirm({
  items: orderItems,
  total: calculatedTotal,
  transcript: transcript,
});
```

**What happens:**
- User clicks "Confirm" button
- Order data passed to parent component (`app/page.js`)
- Screen transitions to payment screen

**Data format:** JavaScript object passed as prop

---

### **STEP 11: Payment Screen**
**Location:** `components/PaymentScreen.jsx`

**What happens:**
- User selects payment method
- User confirms payment
- PaymentScreen has access to order data

**Data format:** React props (order object)

---

### **STEP 12: Save to Database**
**Location:** `components/PaymentScreen.jsx` - `handleConfirmPayment()`

```javascript
const createTransaction = useMutation(api.transactions.create);

await createTransaction({
  items: order.items.map(item => ({
    name: item.name,
    quantity: item.quantity,
    price: item.price,
  })),
  total: order.total,
  paymentMethod: selectedPaymentMethod,
});
```

**What happens:**
- Convex mutation called
- Data sent to Convex backend
- Saved to `transactions` table in database

**Data format:** Convex mutation call

---

### **STEP 13: Convex Database Storage**
**Location:** `convex/transactions.js`

```javascript
await ctx.db.insert("transactions", {
  items: args.items,
  total: args.total,
  paymentMethod: args.paymentMethod,
  completedAt: Date.now(),
});
```

**What happens:**
- Convex receives mutation
- Data inserted into `transactions` table
- Transaction permanently stored

**Data format:** Database record in Convex

**Final database record:**
```javascript
{
  _id: "abc123...",
  items: [
    { name: "Teh Tarik", quantity: 2, price: 2.50 }
  ],
  total: 5.00,
  paymentMethod: "cash",
  completedAt: 1704067200000
}
```

---

## 🔧 Troubleshooting the Current Error

Based on the error at `processAudio`, here's what to check:

### **Common Issues:**

1. **API Key Missing**
   - Check `.env.local` has `OPENAI_API_KEY=sk-...`
   - Restart dev server after adding

2. **Empty Audio Blob**
   - Recording might be too short
   - Check `audioBlob.size` in console

3. **Network Error**
   - Check browser console for fetch errors
   - Verify API routes are accessible

4. **Response Parsing Error**
   - Check if response is actually JSON
   - Look at Network tab in DevTools

### **Debug Steps:**

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for the detailed logs we added (🎤, 📦, etc.)
4. Check Network tab to see API requests
5. Look for red error messages

The enhanced logging will show exactly where the process fails!

---

## 📝 Summary

**Voice → Text:** MediaRecorder → Blob → OpenAI Whisper → Text
**Text → Order:** Claude AI → Structured JSON → React State
**Order → Database:** User confirms → Payment → Convex Mutation → Database

The error is likely happening in Steps 4-6 (transcription API call). Check the console logs to see exactly where!

