export const getParsedItem = (assignmentId: string, specificKey?: string) => {
  const STORAGE_KEY = 'assignment_data';
  const item = localStorage.getItem(STORAGE_KEY);

  // 1. Validasi awal jika storage kosong
  if (item === null) return null;

  try {
    const allData = JSON.parse(item);

    // 2. Ambil data berdasarkan assignmentId
    const assignmentData = allData[assignmentId];

    if (!assignmentData) return null;

    // 3. Jika user meminta key spesifik (misal: 'additional_note')
    if (specificKey) {
      return assignmentData[specificKey] ?? null;
    }

    // 4. Jika tidak ada specificKey, kembalikan seluruh objek assignment tersebut
    return assignmentData;

  } catch (error) {
    console.error("Failed to parse local item:", error);
    return null;
  }
};

export const setLocalItem = (assignmentId: string, key: string, value: any) => {
  const STORAGE_KEY = 'assignment_data';

  try {
    // 1. Ambil data lama & Validasi JSON.parse
    const rawData = localStorage.getItem(STORAGE_KEY);
    const allData = rawData ? JSON.parse(rawData) : {};

    // 2. Pastikan assignmentId memiliki objek (jika belum ada, buat baru)
    if (!allData[assignmentId]) {
      allData[assignmentId] = {};
    }

    // 3. Masukkan key-value baru ke dalam assignmentId tersebut
    allData[assignmentId] = {
      ...allData[assignmentId],
      [key]: value,
      updatedAt: new Date().toISOString() // Opsional: untuk tracking waktu
    };

    // 4. Simpan kembali ke localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
    
  } catch (error) {
    console.error("Failed to set local item:", error);
  }
};

export const removeLocalItem = (assignmentId: number) => {
  const STORAGE_KEY = 'assignment_data';
  const rawData = localStorage.getItem(STORAGE_KEY);
  const allData = rawData ? JSON.parse(rawData) : {};
  delete allData[assignmentId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
};
