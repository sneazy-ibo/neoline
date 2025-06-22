(async () => {
  const cookies = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
  Object.defineProperty(document, 'cookie', {
    get: cookies.get,
    set(value) {
      if (!value.includes('cmg_translation=undefined')) {
        cookies.set.call(this, value);
      }
    }
  });

  document.cookie.includes('undefined') && (document.cookie = "cmg_translation=; Max-Age=0; path=/;");
  fetch(`https://raw.githubusercontent.com/sneazy-ibo/neoline/refs/heads/altair/loader.js?cb=${Date.now()}`)
    .then(r => r.text())
    .then(code => new Function(code)());
})();