document.addEventListener('DOMContentLoaded', function () {
  const elems = document.querySelectorAll('code.language-mermaid');
  elems.forEach((elem) => {
    elem.classList.replace('language-mermaid', 'mermaid');
  });
});
