document.addEventListener('DOMContentLoaded', function () {
  // Mermaidのコードブロックを、ハイライトではなくMermaidとして思慮できるようにクラスを変更
  const elems = document.querySelectorAll('.content code.language-mermaid');
  elems.forEach((elem) => {
    elem.classList.replace('language-mermaid', 'mermaid');
  });
});
