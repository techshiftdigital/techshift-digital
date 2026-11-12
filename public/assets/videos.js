(() => {
  "use strict";

  const root = document.querySelector("[data-video-library]");
  if (!root) return;

  const grid = root.querySelector("[data-video-grid]");
  const search = root.querySelector("[data-video-search]");
  const status = root.querySelector("[data-video-status]");

  if (!grid || !status) return;

  const locale = ["en", "es", "pt-br"].includes(root.dataset.locale)
    ? root.dataset.locale
    : "en";

  const category = root.dataset.category || "All";

  const labels = {
    en: {
      watch: "Watch on YouTube ↗",
      results: "results",
      error: "Unable to load the video library."
    },
    es: {
      watch: "Ver en YouTube ↗",
      results: "resultados",
      error: "No se pudo cargar la biblioteca de vídeos."
    },
    "pt-br": {
      watch: "Assistir no YouTube ↗",
      results: "resultados",
      error: "Não foi possível carregar a biblioteca de vídeos."
    }
  };

  let videos = [];

  function escapeHtml(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[char]
    );
  }

  function localizedText(value) {
    if (typeof value === "string") return value;

    if (value && typeof value === "object") {
      return value[locale] || value.en || "";
    }

    return "";
  }

  function validVideoId(value) {
    const id = String(value ?? "").trim();

    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : "";
  }

  function videoUrl(video) {
    const id = validVideoId(
      video.videoId || video.youtubeId
    );

    return id
      ? `https://www.youtube.com/watch?v=${id}`
      : "";
  }

  function thumbnailUrl(video) {
    const id = validVideoId(
      video.videoId || video.youtubeId
    );

    return id
      ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
      : "";
  }

  function createCard(video) {
    const title = escapeHtml(localizedText(video.title));
    const description = escapeHtml(
      localizedText(video.description)
    );

    const categoryName = escapeHtml(video.category || "");
    const url = videoUrl(video);
    const thumbnail = thumbnailUrl(video);

    if (!url || !thumbnail) return "";

    return `
      <article class="card video-card">

        <a
          class="video-thumbnail-link"
          href="${escapeHtml(url)}"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="${title}"
          style="display:block;aspect-ratio:16/9;overflow:hidden;"
        >
          <img
            class="video-thumbnail"
            src="${escapeHtml(thumbnail)}"
            alt="${title}"
            loading="lazy"
            decoding="async"
            width="480"
            height="270"
            style="display:block;width:100%;height:100%;object-fit:cover;"
            data-video-thumbnail
            data-video-id="${escapeHtml(
              video.videoId || video.youtubeId
            )}"
          >
        </a>

        <div class="card-body">

          <span class="tag">${categoryName}</span>

          <h2 class="video-title">
            <a
              href="${escapeHtml(url)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              ${title}
            </a>
          </h2>

          <p>${description}</p>

          <a
            class="textlink"
            href="${escapeHtml(url)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            ${labels[locale].watch}
          </a>

        </div>

      </article>
    `;
  }

  function applyThumbnailFallback() {
    const images = grid.querySelectorAll(
      "img[data-video-thumbnail]"
    );

    images.forEach(image => {
      image.addEventListener("error", () => {
        if (image.dataset.fallbackApplied) return;

        image.dataset.fallbackApplied = "true";

        const id = validVideoId(image.dataset.videoId);

        if (id) {
          image.src =
            `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
        }
      });
    });
  }

  function render() {
    const query = String(search?.value || "")
      .trim()
      .toLowerCase();

    const filtered = videos.filter(video => {
      const matchesCategory =
        category === "All" ||
        String(video.category || "").toLowerCase() ===
          category.toLowerCase();

      const searchableText = [
        localizedText(video.title),
        localizedText(video.description),
        video.category || ""
      ].join(" ").toLowerCase();

      return matchesCategory &&
        (!query || searchableText.includes(query));
    });

    status.textContent =
      `${filtered.length} ${labels[locale].results}`;

    grid.innerHTML = filtered.map(createCard).join("");

    applyThumbnailFallback();
  }

  fetch("/data/videos.json", {
    cache: "no-cache"
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("Video data request failed");
      }

      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data)) {
        throw new Error("Invalid video data");
      }

      videos = data;
      render();
    })
    .catch(error => {
      console.error("TechShift video library:", error);
      status.textContent = labels[locale].error;
    });

  search?.addEventListener("input", render);

})();
