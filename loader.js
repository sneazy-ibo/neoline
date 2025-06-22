(async () => {
  const [html, js] = await Promise.all(['index.html', 'main.js'].map(f =>
    fetch(`https://raw.githubusercontent.com/sneazy-ibo/neoline/refs/heads/altair/${f}?cb=${Date.now()}`).then(r => r.text())
  ));

  document.open();
  document.write(html);
  document.close();

  document.addEventListener('DOMContentLoaded', () =>
    document.head.appendChild(Object.assign(document.createElement('script'), { textContent: js }))
  );
})();