(() => {
  "use strict";

  const htmlURL = `https://raw.githubusercontent.com/sneazy-ibo/neoline/refs/heads/altair/index.html?cb=${Date.now()}`;

  async function loadHTML() {
    try {
      const response = await fetch(htmlURL);
      if (!response.ok) throw new Error(`Failed to fetch HTML: ${response.status}`);
      const html = await response.text();
      document.open();
      document.write(html);
      document.close();
    } catch (error) {
      console.error("Error loading HTML:", error);
    }
  }

  loadHTML();
})();