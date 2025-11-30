export async function downloadReceipt(studentId: string | null, title: string) {
  try {
    const res = await fetch(
      `/api/receipt?studentId=${encodeURIComponent(
        studentId!
      )}&title=${encodeURIComponent(title)}`
    );

    // App Router Response might not have ok; check status
    if (res.status !== 200) {
      throw new Error('Failed to generate receipt');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${studentId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading receipt:', error);
  }
}
