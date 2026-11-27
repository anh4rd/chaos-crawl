interface PendingCredential {
  code: string;
  key: CryptoKey;
  iv: Uint8Array<ArrayBuffer>;
  ciphertext: ArrayBuffer;
}

function openVault(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("chaos-crawl-recovery-pending", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("pending", { keyPath: "code" });
    request.onerror = () =>
      reject(new Error("Secure recovery storage is unavailable."));
    request.onsuccess = () => resolve(request.result);
    request.onblocked = () =>
      reject(new Error("Secure recovery storage is blocked."));
  });
}

async function readPending(
  code: string,
): Promise<PendingCredential | undefined> {
  const db = await openVault();
  try {
    return await new Promise((resolve, reject) => {
      const request = db
        .transaction("pending")
        .objectStore("pending")
        .get(code);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(new Error("Secure recovery storage could not be read."));
    });
  } finally {
    db.close();
  }
}

function encode(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function pendingRecoveryCredential(code: string): Promise<string> {
  const pending = await readPending(code);
  if (pending) {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: pending.iv },
      pending.key,
      pending.ciphertext,
    );
    return new TextDecoder().decode(plain);
  }
  const secret = crypto.getRandomValues(new Uint8Array(32));
  const credential = `${crypto.randomUUID()}.${encode(secret)}`;
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(credential),
  );
  const db = await openVault();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("pending", "readwrite");
      transaction.objectStore("pending").add({ code, key, iv, ciphertext });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(new Error("Secure recovery storage could not be saved."));
      transaction.onabort = () =>
        reject(new Error("Secure recovery storage could not be saved."));
    });
  } finally {
    db.close();
  }
  return credential;
}

export async function clearPendingRecovery(code: string) {
  const db = await openVault();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("pending", "readwrite");
      transaction.objectStore("pending").delete(code);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(new Error("Secure recovery storage could not be cleared."));
      transaction.onabort = () =>
        reject(new Error("Secure recovery storage could not be cleared."));
    });
  } finally {
    db.close();
  }
}
