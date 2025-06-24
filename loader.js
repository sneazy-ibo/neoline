(async () => {
  const baseUrl = 'https://raw.githubusercontent.com/sneazy-ibo/neoline/refs/heads/altair/';
  const files = ['index.html', 'main.js', 'tools/room.js', 'tools/room.css'];

  const contents = await Promise.all(
    files.map(f => fetch(`${baseUrl}${f}?cb=${Date.now()}`).then(r => r.text()))
  );

  document.open();
  document.write(contents[0]);
  document.close();

  document.addEventListener('DOMContentLoaded', () =>
    files.slice(1).forEach((file, i) => {
      const el = document.createElement(file.endsWith('.css') ? 'style' : 'script');
      el.textContent = contents[i + 1];
      document.head.appendChild(el);
    })
  );
})();