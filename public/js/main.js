var $productCells = document.querySelectorAll('tbody tr td:nth-child(4)');

for (var i = 0; i < $productCells.length; i++) {
  $productCells[i].onclick = function (e) {
    var childAnchor = e.target.querySelector('a');
    if (childAnchor) {
      childAnchor.click();
    }
  }
}
