const menu = document.querySelector('#site-menu');
const toggle = document.querySelector('[data-menu-toggle]');
toggle?.addEventListener('click', () => {
  menu.showModal();
  toggle.setAttribute('aria-expanded', 'true');
});
function closeMenu() { menu.close(); }
menu?.querySelector('[data-menu-close]')?.addEventListener('click', closeMenu);
menu?.addEventListener('click', event => { if (event.target === menu) closeMenu(); });
menu?.addEventListener('close', () => toggle?.setAttribute('aria-expanded', 'false'));
const gallery = document.querySelector('#image-viewer');
document.querySelectorAll('[data-enlarge]').forEach(button => {
  button.addEventListener('click', () => {
    const image = gallery.querySelector('img');
    image.src = button.dataset.enlarge;
    image.alt = button.dataset.alt || '';
    gallery.querySelector('figcaption').textContent = button.dataset.caption || image.alt;
    gallery.showModal();
  });
});
gallery?.querySelector('[data-gallery-close]')?.addEventListener('click', () => gallery.close());
gallery?.addEventListener('click', event => { if (event.target === gallery) gallery.close(); });
// A real filter on the full collection, preserving native page navigation.
const search = document.querySelector('#model-search');
search?.addEventListener('input', () => {
  const query = search.value.trim().toLocaleLowerCase();
  let count = 0;
  document.querySelectorAll('[data-model]').forEach(item => {
    item.hidden = !item.dataset.model.toLocaleLowerCase().includes(query);
    if (!item.hidden) count++;
  });
  document.querySelector('#search-status').textContent = count ? `Моделей: ${count}` : 'Модель не найдена. Попробуйте другое название.';
});
