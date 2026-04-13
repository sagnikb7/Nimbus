export async function captureShareCard(element) {
  const html2canvas = (await import('html2canvas')).default;
  return html2canvas(element, {
    backgroundColor: null,
    scale: 2,
    logging: false,
    useCORS: true,
  });
}

export async function shareOrDownload(canvas, city) {
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  const file = new File([blob], `${city}-weather.png`, { type: 'image/png' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `Weather in ${city}`,
        text: `Current weather in ${city} — nimbus-weather-2026.netlify.app`,
      });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }

  // Fallback: download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${city}-weather.png`;
  a.click();
  URL.revokeObjectURL(url);
}
